<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inbox;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class InboxController extends Controller
{
    public function index()
    {
        return response()->json(Inbox::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'channel' => 'required|in:whatsapp,instagram',
        ]);

        $inbox = Inbox::create([
            'name' => $request->name,
            'channel' => $request->channel,
            'access_type' => $request->input('accessType', 'all'),
            'allowed_users' => $request->input('allowedUsers', []),
            'settings' => $request->input('settings', []),
        ]);

        return response()->json($inbox, 201);
    }

    public function show(string $id)
    {
        return response()->json(Inbox::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $inbox = Inbox::findOrFail($id);

        $inbox->update([
            'name' => $request->input('name', $inbox->name),
            'channel' => $request->input('channel', $inbox->channel),
            'access_type' => $request->input('accessType', $inbox->access_type),
            'allowed_users' => $request->input('allowedUsers', $inbox->allowed_users),
            'settings' => $request->input('settings', $inbox->settings),
        ]);

        return response()->json($inbox);
    }

    public function destroy(string $id)
    {
        $inbox = Inbox::findOrFail($id);
        $inbox->delete();

        return response()->json(['message' => 'Caixa de entrada excluída com sucesso']);
    }

    /**
     * Testa a conexão com a Evolution API ou Instagram API
     */
    public function testConnection(Request $request)
    {
        $channel = $request->input('channel', 'whatsapp');
        $settings = $request->input('settings', []);

        if ($channel === 'whatsapp') {
            return $this->testEvolutionConnection($settings);
        } else {
            return $this->testInstagramConnection($settings);
        }
    }

    private function testEvolutionConnection(array $settings)
    {
        $apiUrl = $settings['evolutionApiUrl'] ?? null;
        $apiKey = $settings['evolutionApiKey'] ?? null;
        $instance = $settings['evolutionInstance'] ?? null;

        if (!$apiUrl || !$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'URL da API e API Key são obrigatórios.',
            ], 422);
        }

        // Limpar URL (remover barra final)
        $apiUrl = rtrim($apiUrl, '/');

        try {
            // Testar conexão base (listar instâncias)
            $response = Http::timeout(10)
                ->withHeaders([
                    'apikey' => $apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->get("{$apiUrl}/instance/fetchInstances");

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => "Erro ao conectar: HTTP {$response->status()}. Verifique a URL e API Key.",
                    'status' => $response->status(),
                ]);
            }

            $instances = $response->json();
            $instanceFound = false;
            $instanceStatus = 'não encontrada';
            $foundNames = [];

            // Verificar se a instância existe (cobrir vários formatos da Evolution API)
            if ($instance && is_array($instances)) {
                foreach ($instances as $inst) {
                    // Tentar vários caminhos possíveis do nome da instância
                    $possibleNames = [
                        $inst['instance']['instanceName'] ?? null,
                        $inst['instance']['name'] ?? null,
                        $inst['instanceName'] ?? null,
                        $inst['name'] ?? null,
                    ];

                    $instName = null;
                    foreach ($possibleNames as $pn) {
                        if ($pn) { $instName = $pn; break; }
                    }

                    if ($instName) {
                        $foundNames[] = $instName;
                    }

                    // Comparação case-insensitive
                    if ($instName && strtolower($instName) === strtolower($instance)) {
                        $instanceFound = true;
                        $instanceStatus = $inst['instance']['status']
                            ?? $inst['instance']['connectionStatus']
                            ?? $inst['status']
                            ?? $inst['connectionStatus']
                            ?? 'conectado';
                        break;
                    }
                }
            }

            $totalInstances = is_array($instances) ? count($instances) : 0;
            $namesStr = implode(', ', $foundNames);

            return response()->json([
                'success' => true,
                'message' => $instanceFound
                    ? "✅ Conexão OK! Instância \"{$instance}\" encontrada (status: {$instanceStatus}). Total: {$totalInstances}."
                    : ($instance
                        ? "⚠️ Conexão OK com a API, mas a instância \"{$instance}\" não foi encontrada. Instâncias disponíveis: [{$namesStr}]. Total: {$totalInstances}."
                        : "✅ Conexão OK! {$totalInstances} instância(s) encontrada(s): [{$namesStr}]."),
                'instanceFound' => $instanceFound,
                'instanceStatus' => $instanceStatus,
                'totalInstances' => $totalInstances,
                'availableInstances' => $foundNames,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Falha na conexão: {$e->getMessage()}. Verifique se a URL está correta e acessível.",
            ]);
        }
    }

    private function testInstagramConnection(array $settings)
    {
        $token = $settings['instagramPageAccessToken'] ?? null;
        $pageId = $settings['instagramPageId'] ?? null;

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Page Access Token é obrigatório.',
            ], 422);
        }

        try {
            $response = Http::timeout(10)
                ->get("https://graph.facebook.com/v18.0/me", [
                    'access_token' => $token,
                    'fields' => 'id,name',
                ]);

            if ($response->failed()) {
                $error = $response->json('error.message', 'Erro desconhecido');
                return response()->json([
                    'success' => false,
                    'message' => "Erro na API do Instagram/Meta: {$error}",
                ]);
            }

            $data = $response->json();
            $pageName = $data['name'] ?? 'Sem nome';
            $id = $data['id'] ?? '';

            return response()->json([
                'success' => true,
                'message' => "✅ Conexão OK! Página: \"{$pageName}\" (ID: {$id}).",
                'pageName' => $pageName,
                'pageId' => $id,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Falha na conexão: {$e->getMessage()}",
            ]);
        }
    }
}
