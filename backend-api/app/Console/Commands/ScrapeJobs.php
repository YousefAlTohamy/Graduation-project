<?php

namespace App\Console\Commands;

use App\Models\Skill;
use App\Models\Job;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ScrapeJobs extends Command
{
    protected $signature = 'jobs:scrape {--count=20 : Number of jobs to fetch}';
    protected $description = 'Scrape jobs from AI Engine and store in database';

    public function handle()
    {
        $count = $this->option('count');
        $this->info("Fetching {$count} jobs from AI Engine...");

        try {
            $response = Http::timeout(60)
                ->post('http://127.0.0.1:8001/scrape-jobs', [
                    'query' => 'developer',
                    'max_results' => $count,
                    'use_samples' => true,
                ]);

            if (!$response->successful()) {
                $this->error('Failed to fetch jobs from AI Engine');
                return 1;
            }

            $data = $response->json();
            $jobs = $data['jobs'] ?? [];
            
            $this->info("Found {$data['total_jobs']} jobs");

            $stored = 0;
            foreach ($jobs as $jobData) {
                $this->storeJob($jobData);
                $stored++;
                $this->line("Stored: {$jobData['title']}");
            }

            $this->info("Successfully stored {$stored} jobs!");
            return 0;

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }

    private function storeJob(array $jobData): Job
    {
        // Check for duplicate
        $existing = Job::where('url', $jobData['url'] ?? null)->first();

        if (!$existing) {
            $existing = Job::where('title', $jobData['title'])
                ->where('company', $jobData['company'])
                ->first();
        }

        if ($existing) {
            return $existing;
        }

        $now = Carbon::now();

        $job = Job::create([
            'title' => $jobData['title'],
            'company' => $jobData['company'] ?? 'Unknown',
            'description' => $jobData['description'] ?? '',
            'url' => $jobData['url'] ?? null,
            'source' => $jobData['source'] ?? 'unknown',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Attach skills
        if (isset($jobData['skills']) && is_array($jobData['skills'])) {
            $skillNames = collect($jobData['skills'])->pluck('name')->toArray();
            $skills = Skill::whereIn('name', $skillNames)->get();

            if ($skills->isNotEmpty()) {
                $job->skills()->sync($skills->pluck('id'));
            }
        }

        return $job;
    }
}
