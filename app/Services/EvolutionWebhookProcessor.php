<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Message;
use App\Models\Ticket;
use App\Models\WebhookEvent;
use Illuminate\Support\Facades\Http;

class EvolutionWebhookProcessor
{
    public function process(WebhookEvent $event): void
    {
        $payload = json_decode((string) $event->payload, true);

        if (!is_array($payload)) {
            $event->update([
                'status' => 'error',
                'error_message' => 'Payload invalido',
            ]);
            return;
        }

        $eventType = $payload['event'] ?? null;
        if ($eventType !== 'messages.upsert') {
            $event->update(['status' => 'ignored']);
            return;
        }

        $data = $payload['data'] ?? [];
        $key = $data['key'] ?? [];

        if ($key['fromMe'] ?? false) {
            $event->update(['status' => 'ignored']);
            return;
        }

        $remoteJid = $key['remoteJid'] ?? '';
        if ($remoteJid === 'status@broadcast' || str_contains($remoteJid, '@broadcast')) {
            $event->update([
                'status' => 'ignored',
                'error_message' => 'Status ou broadcast ignorado',
            ]);
            return;
        }

        $phone = $this->extractPhone($remoteJid);
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);

        if (!$cleanPhone) {
            $event->update([
                'status' => 'ignored',
                'error_message' => 'Telefone nao identificado',
            ]);
            return;
        }

        $isGroup = str_contains($remoteJid, '@g.us');
        $pushName = $data['pushName'] ?? '';
        $contactName = $isGroup
            ? 'Grupo WhatsApp (' . substr($cleanPhone, -4) . ')'
            : (($pushName && $pushName !== '.' && strlen(trim($pushName)) > 1)
                ? $pushName
                : $this->formatPhone($cleanPhone));

        $instanceName = (string) ($payload['instance'] ?? '');
        $messageText = $this->extractMessageText($data);
        $mediaUrl = $this->extractMediaUrl($data);
        $rawMediaType = $data['messageType'] ?? null;
        $mediaType = $this->normalizeMediaType($rawMediaType);

        if (!$messageText) {
            $event->update([
                'status' => 'ignored',
                'error_message' => 'Sem texto de mensagem',
            ]);
            return;
        }

        $profilePicUrl = $this->fetchProfilePicture($payload, $remoteJid, $instanceName);

        $this->upsertLegacyTicket($cleanPhone, $contactName, $messageText, $mediaUrl, $mediaType, $instanceName, $profilePicUrl);
        $this->upsertConversationInbox($cleanPhone, $contactName, $messageText, $mediaUrl, $mediaType, $profilePicUrl);

