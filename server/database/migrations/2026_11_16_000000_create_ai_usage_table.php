<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_usage', function (Blueprint $table) {
            $table->id();
            $table->date('day');
            // "device:<id>", "ip:<hash>" or "global". Later: "user:<id>".
            $table->string('subject', 100);
            $table->unsignedInteger('requests')->default(0);
            $table->unsignedBigInteger('input_tokens')->default(0);
            $table->unsignedBigInteger('output_tokens')->default(0);
            $table->unsignedBigInteger('cost_micro_usd')->default(0);
            $table->timestamps();
            $table->unique(['day', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage');
    }
};
