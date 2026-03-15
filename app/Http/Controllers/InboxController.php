<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Contact;
use App\Models\User;
use App\Models\Channel;

class InboxController extends Controller
{
    public function index()
    {
        $query = Conversation::with(['contact', 'assignee']);

        if (!$this->isAdmin()) {
            $userId = (int) Auth::id();
            $query->where(function ($inner) use ($userId) {
                $inner->where('assigned_to', $userId)
                    ->orWhereNull('assigned_to');
            });
        }

        $conversations = $query
            ->orderByDesc('last_message_at')
            ->paginate(30);

        $agents = User::select('id', 'name')->get();

        return Inertia::render('Inbox/Index', [
            'conversations' => $conversations,
            'agents' => $agents,
        ]);
    }

    /**
     * Show single conversation with messages
     */
    public function show(Conversation $conversation)
    {
        abort_unless($this->canAccessConversation($conversation), 403);

        $conversation->load(['contact', 'assignee', 'messages.user']);

        return response()->json([
            'conversation' => $conversation,
            'messages' => $conversation->messages,
        ]);
    }

    /**
     * Send a new message in a conversation
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        abort_unless($this->canAccessConversation($conversation), 403);

        $request->validate([
            'body' => 'required_without:media_url|string|max:5000',
            'type' => 'in:text,audio,image,video,document,note',
            'media_url' => 'nullable|string',
            'is_internal_note' => 'nullable|boolean',
        ]);

        $message = ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'user_id' => Auth::id(),
            'type' => $request->input('type', 'text'),
            'body' => $request->input('body', ''),
            'media_url' => $request->input('media_url'),
            'media_type' => $request->input('media_type'),
            'is_internal_note' => $request->boolean('is_internal_note', false),
        ]);

        // Update the conversation's last message time
        $conversation->update(['last_message_at' => now()]);

        // If it was resolved, reopen it
        if ($conversation->status === 'resolved') {
            $conversation->update(['status' => 'open']);
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => $message->load('user')]);
        }

        return back();
    }

    /**
     * Resolve (close) a conversation
     */
    public function resolve(Conversation $conversation)
    {
        abort_unless($this->canAccessConversation($conversation), 403);

        $conversation->update(['status' => 'resolved']);

        return back()->with('success', 'Conversa resolvida.');
    }

    /**
     * Reopen a conversation
     */
    public function reopen(Conversation $conversation)
    {
        abort_unless($this->canAccessConversation($conversation), 403);

        $conversation->update(['status' => 'open']);

        return back()->with('success', 'Conversa reaberta.');
    }

    /**
     * Assign conversation to an agent
     */
    public function assign(Request $request, Conversation $conversation)
    {
        abort_unless($this->isAdmin() || (int) $conversation->assigned_to === (int) Auth::id(), 403);

        $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $conversation->update(['assigned_to' => $request->input('assigned_to')]);

        return back()->with('success', 'Conversa atribuída.');
    }

    /**
     * Create a new conversation
     */
    public function storeConversation(Request $request)
    {
        $request->validate([
            'contact_id' => 'nullable|exists:contacts,id',
            'phone' => 'required_without:contact_id|string',
            'name' => 'nullable|string',
            'channel' => 'in:whatsapp,instagram,facebook,webchat',
        ]);

        // Find or create contact
        $contactId = $request->input('contact_id');
        if (!$contactId && $request->input('phone')) {
            $contact = Contact::firstOrCreate(
                ['phone' => $request->input('phone')],
                ['name' => $request->input('name', 'Novo Contato')]
            );
            $contactId = $contact->id;
        }

        if (!$contactId) {
            return response()->json([
                'success' => false,
                'message' => 'Contato nao identificado para criar conversa.',
            ], 422);
        }

        $conversation = Conversation::create([
            'contact_id' => $contactId,
            'channel' => $request->input('channel', 'whatsapp'),
            'status' => 'open',
            'assigned_to' => Auth::id(),
            'last_message_at' => now(),
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'conversation' => $conversation->load('contact')]);
        }

        return redirect()->route('inbox.all');
    }

    /**
     * Upload media file for attachment
     */
    public function uploadMedia(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:20480', // 20MB max
        ]);

        $path = $request->file('file')->store('inbox-attachments', 'public');

        return response()->json([
            'success' => true,
            'url' => asset('storage/' . $path),
            'type' => $request->file('file')->getMimeType(),
            'name' => $request->file('file')->getClientOriginalName(),
        ]);
    }

    private function isAdmin(): bool
    {
        return (string) (Auth::user()->role ?? 'agent') === 'admin';
    }

    private function canAccessConversation(Conversation $conversation): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $userId = (int) Auth::id();
        return $conversation->assigned_to === null || (int) $conversation->assigned_to === $userId;
    }
}
