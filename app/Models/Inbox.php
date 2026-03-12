<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inbox extends Model
{
    protected $fillable = [
        'name', 'channel', 'status', 'settings',
        'access_type', 'allowed_users',
    ];

    protected $casts = [
        'settings' => 'array',
        'allowed_users' => 'array',
    ];
}
