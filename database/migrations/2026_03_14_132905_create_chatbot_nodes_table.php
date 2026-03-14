<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('chatbot_nodes')) {
            Schema::create('chatbot_nodes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('chatbot_flow_id')->default(0);
                $table->string('node_id');
                $table->string('type');
                $table->json('data')->nullable();
                $table->json('position')->nullable();
                $table->json('edges')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_nodes');
    }
};
