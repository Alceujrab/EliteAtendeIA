<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebhookEvent;
use Illuminate\Http\Request;

class WebhookEventController extends Controller
{
    /**
     * Lista eventos pendentes (não processados)
     */
    public function index()
    {
        return response()->json(
            WebhookEvent::pending()->orderBy('created_at', 'asc')->get()
        );
    }

    /**
     * Recebe webhook da Evolution API (WhatsApp)
     */
    public function storeEvolution(Request $request)
    {
        $event = WebhookEvent::create([
            'source' => 'evolution',
            'payload' => json_encode($request->all()),
            'status' => 'pending',
        ]);
        return response()->json(['success' => true, 'id' => $event->id], 201);
    }

    /**
     * Recebe webhook do Instagram
     */
    public function storeInstagram(Request $request)
    {
        // Verificação do webhook do Facebook/Instagram
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
     * Marca evento como processado / exclui
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
