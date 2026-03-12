<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'brand', 'model', 'year', 'price', 'mileage',
        'image', 'features', 'images', 'description',
        'fuel', 'transmission', 'color', 'doors', 'plate'
    ];

    protected $casts = [
        'features' => 'array',
        'images' => 'array',
        'price' => 'decimal:2',
    ];
}
