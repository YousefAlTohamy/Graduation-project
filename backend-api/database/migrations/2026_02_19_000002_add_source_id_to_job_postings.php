<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds a nullable scraping_source_id FK to job_postings so every job
     * record knows which source it originated from.
     */
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->foreignId('scraping_source_id')
                ->nullable()
                ->after('source')
                ->constrained('scraping_sources')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropForeign(['scraping_source_id']);
            $table->dropColumn('scraping_source_id');
        });
    }
};
