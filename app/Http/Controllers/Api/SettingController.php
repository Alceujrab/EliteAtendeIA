<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Setting::all());
    }

    public function show(string $key)
    {
        $setting = \App\Models\Setting::where('key', $key)->first();
        if (!$setting) {
            return response()->json([], 200); // Return empty array if not found to prevent errors
        }
        return response()->json($setting->value);
    }

    public function update(Request $request, string $key)
    {
        $setting = \App\Models\Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $request->all()]
        );
        return response()->json($setting->value);
    }
}
