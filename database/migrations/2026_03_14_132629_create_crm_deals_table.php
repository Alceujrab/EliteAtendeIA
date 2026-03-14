<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('crm_deals')) { Schema::create('crm_deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crm_stage_id')->constrained()->cascadeOnDelete();
            // We'll optionally link to a contact later
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            
            $table->string('title');
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_year')->nullable();
            $table->decimal('value', 10, 2)->default(0);
            
            $table->timestamps();
        }); }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_deals');
    }
};

