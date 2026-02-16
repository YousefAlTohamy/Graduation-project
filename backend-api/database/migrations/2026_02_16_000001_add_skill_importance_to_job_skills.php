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
        Schema::table('job_skills', function (Blueprint $table) {
            // Importance score (0-100 percentage)
            $table->decimal('importance_score', 5, 2)->nullable()->after('required');

            // Importance category based on frequency
            $table->enum('importance_category', ['essential', 'important', 'nice_to_have'])
                ->nullable()
                ->after('importance_score')
                ->comment('essential: >70%, important: 40-70%, nice_to_have: <40%');

            // Index for faster queries
            $table->index('importance_category');
            $table->index('importance_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_skills', function (Blueprint $table) {
            $table->dropIndex(['importance_category']);
            $table->dropIndex(['importance_score']);
            $table->dropColumn(['importance_score', 'importance_category']);
        });
    }
};
