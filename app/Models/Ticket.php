<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Ticket extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'customerId', 'customerName', 'customerEmail',
        'customerPhone', 'customerAvatar', 'channel', 'status',
        'subject', 'lastMessage', 'tags', 'inbox', 'assignedTo', 'fromWebhook',
    ];

    protected $casts = [
        'tags' => 'array',
        'fromWebhook' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'ticket_id');
    }
}
