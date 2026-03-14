<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Models\Channel;

class SettingsController extends Controller
{
    public function index()
    {
        $channels = Channel::orderBy('created_at', 'desc')->get();

        return Inertia::render('Settings/Index', [
            'channels' => $channels,
        ]);
    }

    /**
     * Create a new channel
     */
    public function storeChannel(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:whatsapp_evolution,whatsapp_official,instagram,facebook',
            'settings' => 'required|array',
        ]);

        $channel = Channel::create([
            'name' => $request->input('name'),
            'type' => $request->input('type'),
            'settings' => $request->input('settings'),
            'status' => 'disconnected',
            'user_id' => auth()->id(),
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'channel' => $channel]);
        }

        return back()->with('success', 'Canal criado com sucesso.');
    }

    /**
     * Update a channel
     */
    public function updateChannel(Request $request, Channel $channel)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'settings' => 'required|array',
        ]);

        $channel->update([
            'name' => $request->input('name'),
            'settings' => $request->input('settings'),
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'channel' => $channel]);
        }

        return back()->with('success', 'Canal atualizado.');
    }

    /**
     * Delete a channel
     */
    public function destroyChannel(Channel $channel)
    {
        $channel->delete();

        return back()->with('success', 'Canal removido.');
    }

    /**
     * Test channel connection
     */
    public function testChannel(Channel $channel)
    {
        $settings = $channel->settings ?? [];

        if ($channel->type === 'whatsapp_evolution') {
            $apiUrl = rtrim($settings['api_url'] ?? '', '/');
            $apiKey = $settings['api_key'] ?? '';
            $instance = $settings['instance_name'] ?? '';

            if (!$apiUrl || !$apiKey || !$instance) {
                return response()->json(['success' => false, 'error' => 'Configurações incompletas.']);
            }

            try {
                $response = Http::timeout(10)
                    ->withHeaders(['apikey' => $apiKey])
                    ->get("{$apiUrl}/instance/connectionState/{$instance}");

                if ($response->successful()) {
                    $state = $response->json('state') ?? $response->json('instance.state') ?? 'unknown';
                    $connected = in_array($state, ['open', 'connected']);

                    $channel->update(['status' => $connected ? 'connected' : 'disconnected']);

                    return response()->json([
                        'success' => true,
                        'connected' => $connected,
                        'state' => $state,
                    ]);
                }

                return response()->json(['success' => false, 'error' => "HTTP {$response->status()}"]);
            } catch (\Exception $e) {
                return response()->json(['success' => false, 'error' => $e->getMessage()]);
            }
        }

        if (in_array($channel->type, ['instagram', 'facebook'])) {
            $token = $settings['page_access_token'] ?? '';
            if (!$token) {
                return response()->json(['success' => false, 'error' => 'Token não configurado.']);
            }

            try {
                $response = Http::timeout(10)
                    ->get("https://graph.facebook.com/v18.0/me", [
                        'access_token' => $token,
                    ]);

                if ($response->successful()) {
                    $channel->update(['status' => 'connected']);
                    return response()->json([
                        'success' => true,
                        'connected' => true,
                        'page_name' => $response->json('name'),
                    ]);
                }

                return response()->json(['success' => false, 'error' => "Token inválido: HTTP {$response->status()}"]);
            } catch (\Exception $e) {
                return response()->json(['success' => false, 'error' => $e->getMessage()]);
            }
        }

        return response()->json(['success' => false, 'error' => 'Tipo de canal não suportado.']);
    }
}
