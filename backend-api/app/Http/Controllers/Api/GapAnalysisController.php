<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GapAnalysisResource;
use App\Models\Job;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class GapAnalysisController extends Controller
{
    /**
     * Analyze skill gap for a specific job.
     */
    public function analyzeJob(int $jobId): JsonResponse
    {
        try {
            $user = auth()->user();

            // Get job with skills
            $job = Job::with('skills')->find($jobId);

            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found',
                ], 404);
            }

            // Perform gap analysis
            $analysis = $this->performGapAnalysis($user, $job);

            Log::info('Gap analysis performed', [
                'user_id' => $user->id,
                'job_id' => $jobId,
                'match_percentage' => $analysis['match_percentage'],
            ]);

            return response()->json([
                'success' => true,
                'data' => new GapAnalysisResource($analysis),
            ]);
        } catch (\Exception $e) {
            Log::error('Gap analysis failed', [
                'job_id' => $jobId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to perform gap analysis',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Analyze skill gaps for multiple jobs.
     */
    public function analyzeMultipleJobs(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'job_ids' => 'required|array|min:1|max:20',
            'job_ids.*' => 'required|integer|exists:jobs,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = auth()->user();
            $jobIds = $request->input('job_ids');

            // Get jobs with skills
            $jobs = Job::with('skills')->whereIn('id', $jobIds)->get();

            $results = [];
            $totalMatchPercentage = 0;
            $bestMatch = null;
            $allMissingSkills = collect();

            foreach ($jobs as $job) {
                $analysis = $this->performGapAnalysis($user, $job);

                $results[] = [
                    'job_id' => $job->id,
                    'title' => $job->title,
                    'company' => $job->company,
                    'match_percentage' => round($analysis['match_percentage'], 1),
                    'missing_skills_count' => $analysis['missing_count'],
                    'matched_skills_count' => $analysis['matched_count'],
                ];

                $totalMatchPercentage += $analysis['match_percentage'];

                if (!$bestMatch || $analysis['match_percentage'] > $bestMatch['percentage']) {
                    $bestMatch = [
                        'job_id' => $job->id,
                        'title' => $job->title,
                        'percentage' => round($analysis['match_percentage'], 1),
                    ];
                }

                // Collect all missing skills
                foreach ($analysis['missing_skills'] as $skill) {
                    $allMissingSkills->push($skill);
                }
            }

            // Sort results by match percentage (descending)
            usort($results, fn($a, $b) => $b['match_percentage'] <=> $a['match_percentage']);

            // Find common missing skills
            $missingSkillFrequency = $allMissingSkills->groupBy('id')->map(function ($skills) {
                return [
                    'id' => $skills->first()->id,
                    'name' => $skills->first()->name,
                    'type' => $skills->first()->type,
                    'frequency' => $skills->count(),
                ];
            })->sortByDesc('frequency')->values();

            $averageMatch = count($jobs) > 0 ? $totalMatchPercentage / count($jobs) : 0;

            Log::info('Batch gap analysis completed', [
                'user_id' => $user->id,
                'jobs_analyzed' => count($jobs),
                'average_match' => $averageMatch,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'analyzed_jobs' => count($jobs),
                    'jobs' => $results,
                    'common_missing_skills' => $missingSkillFrequency->take(10),
                    'average_match_percentage' => round($averageMatch, 1),
                    'best_match' => $bestMatch,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Batch gap analysis failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to perform batch analysis',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get personalized skill recommendations.
     */
    public function getRecommendations(): JsonResponse
    {
        try {
            $user = auth()->user();
            $userSkillIds = $user->skills->pluck('id');

            // Get all jobs
            $jobs = Job::with('skills')->get();

            // Collect all required skills from jobs
            $allJobSkills = collect();
            foreach ($jobs as $job) {
                foreach ($job->skills as $skill) {
                    $allJobSkills->push($skill);
                }
            }

            // Find skills user doesn't have
            $missingSkills = $allJobSkills->whereNotIn('id', $userSkillIds);

            // Count frequency (market demand)
            $skillDemand = $missingSkills->groupBy('id')->map(function ($skills) {
                $skill = $skills->first();
                return [
                    'id' => $skill->id,
                    'name' => $skill->name,
                    'type' => $skill->type,
                    'demand' => $skills->count(),
                    'priority' => $this->calculatePriority($skills->count(), count($skills)),
                ];
            })->sortByDesc('demand')->values();

            // Categorize by priority
            $critical = $skillDemand->where('priority', 'Critical')->take(5);
            $important = $skillDemand->where('priority', 'Important')->take(5);
            $niceToHave = $skillDemand->where('priority', 'Nice-to-Have')->take(5);

            Log::info('Recommendations generated', [
                'user_id' => $user->id,
                'total_recommendations' => $skillDemand->count(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'user_skills_count' => $userSkillIds->count(),
                    'total_jobs_analyzed' => $jobs->count(),
                    'recommendations' => [
                        'critical' => $critical,
                        'important' => $important,
                        'nice_to_have' => $niceToHave,
                    ],
                    'top_10_skills' => $skillDemand->take(10),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Recommendations failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate recommendations',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Perform gap analysis between user and job.
     */
    private function performGapAnalysis($user, Job $job): array
    {
        // Get user skills
        $userSkills = $user->skills;
        $userSkillIds = $userSkills->pluck('id');

        // Get job required skills WITH pivot data (importance_score, importance_category)
        $jobSkills = $job->skills;
        $jobSkillIds = $jobSkills->pluck('id');

        // Calculate matched skills (intersection)
        $matchedSkillIds = $userSkillIds->intersect($jobSkillIds);
        $matchedSkills = Skill::whereIn('id', $matchedSkillIds)->get();

        // Calculate missing skills (difference) with importance data
        $missingSkillIds = $jobSkillIds->diff($userSkillIds);

        // Get missing skills with their importance scores from the pivot table
        $missingSkillsWithImportance = $jobSkills->whereIn('id', $missingSkillIds)->map(function ($skill) {
            return [
                'id' => $skill->id,
                'name' => $skill->name,
                'type' => $skill->type,
                'importance_score' => $skill->pivot->importance_score ?? 0,
                'importance_category' => $skill->pivot->importance_category ?? 'nice_to_have',
            ];
        });

        // Categorize missing skills by importance
        $missingEssential = $missingSkillsWithImportance->where('importance_category', 'essential')->values();
        $missingImportant = $missingSkillsWithImportance->where('importance_category', 'important')->values();
        $missingNiceToHave = $missingSkillsWithImportance->where('importance_category', 'nice_to_have')->values();

        // Also get matched skills with importance for better insights
        $matchedSkillsWithImportance = $jobSkills->whereIn('id', $matchedSkillIds)->map(function ($skill) {
            return [
                'id' => $skill->id,
                'name' => $skill->name,
                'type' => $skill->type,
                'importance_score' => $skill->pivot->importance_score ?? 0,
                'importance_category' => $skill->pivot->importance_category ?? 'nice_to_have',
            ];
        });

        // Calculate match percentage
        $totalRequired = $jobSkills->count();
        $matchedCount = $matchedSkills->count();
        $matchPercentage = $totalRequired > 0 ? ($matchedCount / $totalRequired) * 100 : 0;

        // Breakdown by type
        $technicalRequired = $jobSkills->where('type', 'technical')->count();
        $technicalMatched = $matchedSkills->where('type', 'technical')->count();
        $softRequired = $jobSkills->where('type', 'soft')->count();
        $softMatched = $matchedSkills->where('type', 'soft')->count();

        // Generate enhanced recommendations
        $recommendations = $this->generateRecommendations(
            $matchPercentage,
            $missingSkillsWithImportance,
            $missingEssential,
            $missingImportant
        );

        return [
            'job' => $job,
            'match_percentage' => $matchPercentage,
            'total_required' => $totalRequired,
            'matched_count' => $matchedCount,
            'missing_count' => $missingSkillsWithImportance->count(),
            'matched_skills' => $matchedSkillsWithImportance,
            'missing_skills' => $missingSkillsWithImportance, // All missing skills
            'missing_essential_skills' => $missingEssential, // Priority #1
            'missing_important_skills' => $missingImportant, // Priority #2
            'missing_nice_to_have_skills' => $missingNiceToHave, // Priority #3
            'technical_required' => $technicalRequired,
            'technical_matched' => $technicalMatched,
            'soft_required' => $softRequired,
            'soft_matched' => $softMatched,
            'recommendations' => $recommendations,
        ];
    }

    /**
     * Generate recommendations based on analysis with skill importance.
     */
    private function generateRecommendations(
        float $matchPercentage,
        $allMissingSkills,
        $missingEssential,
        $missingImportant
    ): array {
        $recommendations = [];

        // Base recommendation on match percentage
        if ($matchPercentage >= 90) {
            $recommendations[] = "Excellent match! You should apply for this position with confidence.";
        } elseif ($matchPercentage >= 75) {
            $recommendations[] = "Good match! You have most of the required skills.";
        } elseif ($matchPercentage >= 60) {
            $recommendations[] = "Fair match. Focus on developing the missing skills before applying.";
        } elseif ($matchPercentage >= 40) {
            $recommendations[] = "Moderate skill gap. Consider this as a mid-term career goal.";
        } else {
            $recommendations[] = "Large skill gap. This might be a long-term career goal.";
            $recommendations[] = "Focus on building foundational skills first.";
        }

        // Add priority-based skill recommendations
        if ($missingEssential->count() > 0) {
            $essentialSkills = $missingEssential->pluck('name')->take(3)->join(', ');
            $recommendations[] = "🔴 Priority #1 - Essential Skills: Learn {$essentialSkills} (these appear in 70%+ of similar jobs).";
        }

        if ($missingImportant->count() > 0 && $matchPercentage < 90) {
            $importantSkills = $missingImportant->pluck('name')->take(3)->join(', ');
            $recommendations[] = "🟡 Priority #2 - Important Skills: {$importantSkills} (40-70% job demand).";
        }

        // Soft skills recommendation
        $missingSoftSkills = $allMissingSkills->where('type', 'soft');
        if ($missingSoftSkills->count() > 0) {
            $softSkillNames = $missingSoftSkills->pluck('name')->take(2)->join(', ');
            $recommendations[] = "💼 Soft Skills: Develop {$softSkillNames} to stand out.";
        }

        return $recommendations;
    }

    /**
     * Calculate priority based on demand frequency.
     */
    private function calculatePriority(int $demand, int $totalJobs): string
    {
        $percentage = ($demand / max($totalJobs, 1)) * 100;

        if ($percentage >= 50) return 'Critical';
        if ($percentage >= 25) return 'Important';
        return 'Nice-to-Have';
    }
}
