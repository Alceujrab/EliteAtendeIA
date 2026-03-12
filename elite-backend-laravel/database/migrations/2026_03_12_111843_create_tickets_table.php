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
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('customerId')->nullable();
            $table->string('customerName');
            $table->string('customerEmail')->nullable();
            $table->string('customerPhone')->nullable();
            $table->string('customerAvatar')->nullable();
            $table->string('channel');
            $table->string('status')->default('open');
            $table->string('subject')->nullable();
            $table->text('lastMessage')->nullable();
            $table->json('tags')->nullable();
            $table->string('inbox')->nullable();
            $table->string('assignedTo')->nullable();
            $table->boolean('fromWebhook')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
