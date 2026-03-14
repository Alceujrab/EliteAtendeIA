<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = ["name", "phone", "email", "avatar", "notes", "status"];

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}

