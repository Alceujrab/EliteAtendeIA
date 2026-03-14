<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('crm_deals')) {
            Schema::create('crm_deals', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('crm_stage_id')->default(0);
                $table->unsignedBigInteger('contact_id')->nullable();
                $table->string('title');
                $table->string('vehicle_model')->nullable();
                $table->string('vehicle_year')->nullable();
                $table->decimal('value', 10, 2)->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_deals');
    }
};
