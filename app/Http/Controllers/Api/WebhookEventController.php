<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessEvolutionWebhookJob;
use App\Models\WebhookEvent;
use App\Models\Ticket;
use App\Models\Message;
use Illuminate\Http\Request;

class WebhookEventController extends Controller
{
    /**
     * Lista eventos pendentes
     */
    public function index(Request $request)
    {
        // Forçar retorno vazio para matar o polling de abas antigas abertas
        // que esgotam as conexões MySQL (max_user_connections)
        return response()->json([]);
    }

    public function cleanupDuplicates()
    {
        // First duplicate tickets by same customerPhone and inbox
        $phones = \App\Models\Ticket::select('customerPhone')
            ->whereNotNull('customerPhone')
            ->groupBy('customerPhone')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('customerPhone');

        $deletedCount = 0;
        foreach ($phones as $phone) {
            $tickets = \App\Models\Ticket::where('customerPhone', $phone)
                ->orderBy('created_at', 'desc')
                ->get();

            if ($tickets->count() > 1) {
                // Keep the most recent OR the one that's not 'whatsapp_xxx' if possible
                $keep = $tickets->first(function($t) {
                    return !str_starts_with($t->id, 'whatsapp_');
                }) ?? $tickets->first();

                foreach ($tickets as $t) {
                    if ($t->id !== $keep->id) {
                        \App\Models\Message::where('ticket_id', $t->id)->update(['ticket_id' => $keep->id]);
                        $t->delete();
                        $deletedCount++;
                    }
                }
            }
        }
        
        // Also clean up any lingering 'whatsapp_xxx' tickets that might be orphaned empty
        $badTickets = \App\Models\Ticket::where('id', 'like', 'whatsapp_%')->get();
        foreach ($badTickets as $bt) {
            if ($bt->messages()->count() === 0) {
                $bt->delete();
                $deletedCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Limpeza concluída. {$deletedCount} tickets removidos ou mesclados."
        ]);
    }

    /**
     * Recebe webhook da Evolution API (WhatsApp)
     */
    public function storeEvolution(Request $request)
    {
        // GET = teste de verificação
        if ($request->isMethod('get')) {
            return response()->json([
                'status' => 'ok',
                'message' => '✅ Webhook Evolution está ativo e pronto para receber mensagens.',
                'method' => 'POST para enviar dados',
            ]);
        }

        // Salvar evento bruto
        $event = WebhookEvent::create([
            'source' => 'evolution',
            'payload' => json_encode($request->all()),
            'status' => 'pending',
        ]);

        // Processamento assíncrono evita timeout e desacopla ingestao de webhook.
        ProcessEvolutionWebhookJob::dispatch($event->id);

        return response()->json(['success' => true, 'id' => $event->id], 201);
    }

    /**
     * Recebe webhook do Instagram
     */
    public function storeInstagram(Request $request)
    {
        if ($request->isMethod('get')) {
            $verifyToken = config('services.instagram.verify_token', 'elite_verify_token');
            if ($request->input('hub_verify_token') === $verifyToken) {
                return response($request->input('hub_challenge'), 200);
            }
            return response('Forbidden', 403);
        }

        $event = WebhookEvent::create([
            'source' => 'instagram',
            'payload' => json_encode($request->all()),
            'status' => 'pending',
        ]);
        return response()->json(['success' => true, 'id' => $event->id], 201);
    }

    /**
     * Exclui evento
     */
    public function destroy(string $id)
    {
        $event = WebhookEvent::find($id);
        if ($event) {
            $event->delete();
        }
        return response()->json(null, 204);
    }
}
