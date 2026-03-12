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
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('customerName');
            $table->string('customerPhone');
            $table->string('vehicleName');
            $table->decimal('value', 12, 2)->default(0);
            $table->string('status');
            $table->string('type');
            $table->string('avatar')->nullable();
            $table->string('lastEditedBy')->nullable();
            $table->string('assignedTo')->nullable();
            $table->json('postSalesData')->nullable();
            $table->json('reminders')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
