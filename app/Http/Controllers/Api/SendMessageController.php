<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inbox;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SendMessageController extends Controller
{
    /**
     * Envia mensagem via WhatsApp (Evolution API)
     */
    public function whatsapp(Request $request)
    {
        $request->validate([
            'recipientId' => 'required|string',
            'text' => 'required|string',
        ]);

        $settings = $request->input('settings', []);
        $recipientId = $request->input('recipientId');
        $text = $request->input('text');

        $apiUrl = $settings['evolutionApiUrl'] ?? null;
        $apiKey = $settings['evolutionApiKey'] ?? null;
        $instance = $settings['evolutionInstance'] ?? null;

        if (!$apiUrl || !$apiKey || !$instance) {
            // Tentar buscar das inboxes
            $inbox = Inbox::where('channel', 'whatsapp')->first();
            if ($inbox && $inbox->settings) {
                $s = $inbox->settings;
                $apiUrl = $apiUrl ?: ($s['evolutionApiUrl'] ?? null);
                $apiKey = $apiKey ?: ($s['evolutionApiKey'] ?? null);
                $instance = $instance ?: ($s['evolutionInstance'] ?? null);
            }
        }

        if (!$apiUrl || !$apiKey || !$instance) {
            return response()->json([
                'success' => false,
                'error' => 'Configurações da Evolution API incompletas. Configure na página de Integrações.',
            ], 422);
        }

        $apiUrl = rtrim($apiUrl, '/');

        // Formatar número para JID do WhatsApp
        $jid = preg_replace('/[^0-9]/', '', $recipientId);
        if (!str_contains($jid, '@')) {
            $jid = $jid . '@s.whatsapp.net';
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'apikey' => $apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$apiUrl}/message/sendText/{$instance}", [
                    'number' => $jid,
                    'text' => $text,
                ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'data' => $response->json(),
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => "Erro Evolution API: HTTP {$response->status()}",
                    'details' => $response->json(),
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Falha ao enviar: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Envia mídia via WhatsApp (Evolution API)
     */
    public function whatsappMedia(Request $request)
    {
        $request->validate([
            'recipientId' => 'required|string',
            'mediaUrl' => 'required|string',
            'mediaType' => 'required|in:image,video,audio,document',
        ]);

        $settings = $request->input('settings', []);
        $recipientId = $request->input('recipientId');
        $mediaUrl = $request->input('mediaUrl');
        $mediaType = $request->input('mediaType');

        $apiUrl = $settings['evolutionApiUrl'] ?? null;
        $apiKey = $settings['evolutionApiKey'] ?? null;
        $instance = $settings['evolutionInstance'] ?? null;

        if (!$apiUrl || !$apiKey || !$instance) {
            $inbox = Inbox::where('channel', 'whatsapp')->first();
            if ($inbox && $inbox->settings) {
                $s = $inbox->settings;
                $apiUrl = $apiUrl ?: ($s['evolutionApiUrl'] ?? null);
                $apiKey = $apiKey ?: ($s['evolutionApiKey'] ?? null);
                $instance = $instance ?: ($s['evolutionInstance'] ?? null);
            }
        }

        if (!$apiUrl || !$apiKey || !$instance) {
            return response()->json([
                'success' => false,
                'error' => 'Configurações da Evolution API incompletas.',
            ], 422);
        }

        $apiUrl = rtrim($apiUrl, '/');
        $jid = preg_replace('/[^0-9]/', '', $recipientId);
        if (!str_contains($jid, '@')) {
            $jid = $jid . '@s.whatsapp.net';
        }

        // Mapear tipo de mídia para endpoint da Evolution
        $endpointMap = [
            'image' => 'sendMedia',
            'video' => 'sendMedia',
            'audio' => 'sendWhatsAppAudio',
            'document' => 'sendMedia',
        ];

        $endpoint = $endpointMap[$mediaType] ?? 'sendMedia';

        try {
            $payload = [
                'number' => $jid,
                'mediatype' => $mediaType,
                'media' => $mediaUrl,
            ];

            $response = Http::timeout(30)
                ->withHeaders([
                    'apikey' => $apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$apiUrl}/message/{$endpoint}/{$instance}", $payload);

            return response()->json([
                'success' => $response->successful(),
                'data' => $response->json(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Falha ao enviar mídia: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Envia mensagem via Instagram (Meta API)
     */
    public function instagram(Request $request)
    {
        $request->validate([
            'recipientId' => 'required|string',
            'text' => 'required|string',
        ]);

        $settings = $request->input('settings', []);
        $token = $settings['instagramPageAccessToken'] ?? null;
        $pageId = $settings['instagramPageId'] ?? null;

        if (!$token || !$pageId) {
            $inbox = Inbox::where('channel', 'instagram')->first();
            if ($inbox && $inbox->settings) {
                $s = $inbox->settings;
                $token = $token ?: ($s['instagramPageAccessToken'] ?? null);
                $pageId = $pageId ?: ($s['instagramPageId'] ?? null);
            }
        }

        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'Page Access Token não configurado.',
            ], 422);
        }

        try {
            $response = Http::timeout(15)
                ->post("https://graph.facebook.com/v18.0/{$pageId}/messages", [
                    'recipient' => ['id' => $request->input('recipientId')],
                    'message' => ['text' => $request->input('text')],
                    'access_token' => $token,
                ]);

            return response()->json([
                'success' => $response->successful(),
                'data' => $response->json(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Falha ao enviar: ' . $e->getMessage(),
            ]);
        }
    }
}
