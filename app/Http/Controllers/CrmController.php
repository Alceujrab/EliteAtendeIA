<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CrmFunnel;
use App\Models\CrmDeal;

class CrmController extends Controller
{
    public function index()
    {
        $funnel = CrmFunnel::with(['stages' => function ($query) {
            $query->orderBy('order_index');
        }, 'stages.deals', 'stages.deals.contact'])
        ->where('is_active', true)
        ->first();

        return Inertia::render('CRM/Index', [
            'funnelData' => $funnel
        ]);
    }

    /**
     * Move a deal to a different stage (Kanban drag-drop)
     */
    public function moveDeal(Request $request, CrmDeal $deal)
    {
        $request->validate(['crm_stage_id' => 'required|exists:crm_stages,id']);
        $deal->update(['crm_stage_id' => $request->crm_stage_id]);
        return back();
    }

    /**
     * Create a new deal/card on the Kanban
     */
    public function storeDeal(Request $request)
    {
        $validated = $request->validate([
            'crm_stage_id' => 'required|exists:crm_stages,id',
            'title'         => 'required|string|max:255',
            'vehicle_model' => 'nullable|string|max:255',
            'vehicle_year'  => 'nullable|string|max:10',
            'value'         => 'nullable|numeric',
        ]);

        CrmDeal::create($validated);
        return back();
    }

    /**
     * Delete a deal/card
     */
    public function destroyDeal(CrmDeal $deal)
    {
        $deal->delete();
        return back();
    }
}
