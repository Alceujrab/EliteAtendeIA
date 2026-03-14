<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotFlow extends Model
{
    protected $fillable = ["name", "trigger_keyword", "is_active"];

    public function nodes()
    {
        return $this->hasMany(ChatbotNode::class);
    }
}

