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
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->string('sender');
            $table->text('text');
            $table->boolean('isVehicle')->default(false);
            $table->json('vehicleData')->nullable();
            $table->boolean('fromWebhook')->default(false);
            $table->text('mediaUrl')->nullable();
            $table->string('mediaType')->nullable();
            $table->string('agentName')->nullable();
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
