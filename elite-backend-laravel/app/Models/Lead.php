<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'customerName', 'customerPhone', 'vehicleName', 'value', 'status', 'type', 
        'avatar', 'lastEditedBy', 'assignedTo', 'postSalesData', 'reminders'
    ];

    protected $casts = [
        'postSalesData' => 'array',
        'reminders' => 'array',
    ];
}
