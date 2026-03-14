<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmStage extends Model
{
    protected $fillable = ["crm_funnel_id", "name", "order_index", "color"];

    public function funnel()
    {
        return $this->belongsTo(CrmFunnel::class);
    }

    public function deals()
    {
        return $this->hasMany(CrmDeal::class)->orderBy("created_at", "desc");
    }
}

