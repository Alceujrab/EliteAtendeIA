<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(\App\Models\Customer::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'cpf' => 'nullable|string',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
            'avatar' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $customer = \App\Models\Customer::create($validated);
        return response()->json($customer, 201);
    }

    public function show(string $id)
    {
        $customer = \App\Models\Customer::findOrFail($id);
        return response()->json($customer);
    }

    public function update(Request $request, string $id)
    {
        $customer = \App\Models\Customer::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'nullable|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'cpf' => 'nullable|string',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
            'avatar' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $customer->update($validated);
        return response()->json($customer);
    }

    public function destroy(string $id)
    {
        $customer = \App\Models\Customer::findOrFail($id);
        $customer->delete();
        return response()->json(null, 204);
    }
}
