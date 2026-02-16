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
        Schema::create('job_role_statistics', function (Blueprint $table) {
            $table->id();
            $table->string('role_title')->unique()->comment('e.g., PHP Developer, Python Developer');
            $table->integer('total_jobs_analyzed')->default(0);
            $table->json('top_skills')->nullable()->comment('Top 10 required skills with frequencies');
            $table->string('average_experience_level')->nullable()->comment('e.g., 2-5 years');
            $table->json('common_locations')->nullable()->comment('Most common job locations');
            $table->string('salary_range')->nullable()->comment('Average salary range if available');
            $table->timestamp('last_scraped_at')->nullable();
            $table->timestamps();

            // Indexes for faster queries
            $table->index('role_title');
            $table->index('last_scraped_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_role_statistics');
    }
};
