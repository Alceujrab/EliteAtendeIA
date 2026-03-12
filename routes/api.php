<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\InboxController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\WebhookEventController;
use App\Http\Controllers\Api\ChatbotController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ========================
// Recursos CRUD padrão
// ========================
Route::apiResource('tickets', TicketController::class);
Route::apiResource('messages', MessageController::class);
Route::apiResource('inboxes', InboxController::class);
Route::post('inboxes/test-connection', [InboxController::class, 'testConnection']);
Route::apiResource('leads', LeadController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('customers', CustomerController::class);

// ========================
// Veículos / Catálogo
// ========================
Route::apiResource('vehicles', VehicleController::class);
Route::post('vehicles/batch', [VehicleController::class, 'batch']);
Route::post('catalog/import', [VehicleController::class, 'import']);

// ========================
// Settings (automação, etc)
// ========================
Route::get('settings', [SettingController::class, 'index']);
Route::get('settings/{key}', [SettingController::class, 'show']);
Route::put('settings/{key}', [SettingController::class, 'update']);

// ========================
// Webhook Events
// ========================
Route::get('webhook-events', [WebhookEventController::class, 'index']);
Route::delete('webhook-events/{id}', [WebhookEventController::class, 'destroy']);

// Webhooks externos (recepção) - ambas URLs funcionam
Route::post('webhooks/evolution', [WebhookEventController::class, 'storeEvolution']);
Route::match(['get', 'post'], 'webhooks/instagram', [WebhookEventController::class, 'storeInstagram']);
Route::post('webhook/evolution', [WebhookEventController::class, 'storeEvolution']);
Route::match(['get', 'post'], 'webhook/instagram', [WebhookEventController::class, 'storeInstagram']);

// ========================
// Chatbot IA
// ========================
Route::post('chatbot/message', [ChatbotController::class, 'processMessage']);
Route::get('chatbot/status', [ChatbotController::class, 'status']);
