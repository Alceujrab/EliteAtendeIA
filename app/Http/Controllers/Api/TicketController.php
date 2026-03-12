<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Ticket::with('messages')->orderBy('updated_at', 'desc');
        
        if ($request->has('phone')) {
            $query->where('customerPhone', $request->input('phone'));
        }

        if ($request->has('customerId')) {
            $query->where('customerId', $request->input('customerId'));
        }

        $tickets = $query->get();
        return response()->json($tickets);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customerName' => 'required|string|max:255',
            'customerPhone' => 'nullable|string',
            'channel' => 'required|string',
            'subject' => 'nullable|string',
            'lastMessage' => 'required|string',
            'inbox' => 'nullable|string',
        ]);

        $ticket = Ticket::create([
            'id' => Str::uuid(),
            'customerName' => $validated['customerName'],
            'customerPhone' => $validated['customerPhone'] ?? null,
            'channel' => $validated['channel'],
            'subject' => $validated['subject'] ?? null,
            'lastMessage' => $validated['lastMessage'],
            'inbox' => $validated['inbox'] ?? null,
            'status' => 'open',
            'tags' => []
        ]);

        return response()->json($ticket, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $ticket = Ticket::with('messages')->findOrFail($id);
        return response()->json($ticket);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $ticket = Ticket::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|string',
            'assignedTo' => 'sometimes|string|nullable',
            'lastMessage' => 'sometimes|string',
            'tags' => 'sometimes|array',
        ]);

        $ticket->update($validated);

        return response()->json($ticket);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->delete();

        return response()->json(null, 204);
    }
}
