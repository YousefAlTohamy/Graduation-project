<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\JobResource;
use App\Jobs\ProcessOnDemandJobScraping;
use App\Models\Job;
use App\Models\ScrapingJob;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class JobController extends Controller
{
    /**
     * Get all jobs (paginated and filterable).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Job::with('skills');

        // Filter by search term
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by source
        if ($request->has('source')) {
            $query->where('source', $request->source);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $jobs = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => JobResource::collection($jobs),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    /**
     * Get a single job with its skills.
     */
    public function show(int $id): JsonResponse
    {
        $job = Job::with('skills')->find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new JobResource($job),
        ]);
    }

    /**
     * Trigger job scraping via AI Engine and store results.
     */
    public function scrapeAndStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|max:255',
            'max_results' => 'nullable|integer|min:1|max:50',
            'use_samples' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $query = $request->input('query');
            $maxResults = $request->input('max_results', 20);
            $useSamples = $request->input('use_samples', false);

            Log::info('Initiating job scraping', [
                'query' => $query,
                'max_results' => $maxResults,
                'use_samples' => $useSamples,
                'user_id' => auth()->id(),
            ]);

            // Call AI Engine to scrape jobs
            $aiResponse = $this->scrapeJobsFromAI($query, $maxResults, $useSamples);

            if (!$aiResponse || !isset($aiResponse['jobs'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to scrape jobs from AI Engine',
                ], 500);
            }

            $scrapedJobs = $aiResponse['jobs'];
            $storedCount = 0;
            $duplicateCount = 0;

            // Store each job
            foreach ($scrapedJobs as $jobData) {
                $result = $this->storeJob($jobData);
                if ($result['stored']) {
                    $storedCount++;
                } else {
                    $duplicateCount++;
                }
            }

            Log::info('Job scraping completed', [
                'total_scraped' => count($scrapedJobs),
                'stored' => $storedCount,
                'duplicates' => $duplicateCount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Jobs scraped and stored successfully',
                'data' => [
                    'total_scraped' => count($scrapedJobs),
                    'stored' => $storedCount,
                    'duplicates_skipped' => $duplicateCount,
                    'query' => $query,
                    'source' => $aiResponse['source'] ?? 'unknown',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Job scraping failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while scraping jobs',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Call AI Engine to scrape jobs.
     */
    private function scrapeJobsFromAI(string $query, int $maxResults, bool $useSamples): ?array
    {
        try {
            $aiEngineUrl = config('services.ai_engine.url', 'http://127.0.0.1:8001');
            $timeout = config('services.ai_engine.timeout', 30);

            $response = Http::timeout($timeout)->post("{$aiEngineUrl}/scrape-jobs", [
                'query' => $query,
                'max_results' => $maxResults,
                'use_samples' => $useSamples,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('AI Engine scraping failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to connect to AI Engine for scraping', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Store a single job with its skills.
     *
     * @return array ['stored' => bool, 'job' => Job|null]
     */
    private function storeJob(array $jobData): array
    {
        // Check for duplicate (by URL or title+company)
        $existingJob = null;

        if (isset($jobData['url']) && $jobData['url']) {
            $existingJob = Job::where('url', $jobData['url'])->first();
        }

        if (!$existingJob) {
            $existingJob = Job::where('title', $jobData['title'])
                ->where('company', $jobData['company'])
                ->first();
        }

        if ($existingJob) {
            Log::info('Duplicate job found, skipping', [
                'title' => $jobData['title'],
                'company' => $jobData['company'],
            ]);
            return ['stored' => false, 'job' => $existingJob];
        }

        // Create new job
        $job = Job::create([
            'title' => $jobData['title'],
            'company' => $jobData['company'],
            'description' => $jobData['description'] ?? '',
            'url' => $jobData['url'] ?? null,
            'source' => $jobData['source'] ?? 'unknown',
        ]);

        // Attach skills
        if (isset($jobData['skills']) && is_array($jobData['skills'])) {
            $skillNames = collect($jobData['skills'])->pluck('name')->toArray();
            $skills = Skill::whereIn('name', $skillNames)->get();

            if ($skills->isNotEmpty()) {
                $job->skills()->sync($skills->pluck('id'));
            }
        }

        Log::info('New job stored', [
            'job_id' => $job->id,
            'title' => $job->title,
            'skills_count' => $job->skills()->count(),
        ]);

        return ['stored' => true, 'job' => $job];
    }

    /**
     * Check if job title exists and scrape if missing (on-demand).
     */
    public function scrapeJobTitleIfMissing(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'job_title' => 'required|string|max:255',
            'max_results' => 'nullable|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $jobTitle = $request->input('job_title');
            $maxResults = $request->input('max_results', 30);

            Log::info('Checking if job title exists', ['job_title' => $jobTitle]);

            // Check if we have jobs for this title
            $existingJobs = Job::where('title', 'like', "%{$jobTitle}%")
                ->with('skills')
                ->count();

            if ($existingJobs > 0) {
                Log::info('Job title exists in database', [
                    'job_title' => $jobTitle,
                    'count' => $existingJobs,
                ]);

                return response()->json([
                    'success' => true,
                    'data_exists' => true,
                    'message' => 'Job data already available',
                    'jobs_count' => $existingJobs,
                ]);
            }

            // Job title doesn't exist - trigger on-demand scraping
            Log::info('Job title not found, triggering on-demand scraping', [
                'job_title' => $jobTitle,
            ]);

            // Create scraping job tracking record
            $scrapingJob = ScrapingJob::create([
                'job_title' => $jobTitle,
                'type' => 'on_demand',
                'status' => 'pending',
            ]);

            // Dispatch to high-priority queue
            ProcessOnDemandJobScraping::dispatch($jobTitle, $scrapingJob->id, $maxResults);

            return response()->json([
                'success' => true,
                'data_exists' => false,
                'message' => 'Analyzing market data for this role. Please wait...',
                'scraping_job_id' => $scrapingJob->id,
                'status' => 'pending',
                'poll_url' => route('api.scraping.status', ['jobId' => $scrapingJob->id]),
            ], 202);
        } catch (\Exception $e) {
            Log::error('Error checking/scraping job title', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Check the status of a scraping job.
     */
    public function checkScrapingStatus(int $jobId): JsonResponse
    {
        try {
            $scrapingJob = ScrapingJob::find($jobId);

            if (!$scrapingJob) {
                return response()->json([
                    'success' => false,
                    'message' => 'Scraping job not found',
                ], 404);
            }

            $response = [
                'success' => true,
                'scraping_job_id' => $scrapingJob->id,
                'job_title' => $scrapingJob->job_title,
                'status' => $scrapingJob->status,
                'type' => $scrapingJob->type,
                'started_at' => $scrapingJob->started_at,
            ];

            // Add results if completed
            if ($scrapingJob->status === 'completed') {
                $response['results'] = [
                    'jobs_found' => $scrapingJob->jobs_found,
                    'jobs_stored' => $scrapingJob->jobs_stored,
                    'jobs_duplicated' => $scrapingJob->jobs_duplicated,
                    'completed_at' => $scrapingJob->completed_at,
                ];

                // Get actual jobs
                $jobs = Job::where('title', 'like', "%{$scrapingJob->job_title}%")
                    ->with('skills')
                    ->latest()
                    ->take(10)
                    ->get();

                $response['jobs'] = JobResource::collection($jobs);
            }

            // Add error if failed
            if ($scrapingJob->status === 'failed') {
                $response['error_message'] = $scrapingJob->error_message;
            }

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error checking scraping status', [
                'job_id' => $jobId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while checking status',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
