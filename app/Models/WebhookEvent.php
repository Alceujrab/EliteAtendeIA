<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    protected $fillable = ['source', 'payload', 'status', 'error_message'];

    /**
     * Scope para eventos pendentes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
