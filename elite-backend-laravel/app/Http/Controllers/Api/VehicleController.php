<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index()
    {
        return response()->json(Vehicle::all());
    }

    public function store(Request $request)
    {
        $vehicle = Vehicle::updateOrCreate(
            ['id' => $request->input('id')],
            $request->all()
        );
        return response()->json($vehicle, 201);
    }

    public function show(string $id)
    {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) {
            return response()->json(['error' => 'Veículo não encontrado'], 404);
        }
        return response()->json($vehicle);
    }

    public function update(Request $request, string $id)
    {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) {
            return response()->json(['error' => 'Veículo não encontrado'], 404);
        }
        $vehicle->update($request->all());
        return response()->json($vehicle);
    }

    public function destroy(string $id)
    {
        $vehicle = Vehicle::find($id);
        if ($vehicle) {
            $vehicle->delete();
        }
        return response()->json(null, 204);
    }

    /**
     * Batch save vehicles (used by catalog import)
     */
    public function batch(Request $request)
    {
        $vehicles = $request->input('vehicles', []);
        $saved = [];

        foreach ($vehicles as $vehicleData) {
            $vehicle = Vehicle::updateOrCreate(
                ['id' => $vehicleData['id']],
                $vehicleData
            );
            $saved[] = $vehicle;
        }

        return response()->json([
            'message' => count($saved) . ' veículos salvos com sucesso',
            'count' => count($saved)
        ]);
    }

    /**
     * Import catalog from external XML/JSON URL
     */
    public function import(Request $request)
    {
        $url = $request->input('url');

        if (!$url) {
            return response()->json(['success' => false, 'error' => 'URL não informada'], 400);
        }

        try {
            $client = new \GuzzleHttp\Client([
                'timeout' => 30,
                'verify' => false,
            ]);

            $response = $client->get($url);
            $body = (string) $response->getBody();
            $contentType = $response->getHeaderLine('Content-Type');

            $data = null;

            // Try JSON first
            $jsonData = json_decode($body, true);
            if ($jsonData !== null) {
                $data = $jsonData;
            } else {
                // Try XML
                libxml_use_internal_errors(true);
                $xml = simplexml_load_string($body);
                if ($xml !== false) {
                    $data = json_decode(json_encode($xml), true);
                } else {
                    return response()->json([
                        'success' => false,
                        'error' => 'Formato não reconhecido. Envie um feed XML ou JSON válido.'
                    ], 400);
                }
            }

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar o feed: ' . $e->getMessage()
            ], 500);
        }
    }
}
