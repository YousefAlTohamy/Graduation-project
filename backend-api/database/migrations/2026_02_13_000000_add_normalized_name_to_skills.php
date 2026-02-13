<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration adds a `normalized_name` column, backfills it with
     * lowercased trimmed values from `name`, and adds a unique index to
     * prevent duplicates.
     *
     * IMPORTANT: If there are existing duplicate normalized names, the
     * migration will fail when adding the unique index. Clean duplicates
     * before running in production or handle accordingly.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->string('normalized_name')->nullable()->after('name');
        });

        // Backfill normalized_name from existing names
        $skills = DB::table('skills')->select('id', 'name')->get();
        foreach ($skills as $s) {
            $normalized = mb_strtolower(trim($s->name));
            DB::table('skills')->where('id', $s->id)->update(['normalized_name' => $normalized]);
        }

        // Add unique index (will fail if duplicates exist)
        Schema::table('skills', function (Blueprint $table) {
            $table->unique('normalized_name');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropUnique(['normalized_name']);
            $table->dropColumn('normalized_name');
        });
    }
};
