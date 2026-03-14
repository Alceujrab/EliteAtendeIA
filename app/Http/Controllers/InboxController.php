<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Conversation;

class InboxController extends Controller
{
    public function index()
    {
        $conversations = Conversation::with(['contact', 'assignee'])
            ->orderByDesc('last_message_at')
            ->paginate(30);

        return Inertia::render('Inbox/Index', [
            'conversations' => $conversations
        ]);
    }
}
