<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\JobResource;
use App\Models\Job;
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
}
