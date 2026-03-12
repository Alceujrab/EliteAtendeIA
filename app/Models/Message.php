<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Message extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'ticket_id', 'sender', 'text',
        'isVehicle', 'vehicleData', 'fromWebhook',
        'mediaUrl', 'mediaType', 'agentName',
    ];

    protected $casts = [
        'isVehicle' => 'boolean',
        'vehicleData' => 'array',
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

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }
}
