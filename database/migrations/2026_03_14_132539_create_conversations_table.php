<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('conversations')) {
            Schema::create('conversations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('contact_id')->default(0);
                $table->string('channel')->default('whatsapp');
                $table->string('status')->default('open');
                $table->unsignedBigInteger('assigned_to')->nullable();
                $table->timestamp('last_message_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
