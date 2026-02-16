<?php

namespace App\Console\Commands;

use App\Models\Job;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CalculateSkillImportance extends Command
{
    protected $signature = 'skills:calculate-importance
                            {--role= : Specific job role to calculate (optional)}
                            {--all : Calculate for all job titles}';

    protected $description = 'Calculate skill importance scores based on job market frequency';

    public function handle(): int
    {
        $this->info('Calculating skill importance scores...');

        try {
            if ($this->option('role')) {
                // Calculate for specific role
                $role = $this->option('role');
                $this->info("Calculating for role: {$role}");
                $this->calculateForRole($role);
            } elseif ($this->option('all')) {
                // Calculate for all distinct job titles
                $this->info('Calculating for all job titles...');
                $jobTitles = Job::distinct('title')->pluck('title');

                $bar = $this->output->createProgressBar($jobTitles->count());
                $bar->start();

                foreach ($jobTitles as $title) {
                    $this->calculateForRole($title);
                    $bar->advance();
                }

                $bar->finish();
                $this->newLine(2);
            } else {
                $this->error('Please specify either --role=<title> or --all');
                return 1;
            }

            $this->info('✓ Skill importance calculation completed!');
            return 0;
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            Log::error('Skill importance calculation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }
    }

    /**
     * Calculate skill importance for a specific job role.
     */
    protected function calculateForRole(string $jobTitle): void
    {
        // First, count total jobs for this title
        $totalJobs = Job::where('title', 'like', "%{$jobTitle}%")->count();

        if ($totalJobs === 0) {
            $this->warn("No jobs found for: {$jobTitle}");
            return;
        }

        $skillFrequency = [];

        // Process jobs in chunks to avoid memory issues with large datasets
        Job::where('title', 'like', "%{$jobTitle}%")
            ->with('skills')
            ->chunk(100, function ($jobs) use (&$skillFrequency) {
                // Count skill occurrences
                foreach ($jobs as $job) {
                    foreach ($job->skills as $skill) {
                        if (!isset($skillFrequency[$skill->id])) {
                            $skillFrequency[$skill->id] = [
                                'count' => 0,
                                'skill_name' => $skill->name,
                            ];
                        }
                        $skillFrequency[$skill->id]['count']++;
                    }
                }
            });

        // Update importance scores in the database
        $updatedCount = 0;

        // Get job IDs in chunks as well
        $jobIds = [];
        Job::where('title', 'like', "%{$jobTitle}%")
            ->select('id')
            ->chunk(100, function ($jobs) use (&$jobIds) {
                $jobIds = array_merge($jobIds, $jobs->pluck('id')->toArray());
            });

        foreach ($skillFrequency as $skillId => $data) {
            $count = $data['count'];
            $percentage = ($count / $totalJobs) * 100;

            // Determine category
            $category = 'nice_to_have';
            if ($percentage > 70) {
                $category = 'essential';
            } elseif ($percentage >= 40) {
                $category = 'important';
            }

            // Update all job-skill pivot records for this role and skill
            $updated = DB::table('job_skills')
                ->whereIn('job_id', $jobIds)
                ->where('skill_id', $skillId)
                ->update([
                    'importance_score' => round($percentage, 2),
                    'importance_category' => $category,
                    'updated_at' => now(),
                ]);

            $updatedCount += $updated;
        }

        $this->line("  {$jobTitle}: {$totalJobs} jobs, {$updatedCount} skill-job relationships updated");

        Log::info("Calculated skill importance for {$jobTitle}", [
            'total_jobs' => $totalJobs,
            'unique_skills' => count($skillFrequency),
            'updated_records' => $updatedCount,
        ]);
    }
}
