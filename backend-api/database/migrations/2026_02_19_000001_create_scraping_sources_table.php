<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates the scraping_sources table which stores dynamic data-source
     * configurations (API endpoints and HTML targets) for the hybrid scraper.
     */
    public function up(): void
    {
        Schema::create('scraping_sources', function (Blueprint $table) {
            $table->id();

            // Human-readable label shown in the admin dashboard
            $table->string('name');

            // Full URL / API base endpoint
            $table->string('endpoint');

            // Determines which scraping strategy the Python engine will apply
            $table->enum('type', ['api', 'html'])->default('api');

            // Soft-toggle so admins can pause a source without deleting it
            $table->enum('status', ['active', 'inactive'])->default('active');

            // Optional HTTP headers (e.g. Authorization tokens) stored as JSON
            $table->json('headers')->nullable();

            // Optional query-string parameters (e.g. Adzuna app_id / app_key)
            $table->json('params')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scraping_sources');
    }
};
