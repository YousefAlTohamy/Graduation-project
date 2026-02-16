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
        Schema::table('job_postings', function (Blueprint $table) {
            // Add unique constraint on URL (prevent duplicate URLs)
            // Note: URL can be nullable, so we only enforce uniqueness on non-null values
            $table->unique('url', 'jobs_url_unique');

            // Add composite unique constraint on title + company
            // Prevents duplicate jobs with same title at same company
            $table->unique(['title', 'company'], 'jobs_title_company_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            // Drop unique constraints in reverse order
            $table->dropUnique('jobs_title_company_unique');
            $table->dropUnique('jobs_url_unique');
        });
    }
};