        $event->update([
            'status' => 'processed',
            'error_message' => null,
        ]);
    }

    private function upsertLegacyTicket(
        string $cleanPhone,
        string $contactName,
        string $messageText,
        ?string $mediaUrl,
        ?string $mediaType,
        string $instanceName,
        ?string $profilePicUrl
    ): void {
        $ticket = Ticket::where('channel', 'whatsapp')
            ->whereIn('status', ['open', 'pending'])
            ->where(function ($query) use ($cleanPhone) {
                $query->where('customerPhone', $cleanPhone)
                    ->orWhere('customerPhone', 'LIKE', '%' . substr($cleanPhone, -10) . '%');
            })
            ->orderByDesc('updated_at')
            ->first();

        if (!$ticket) {
            $ticket = Ticket::create([
                'customerName' => $contactName,
                'customerPhone' => $cleanPhone,
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

            if ($contactName && $contactName !== $cleanPhone) {
                $updateData['customerName'] = $contactName;
            }

            if ($ticket->customerPhone !== $cleanPhone) {
                $updateData['customerPhone'] = $cleanPhone;
            }

            if ($profilePicUrl && !$ticket->customerAvatar) {
                $updateData['customerAvatar'] = $profilePicUrl;
            }

            $ticket->update($updateData);
        }

        Message::create([
            'ticket_id' => $ticket->id,
            'sender' => 'customer',
            'text' => $messageText,
            'fromWebhook' => true,
            'mediaUrl' => $mediaUrl,
            'mediaType' => $mediaType,
        ]);
    }

    private function upsertConversationInbox(
        string $cleanPhone,
        string $contactName,
        string $messageText,
        ?string $mediaUrl,
        ?string $mediaType,
        ?string $profilePicUrl
    ): void {
        $contact = Contact::where('phone', $cleanPhone)->first();

        if (!$contact) {
            $contact = Contact::create([
                'name' => $contactName,
                'phone' => $cleanPhone,
                'avatar' => $profilePicUrl,
                'status' => 'active',
            ]);
        } else {
            $updateData = [];

            if ($contactName && $contact->name !== $contactName) {
                $updateData['name'] = $contactName;
            }

            if ($profilePicUrl && !$contact->avatar) {
                $updateData['avatar'] = $profilePicUrl;
            }

            if (!empty($updateData)) {
                $contact->update($updateData);
            }
        }

        $conversation = Conversation::where('contact_id', $contact->id)
            ->where('channel', 'whatsapp')
            ->whereIn('status', ['open', 'resolved'])
            ->orderByDesc('updated_at')
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'contact_id' => $contact->id,
                'channel' => 'whatsapp',
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        } else {
            $conversation->update([
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        }

        ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'user_id' => null,
            'type' => $this->conversationMessageType($mediaType),
            'body' => $messageText,
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            'is_internal_note' => false,
        ]);
    }

    private function fetchProfilePicture(array $payload, string $remoteJid, string $instanceName): ?string
    {
        $serverUrl = $payload['server_url'] ?? null;
        $apiKey = $payload['apikey'] ?? null;

        if (!$serverUrl || !$apiKey || !$instanceName) {
            return null;
        }

        try {
            $picResponse = Http::timeout(5)
                ->withHeaders(['apikey' => $apiKey])
                ->post(rtrim((string) $serverUrl, '/') . "/chat/fetchProfilePictureUrl/{$instanceName}", [
                    'number' => $remoteJid,
                ]);

            if ($picResponse->successful()) {
                return $picResponse->json('profilePictureUrl') ?? $picResponse->json('profilePicUrl');
            }
        } catch (\Throwable $e) {
            // Foto e opcional. Evita falhar o processamento por esse motivo.
        }

        return null;
    }

    private function extractPhone(string $jid): string
    {
        return preg_replace('/@.*$/', '', $jid);
    }

    private function formatPhone(string $phone): string
    {
        if (strlen($phone) >= 12) {
            return '+' . substr($phone, 0, 2) . ' (' . substr($phone, 2, 2) . ') ' . substr($phone, 4, 5) . '-' . substr($phone, 9);
        }

        return $phone;
    }

    private function normalizeMediaType(?string $type): ?string
    {
        if (!$type) {
            return null;
        }

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

        if (in_array($type, ['image', 'video', 'audio', 'document'], true)) {
            return $type;
        }

        return null;
    }

    private function conversationMessageType(?string $mediaType): string
    {
        if (in_array($mediaType, ['audio', 'image', 'video', 'document'], true)) {
            return $mediaType;
        }

        return 'text';
    }

    private function extractMessageText(array $data): string
    {
        $message = $data['message'] ?? [];

        if (isset($message['conversation'])) {
            return $message['conversation'];
        }

        if (isset($message['extendedTextMessage']['text'])) {
            return $message['extendedTextMessage']['text'];
        }

        if (isset($message['imageMessage']['caption'])) {
            return 'Imagem: ' . $message['imageMessage']['caption'];
        }

        if (isset($message['imageMessage'])) {
            return 'Imagem';
        }

        if (isset($message['videoMessage']['caption'])) {
            return 'Video: ' . $message['videoMessage']['caption'];
        }

        if (isset($message['videoMessage'])) {
            return 'Video';
        }

        if (isset($message['audioMessage'])) {
            return 'Audio';
        }

        if (isset($message['documentMessage'])) {
            $fileName = $message['documentMessage']['fileName'] ?? 'Documento';
            return 'Documento: ' . $fileName;
        }

        if (isset($message['stickerMessage'])) {
            return 'Sticker';
        }

        if (isset($message['locationMessage'])) {
            return 'Localizacao';
        }

        if (isset($message['contactMessage'])) {
            return 'Contato compartilhado';
        }

        return (string) ($data['messageType'] ?? 'Mensagem');
    }

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
}
