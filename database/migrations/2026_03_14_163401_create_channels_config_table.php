<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add settings JSON to channels if not already present
        if (Schema::hasTable('channels')) {
            if (!Schema::hasColumn('channels', 'settings')) {
                Schema::table('channels', function (Blueprint $table) {
                    $table->json('settings')->nullable();
                    if (!Schema::hasColumn('channels', 'type')) {
                        $table->string('type')->default('whatsapp');
                    }
                    if (!Schema::hasColumn('channels', 'status')) {
                        $table->string('status')->default('disconnected');
                    }
                });
            }
        } else {
            Schema::create('channels', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('type')->default('whatsapp'); // whatsapp, instagram, facebook
                $table->json('settings')->nullable();
                $table->string('status')->default('disconnected');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        // Only drop if we created it
    }
};
