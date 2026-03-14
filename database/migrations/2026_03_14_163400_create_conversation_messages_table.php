<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('conversation_messages')) {
            Schema::create('conversation_messages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('conversation_id');
                $table->unsignedBigInteger('user_id')->nullable(); // null = contact sent it
                $table->enum('type', ['text', 'audio', 'image', 'video', 'document', 'note'])->default('text');
                $table->text('body')->nullable();
                $table->string('media_url')->nullable();
                $table->string('media_type')->nullable();
                $table->boolean('is_internal_note')->default(false);
                $table->timestamps();

                $table->foreign('conversation_id')->references('id')->on('conversations')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_messages');
    }
};
