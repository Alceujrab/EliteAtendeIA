<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inbox;
use Illuminate\Http\Request;

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
}
