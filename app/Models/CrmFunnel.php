<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmFunnel extends Model
{
    protected $fillable = ["name", "description", "is_active"];

    public function stages()
    {
        return $this->hasMany(CrmStage::class)->orderBy("order_index");
    }
}

