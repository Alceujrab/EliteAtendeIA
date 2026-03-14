<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CrmController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('inbox.all');
});

Route::middleware('auth')->group(function () {
    // App Modules (Kinbox Replica)
    Route::get('/inbox/all', [InboxController::class, 'index'])->name('inbox.all');
    Route::get('/crm', [CrmController::class, 'index'])->name('crm.index');

    Route::get('/reports', function () {
        return Inertia::render('Reports/Index');
    })->name('reports.index');

    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');

    // ========== INBOX API ROUTES ==========
    Route::get('/api/inbox/conversations/{conversation}', [InboxController::class, 'show'])->name('inbox.conversation.show');
    Route::post('/api/inbox/conversations/{conversation}/messages', [InboxController::class, 'sendMessage'])->name('inbox.message.send');
    Route::post('/api/inbox/conversations/{conversation}/resolve', [InboxController::class, 'resolve'])->name('inbox.conversation.resolve');
    Route::post('/api/inbox/conversations/{conversation}/reopen', [InboxController::class, 'reopen'])->name('inbox.conversation.reopen');
    Route::post('/api/inbox/conversations/{conversation}/assign', [InboxController::class, 'assign'])->name('inbox.conversation.assign');
    Route::post('/api/inbox/conversations', [InboxController::class, 'storeConversation'])->name('inbox.conversation.store');
    Route::post('/api/inbox/upload', [InboxController::class, 'uploadMedia'])->name('inbox.upload');

    // ========== CRM API ROUTES ==========
    Route::post('/api/crm/deals/{deal}/move', [CrmController::class, 'moveDeal'])->name('crm.deal.move');
    Route::post('/api/crm/deals', [CrmController::class, 'storeDeal'])->name('crm.deal.store');
    Route::delete('/api/crm/deals/{deal}', [CrmController::class, 'destroyDeal'])->name('crm.deal.destroy');

    // ========== SETTINGS API ROUTES ==========
    Route::post('/api/settings/channels', [SettingsController::class, 'storeChannel'])->name('settings.channel.store');
    Route::put('/api/settings/channels/{channel}', [SettingsController::class, 'updateChannel'])->name('settings.channel.update');
    Route::delete('/api/settings/channels/{channel}', [SettingsController::class, 'destroyChannel'])->name('settings.channel.destroy');
    Route::post('/api/settings/channels/{channel}/test', [SettingsController::class, 'testChannel'])->name('settings.channel.test');

    // Default Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

