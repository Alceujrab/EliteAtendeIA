<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmDeal extends Model
{
    protected $fillable = ["crm_stage_id", "contact_id", "title", "vehicle_model", "vehicle_year", "value"];

    public function stage()
    {
        return $this->belongsTo(CrmStage::class, "crm_stage_id");
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}

