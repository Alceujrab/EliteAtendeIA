<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(\App\Models\Lead::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customerName' => 'required|string',
            'customerPhone' => 'required|string',
            'vehicleName' => 'required|string',
            'value' => 'nullable|numeric',
            'status' => 'nullable|string',
            'type' => 'nullable|string',
            'assignedTo' => 'nullable|string',
            'lastEditedBy' => 'nullable|string',
        ]);

        $lead = \App\Models\Lead::create($validated);
        return response()->json($lead, 201);
    }

    public function show(string $id)
    {
        $lead = \App\Models\Lead::findOrFail($id);
        return response()->json($lead);
    }

    public function update(Request $request, string $id)
    {
        $lead = \App\Models\Lead::findOrFail($id);
        
        $validated = $request->validate([
            'customerName' => 'nullable|string',
            'customerPhone' => 'nullable|string',
            'vehicleName' => 'nullable|string',
            'value' => 'nullable|numeric',
            'status' => 'nullable|string',
            'type' => 'nullable|string',
            'assignedTo' => 'nullable|string',
            'lastEditedBy' => 'nullable|string',
        ]);

        $lead->update($validated);
        return response()->json($lead);
    }

    public function destroy(string $id)
    {
        $lead = \App\Models\Lead::findOrFail($id);
        $lead->delete();
        return response()->json(null, 204);
    }
}
