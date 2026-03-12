<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    /**
     * Processa uma mensagem do chatbot usando IA
     */
    public function processMessage(Request $request)
    {
        $message = $request->input('message');
        $ticketId = $request->input('ticketId');
        $context = $request->input('context', []);

        if (!$message) {
            return response()->json(['error' => 'Mensagem não informada'], 400);
        }

        // Buscar configurações de automação
        $automationSetting = Setting::where('key', 'automation')->first();
        $prompt = 'Você é um assistente virtual da empresa. Responda de forma educada e profissional.';
        $botMode = 'smart';

        if ($automationSetting && $automationSetting->value) {
            $settings = $automationSetting->value;
            if (!empty($settings['prompt'])) {
                $prompt = $settings['prompt'];
            }
            if (!empty($settings['botMode'])) {
                $botMode = $settings['botMode'];
            }
        }

        // Modo de resposta rápida (sem IA)
        if ($botMode === 'quick') {
            return response()->json([
                'reply' => $this->getQuickReply($message),
                'mode' => 'quick'
            ]);
        }

        // Modo inteligente com IA (OpenAI ou similar)
        try {
            $apiKey = config('services.openai.key');
            
            if (!$apiKey) {
                // Se não tem API key, retorna resposta padrão
                return response()->json([
                    'reply' => $this->getQuickReply($message),
                    'mode' => 'fallback',
                    'note' => 'API key da OpenAI não configurada. Usando resposta padrão.'
                ]);
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => $prompt],
                    ...array_map(function ($ctx) {
                        return [
                            'role' => $ctx['sender'] === 'customer' ? 'user' : 'assistant',
                            'content' => $ctx['text']
                        ];
                    }, $context),
                    ['role' => 'user', 'content' => $message],
                ],
                'max_tokens' => 500,
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['choices'][0]['message']['content'] ?? 'Desculpe, não consegui processar sua mensagem.';
                
                return response()->json([
                    'reply' => $reply,
                    'mode' => 'ai'
                ]);
            }

            return response()->json([
                'reply' => $this->getQuickReply($message),
                'mode' => 'fallback',
                'note' => 'Erro na API da IA. Usando resposta padrão.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'reply' => $this->getQuickReply($message),
                'mode' => 'fallback',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Retorna o status do bot
     */
    public function status()
    {
        $automationSetting = Setting::where('key', 'automation')->first();
        
        $isEnabled = false;
        $botMode = 'smart';
        
        if ($automationSetting && $automationSetting->value) {
            $settings = $automationSetting->value;
            $isEnabled = $settings['isBotEnabled'] ?? false;
            $botMode = $settings['botMode'] ?? 'smart';
        }

        return response()->json([
            'enabled' => $isEnabled,
            'mode' => $botMode,
            'hasApiKey' => !empty(config('services.openai.key')),
        ]);
    }

    /**
     * Respostas rápidas pré-definidas
     */
    private function getQuickReply(string $message): string
    {
        $message = mb_strtolower(trim($message));
        
        $quickReplies = [
            'oi' => 'Olá! 👋 Bem-vindo! Como posso ajudá-lo hoje?',
            'olá' => 'Olá! 👋 Bem-vindo! Como posso ajudá-lo hoje?',
            'ola' => 'Olá! 👋 Bem-vindo! Como posso ajudá-lo hoje?',
            'bom dia' => 'Bom dia! ☀️ Como posso ajudá-lo?',
            'boa tarde' => 'Boa tarde! Como posso ajudá-lo?',
            'boa noite' => 'Boa noite! Como posso ajudá-lo?',
            'preço' => 'Para informações sobre preços, por favor informe qual produto ou serviço você tem interesse. Um de nossos atendentes retornará em breve!',
            'preco' => 'Para informações sobre preços, por favor informe qual produto ou serviço você tem interesse. Um de nossos atendentes retornará em breve!',
            'horário' => 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h, e sábado das 8h às 12h.',
            'horario' => 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h, e sábado das 8h às 12h.',
            'obrigado' => 'Por nada! 😊 Se precisar de mais alguma coisa, estou à disposição.',
            'obrigada' => 'Por nada! 😊 Se precisar de mais alguma coisa, estou à disposição.',
            'tchau' => 'Até logo! 👋 Tenha um ótimo dia!',
            'endereço' => 'Para mais informações sobre nossa localização, consulte nosso site ou entre em contato com um atendente.',
            'endereco' => 'Para mais informações sobre nossa localização, consulte nosso site ou entre em contato com um atendente.',
        ];

        foreach ($quickReplies as $keyword => $reply) {
            if (str_contains($message, $keyword)) {
                return $reply;
            }
        }

        return 'Obrigado pela sua mensagem! Um de nossos atendentes responderá em breve. ⏳';
    }
}
