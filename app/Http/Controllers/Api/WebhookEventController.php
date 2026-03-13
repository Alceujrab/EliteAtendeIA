<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebhookEvent;
use App\Models\Ticket;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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

        // Ignorar Status (Story) e Broadcast
        if ($remoteJid === 'status@broadcast' || str_contains($remoteJid, '@broadcast')) {
            $event->update(['status' => 'ignored', 'error_message' => 'Status ou broadcast ignorado']);
            return;
        }

        $isGroup = str_contains($remoteJid, '@g.us');
        $phone = $this->extractPhone($remoteJid);
        $pushName = $data['pushName'] ?? '';
        
        // Se for grupo, o nome do ticket será "Grupo" + final do número
        if ($isGroup) {
            $contactName = "Grupo WhatsApp (" . substr($phone, -4) . ")";
        } else {
            // Filtrar nomes inválidos (. ou vazio)
            $contactName = ($pushName && $pushName !== '.' && strlen(trim($pushName)) > 1)
                ? $pushName
                : $this->formatPhone($phone);
        }
        $instanceName = $payload['instance'] ?? '';

        // Extrair conteúdo da mensagem
        $messageText = $this->extractMessageText($data);
        $mediaUrl = $this->extractMediaUrl($data);
        $rawMediaType = $data['messageType'] ?? null;
        // Normalizar mediaType: imageMessage → image, audioMessage → audio, etc.
        $mediaType = $this->normalizeMediaType($rawMediaType);

        if (!$phone || !$messageText) {
            $event->update(['status' => 'ignored', 'error_message' => 'Sem telefone ou texto']);
            return;
        }

        // Buscar foto de perfil via Evolution API (se disponível)
        $profilePicUrl = null;
        $serverUrl = $payload['server_url'] ?? null;
        $apikey = $payload['apikey'] ?? null;
        if ($serverUrl && $apikey && $instanceName) {
            try {
                $picResponse = Http::timeout(5)
                    ->withHeaders(['apikey' => $apikey])
                    ->post(rtrim($serverUrl, '/') . "/chat/fetchProfilePictureUrl/{$instanceName}", [
                        'number' => $remoteJid,
                    ]);
                if ($picResponse->successful()) {
                    $profilePicUrl = $picResponse->json('profilePictureUrl') ?? $picResponse->json('profilePicUrl') ?? null;
                }
            } catch (\Exception $e) {
                // Silently ignore - photo is optional
            }
        }

        // Encontrar ticket existente para esse contato (busca robusta)
        // Limpar telefone para apenas dígitos
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        
        $ticket = Ticket::where('channel', 'whatsapp')
            ->whereIn('status', ['open', 'pending'])
            ->where(function ($query) use ($phone, $cleanPhone) {
                $query->where('customerPhone', $phone)
                      ->orWhere('customerPhone', $cleanPhone)
                      ->orWhere('customerPhone', 'LIKE', '%' . substr($cleanPhone, -10) . '%');
            })
            ->orderBy('updated_at', 'desc')
            ->first();

        if (!$ticket) {
            $ticket = Ticket::create([
                'customerName' => $contactName,
                'customerPhone' => $cleanPhone, // Sempre salvar apenas dígitos
                'customerAvatar' => $profilePicUrl,
                'channel' => 'whatsapp',
                'status' => 'open',
                'subject' => "WhatsApp - {$contactName}",
                'lastMessage' => $messageText,
                'inbox' => $instanceName,
                'fromWebhook' => true,
            ]);
        } else {
            $updateData = [
                'lastMessage' => $messageText,
                'updated_at' => now(),
            ];
            // Atualizar nome se o novo for melhor
            if ($contactName && $contactName !== $phone && $contactName !== $cleanPhone) {
                $updateData['customerName'] = $contactName;
            }
            // Normalizar phone para apenas dígitos
            if ($ticket->customerPhone !== $cleanPhone) {
                $updateData['customerPhone'] = $cleanPhone;
            }
            // Atualizar foto se disponível e ticket não tem
            if ($profilePicUrl && !$ticket->customerAvatar) {
                $updateData['customerAvatar'] = $profilePicUrl;
            }
            $ticket->update($updateData);
        }

        // Criar mensagem no ticket
        Message::create([
            'ticket_id' => $ticket->id,
            'sender' => 'customer',
            'text' => $messageText,
            'fromWebhook' => true,
            'mediaUrl' => $mediaUrl,
            'mediaType' => $mediaType,
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
     * Formata número de telefone para exibição
     */
    private function formatPhone(string $phone): string
    {
        if (strlen($phone) >= 12) {
            // Ex: 556699616110 -> +55 (66) 99616-1110
            return '+' . substr($phone, 0, 2) . ' (' . substr($phone, 2, 2) . ') ' . substr($phone, 4, 5) . '-' . substr($phone, 9);
        }
        return $phone;
    }

    /**
     * Normaliza o mediaType da Evolution API para o formato do frontend
     */
    private function normalizeMediaType(?string $type): ?string
    {
        if (!$type) return null;

        $map = [
            'conversation' => null,
            'extendedTextMessage' => null,
            'imageMessage' => 'image',
            'videoMessage' => 'video',
            'audioMessage' => 'audio',
            'documentMessage' => 'document',
            'documentWithCaptionMessage' => 'document',
            'stickerMessage' => 'image',
            'locationMessage' => null,
            'contactMessage' => null,
            'contactsArrayMessage' => null,
        ];

        if (array_key_exists($type, $map)) {
            return $map[$type];
        }

        // Se já está normalizado (image, video, audio, document)
        if (in_array($type, ['image', 'video', 'audio', 'document'])) {
            return $type;
        }

        return null;
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
