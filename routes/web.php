<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CrmController;
use App\Http\Controllers\InboxController;
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

    Route::get('/settings', function () {
        return Inertia::render('Settings/Index');
    })->name('settings.index');

    // CRM API routes (Kanban drag-and-drop persistence)
    Route::post('/api/crm/deals/{deal}/move', [CrmController::class, 'moveDeal'])->name('crm.deal.move');
    Route::post('/api/crm/deals', [CrmController::class, 'storeDeal'])->name('crm.deal.store');
    Route::delete('/api/crm/deals/{deal}', [CrmController::class, 'destroyDeal'])->name('crm.deal.destroy');

    // Default Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
