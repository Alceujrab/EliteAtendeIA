<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name', 'email', 'phone', 'cpf', 'address', 'notes', 'status', 'avatar', 'tags'
    ];

    protected $casts = [
        'tags' => 'array',
    ];
}
