<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebhookEvent;
use App\Models\Ticket;
use App\Models\Message;
use Illuminate\Http\Request;

class WebhookEventController extends Controller
{
    /**
     * Lista eventos pendentes
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

        // Processar mensagem recebida
        try {
            $this->processEvolutionWebhook($request->all(), $event);
        } catch (\Exception $e) {
            $event->update([
                'status' => 'error',
                'error_message' => $e->getMessage(),
            ]);
        }

        return response()->json(['success' => true, 'id' => $event->id], 201);
    }

    /**
     * Processa webhook da Evolution e cria ticket + mensagem
     */
    private function processEvolutionWebhook(array $payload, WebhookEvent $event)
    {
        $eventType = $payload['event'] ?? null;

        // Só processar mensagens recebidas
        if ($eventType !== 'messages.upsert') {
            $event->update(['status' => 'ignored']);
            return;
        }

        $data = $payload['data'] ?? [];
        $key = $data['key'] ?? [];

        // Ignorar mensagens enviadas por nós (fromMe)
        if ($key['fromMe'] ?? false) {
            $event->update(['status' => 'ignored']);
            return;
        }

        // Extrair dados do remetente
        $remoteJid = $key['remoteJid'] ?? '';
        $phone = $this->extractPhone($remoteJid);
        $contactName = $data['pushName'] ?? $phone;
        $instanceName = $payload['instance'] ?? '';

        // Extrair conteúdo da mensagem
        $messageText = $this->extractMessageText($data);
        $mediaUrl = $this->extractMediaUrl($data);
        $mediaType = $data['messageType'] ?? null;

        if (!$phone || !$messageText) {
            $event->update(['status' => 'ignored', 'error_message' => 'Sem telefone ou texto']);
            return;
        }

        // Encontrar ou criar ticket para esse contato
        $ticket = Ticket::where('customerPhone', $phone)
            ->where('channel', 'whatsapp')
            ->whereIn('status', ['open', 'pending'])
            ->first();

        if (!$ticket) {
            $ticket = Ticket::create([
                'customerName' => $contactName,
                'customerPhone' => $phone,
                'channel' => 'whatsapp',
                'status' => 'open',
                'subject' => "WhatsApp - {$contactName}",
                'lastMessage' => $messageText,
                'inbox' => $instanceName,
                'fromWebhook' => true,
            ]);
        } else {
            $ticket->update([
                'lastMessage' => $messageText,
                'customerName' => $contactName,
                'updated_at' => now(),
            ]);
        }

        // Criar mensagem no ticket
        Message::create([
            'ticket_id' => $ticket->id,
            'sender' => 'customer',
            'text' => $messageText,
            'fromWebhook' => true,
            'mediaUrl' => $mediaUrl,
            'mediaType' => ($mediaType !== 'conversation' && $mediaType !== 'extendedTextMessage') ? $mediaType : null,
        ]);

        // Marcar evento como processado
        $event->update(['status' => 'processed']);
    }

    /**
     * Extrai número de telefone do JID do WhatsApp
     */
    private function extractPhone(string $jid): string
    {
        // 556699616110@s.whatsapp.net -> 556699616110
        return preg_replace('/@.*$/', '', $jid);
    }

    /**
     * Extrai texto da mensagem do payload da Evolution
     */
    private function extractMessageText(array $data): string
    {
        $message = $data['message'] ?? [];

        // Mensagem de texto simples
        if (isset($message['conversation'])) {
            return $message['conversation'];
        }

        // Texto estendido (com link preview, etc)
        if (isset($message['extendedTextMessage']['text'])) {
            return $message['extendedTextMessage']['text'];
        }

        // Imagem com legenda
        if (isset($message['imageMessage']['caption'])) {
            return '📷 ' . $message['imageMessage']['caption'];
        }
        if (isset($message['imageMessage'])) {
            return '📷 Imagem';
        }

        // Vídeo
        if (isset($message['videoMessage']['caption'])) {
            return '🎥 ' . $message['videoMessage']['caption'];
        }
        if (isset($message['videoMessage'])) {
            return '🎥 Vídeo';
        }

        // Áudio
        if (isset($message['audioMessage'])) {
            return '🎵 Áudio';
        }

        // Documento
        if (isset($message['documentMessage'])) {
            $fileName = $message['documentMessage']['fileName'] ?? 'Documento';
            return '📄 ' . $fileName;
        }

        // Sticker
        if (isset($message['stickerMessage'])) {
            return '🏷️ Sticker';
        }

        // Localização
        if (isset($message['locationMessage'])) {
            return '📍 Localização';
        }

        // Contato
        if (isset($message['contactMessage'])) {
            return '👤 Contato compartilhado';
        }

        return $data['messageType'] ?? 'Mensagem';
    }

    /**
     * Extrai URL de mídia se disponível
     */
    private function extractMediaUrl(array $data): ?string
    {
        $message = $data['message'] ?? [];

        foreach (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'] as $type) {
            if (isset($message[$type]['url'])) {
                return $message[$type]['url'];
            }
            if (isset($message[$type]['mediaUrl'])) {
                return $message[$type]['mediaUrl'];
            }
        }

        return null;
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
