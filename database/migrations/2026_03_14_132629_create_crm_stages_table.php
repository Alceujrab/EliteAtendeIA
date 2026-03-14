<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('crm_stages')) {
            Schema::create('crm_stages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('crm_funnel_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->integer('order_index')->default(0);
                $table->string('color')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_stages');
    }
};
