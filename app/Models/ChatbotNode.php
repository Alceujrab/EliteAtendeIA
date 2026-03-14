<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotNode extends Model
{
    protected $fillable = ["chatbot_flow_id", "node_id", "type", "data", "position", "edges"];

    protected $casts = [
        "data" => "array",
        "position" => "array",
        "edges" => "array",
    ];

    public function flow()
    {
        return $this->belongsTo(ChatbotFlow::class, "chatbot_flow_id");
    }
}

