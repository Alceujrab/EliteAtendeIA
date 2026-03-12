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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('brand');
            $table->string('model');
            $table->integer('year');
            $table->decimal('price', 12, 2);
            $table->integer('mileage')->default(0);
            $table->string('image');
            $table->json('features')->nullable();
            $table->json('images')->nullable();
            $table->text('description')->nullable();
            $table->string('fuel')->nullable();
            $table->string('transmission')->nullable();
            $table->string('color')->nullable();
            $table->integer('doors')->nullable();
            $table->string('plate')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
