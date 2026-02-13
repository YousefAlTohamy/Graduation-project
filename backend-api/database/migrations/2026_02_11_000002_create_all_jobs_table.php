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
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('company');
            $table->string('location')->nullable();
            $table->string('salary_range')->nullable();
            $table->string('job_type')->nullable();
            $table->string('experience')->nullable();
            $table->string('url')->nullable();
            $table->string('source')->nullable()->comment('e.g., Wuzzuf, LinkedIn');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
