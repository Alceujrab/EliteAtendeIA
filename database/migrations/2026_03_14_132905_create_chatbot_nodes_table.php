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
        if (!Schema::hasTable('chatbot_nodes')) { Schema::create('chatbot_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chatbot_flow_id')->constrained()->cascadeOnDelete();
            $table->string('node_id'); // ID from React Flow
            $table->string('type'); // message, menu, auto_assign, open_deal
            $table->json('data')->nullable(); // Content of the node
            $table->json('position')->nullable(); // X, Y coordinates
            $table->json('edges')->nullable(); // Connections to other nodes
            $table->timestamps();
        }); }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbot_nodes');
    }
};

