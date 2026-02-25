<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ScrapingSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * NOTE: Column names match the actual migration schema:
     *   endpoint   (not url_endpoint)
     *   type       (not source_type) — values: 'api' | 'html'  (lowercase)
     *   status     — values: 'active' | 'inactive'             (lowercase)
     *   headers    (JSON, nullable) — HTTP request headers
     *   params     (JSON, nullable) — query-string / API key params
     */
    public function run(): void
    {
        $sources = [
            // ── 1. Wuzzuf HTML board ─────────────────────────────────────────────
            [
                'name'       => 'Wuzzuf Laravel Jobs',
                'endpoint'   => 'https://wuzzuf.net/search/jobs/',
                'type'       => 'html',
                'status'     => 'active',
                'headers'    => null,
                'params'     => json_encode(['q' => 'laravel developer', 'a' => 'hpb']),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // ── 2. Remotive (free public API, no credentials required) ──────────
            [
                'name'       => 'Remotive Software Dev Jobs',
                'endpoint'   => 'https://remotive.com/api/remote-jobs',
                'type'       => 'api',
                'status'     => 'active',
                'headers'    => null,
                'params'     => json_encode(['category' => 'software-dev']),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // ── 3. Adzuna US (credentials loaded from ai-engine/.env, not the DB) ─
            [
                'name'       => 'Adzuna US Tech Jobs',
                'endpoint'   => 'https://api.adzuna.com/v1/api/jobs/us/search/1',
                'type'       => 'api',
                'status'     => 'active',
                'headers'    => null,
                'params'     => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('scraping_sources')->insert($sources);
    }
}
