<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Message::query();
        if ($request->has('ticket_id')) {
            $query->where('ticket_id', $request->ticket_id);
        }
        return response()->json($query->orderBy('created_at', 'asc')->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
            'text' => 'required|string',
            'sender' => 'required|string|in:agent,customer,bot',
            'isVehicle' => 'nullable|boolean',
            'vehicleData' => 'nullable|array',
            'mediaUrl' => 'nullable|string',
            'mediaType' => 'nullable|string',
            'agentName' => 'nullable|string',
        ]);

        $message = Message::create([
            'id' => Str::uuid(),
            'ticket_id' => $validated['ticket_id'],
            'text' => $validated['text'],
            'sender' => $validated['sender'],
            'isVehicle' => $validated['isVehicle'] ?? false,
            'vehicleData' => $validated['vehicleData'] ?? null,
            'mediaUrl' => $validated['mediaUrl'] ?? null,
            'mediaType' => $validated['mediaType'] ?? null,
            'agentName' => $validated['agentName'] ?? null,
        ]);

        // Update the parent ticket's lastMessage and timestamp
        Ticket::find($validated['ticket_id'])->update([
            'lastMessage' => $validated['text']
        ]);

        return response()->json($message, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json(Message::findOrFail($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $message = Message::findOrFail($id);
        $message->update($request->all());
        return response()->json($message);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        Message::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
