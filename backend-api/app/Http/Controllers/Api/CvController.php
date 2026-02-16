<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CvUploadRequest;
use App\Http\Resources\SkillResource;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CvController extends Controller
{
    /**
     * Upload and analyze a CV to extract skills.
     */
    public function upload(CvUploadRequest $request): JsonResponse
    {
        try {
            // Get the uploaded file
            $file = $request->file('cv');

            // Store temporarily
            $path = $file->store('cvs', 'local');
            $fullPath = Storage::path($path);

            Log::info('CV uploaded and stored temporarily', [
                'user_id' => auth()->id(),
                'path' => $path,
            ]);

            // Send to AI Engine for analysis
            $aiResponse = $this->analyzeWithAI($fullPath);

            // Clean up temporary file
            Storage::delete($path);

            // Check if AI analysis was successful
            if (!$aiResponse || !isset($aiResponse['skills'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to analyze CV. Please try again.',
                ], 500);
            }

            // Check if any skills were extracted
            if (empty($aiResponse['skills'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No skills found in CV. Please ensure it\'s a valid text-based PDF with readable content.',
                ], 422);
            }

            // Extract skill names from AI response
            $extractedSkills = collect($aiResponse['skills']);
            $skillNames = $extractedSkills->pluck('name')->toArray();

            Log::info('Skills extracted from CV', [
                'user_id' => auth()->id(),
                'total_skills' => count($skillNames),
                'skills' => $skillNames,
            ]);

            // Prepare extracted skills keyed by name (use type if provided)
            $skillItems = $extractedSkills->mapWithKeys(function ($s) {
                $name = trim($s['name']);
                return [$name => [
                    'name' => $name,
                    'type' => $s['type'] ?? 'technical',
                ]];
            })->toArray();

            $skillNames = array_keys($skillItems);

            // Find existing skills in DB
            $matchedSkills = Skill::whereIn('name', $skillNames)->get();
            $matchedNames = $matchedSkills->pluck('name')->toArray();

            // Determine unmatched names and create them in DB
            $unmatchedNames = array_values(array_diff($skillNames, $matchedNames));

            if (!empty($unmatchedNames)) {
                foreach ($unmatchedNames as $u) {
                    try {
                        $created = Skill::create([
                            'name' => $skillItems[$u]['name'],
                            'type' => $skillItems[$u]['type'] ?? 'technical',
                        ]);
                        $matchedSkills->push($created);
                    } catch (\Exception $e) {
                        Log::error('Failed to create skill', ['name' => $u, 'error' => $e->getMessage()]);
                    }
                }

                Log::warning('Some skills were not found and were created', [
                    'user_id' => auth()->id(),
                    'created_skills' => $unmatchedNames,
                ]);
            }

            // After creating, ensure we have the full set of Skill models
            $matchedSkills = Skill::whereIn('name', $skillNames)->get();

            // Replace user's skills with skills from this upload
            $user = auth()->user();
            $existingSkillIds = $user->skills()->pluck('skills.id')->toArray();
            $newSkillIds = $matchedSkills->pluck('id')->toArray();
            $user->skills()->sync($newSkillIds);

            $totalSkills = $user->skills()->count();
            $addedSkills = array_values(array_diff($newSkillIds, $existingSkillIds));

            Log::info('User skills updated', [
                'user_id' => auth()->id(),
                'new_skills_added' => count($addedSkills),
                'total_skills' => $totalSkills,
            ]);

            // Return only the skills extracted from the most recent upload.
            return response()->json([
                'success' => true,
                'message' => 'CV analyzed successfully',
                'data' => [
                    'filename' => basename($fullPath),
                    'total_extracted' => count($skillNames),
                    'matched_skills' => SkillResource::collection($matchedSkills),
                    'unmatched_skills' => $unmatchedNames,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('CV upload failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your CV.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get the current user's skills.
     */
    public function getUserSkills(): JsonResponse
    {
        $user = auth()->user();
        $skills = $user->skills;

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $skills->count(),
                'technical' => $skills->where('type', 'technical')->count(),
                'soft' => $skills->where('type', 'soft')->count(),
                'skills' => SkillResource::collection($skills),
            ],
        ]);
    }

    /**
     * Remove a skill from the user's profile.
     */
    public function removeSkill(int $skillId): JsonResponse
    {
        $user = auth()->user();

        // Check if user has this skill
        $skill = $user->skills()->find($skillId);

        if (!$skill) {
            return response()->json([
                'success' => false,
                'message' => 'Skill not found in your profile.',
            ], 404);
        }

        // Detach the skill
        $user->skills()->detach($skillId);

        Log::info('Skill removed from user profile', [
            'user_id' => $user->id,
            'skill_id' => $skillId,
            'skill_name' => $skill->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Skill removed successfully.',
        ]);
    }

    /**
     * Send CV to AI Engine for analysis.
     *
     * @param string $filePath Full path to the CV file
     * @return array|null Analysis results or null on failure
     */
    private function analyzeWithAI(string $filePath): ?array
    {
        try {
            $aiEngineUrl = config('services.ai_engine.url', 'http://127.0.0.1:8001');
            $timeout = config('services.ai_engine.timeout', 30);

            Log::info('Sending CV to AI Engine', [
                'url' => $aiEngineUrl,
                'file_size' => filesize($filePath),
            ]);

            $response = Http::timeout($timeout)
                ->attach(
                    'file',
                    file_get_contents($filePath),
                    'cv.pdf'
                )
                ->post("{$aiEngineUrl}/analyze");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('AI Engine returned error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Failed to connect to AI Engine', [
                'error' => $e->getMessage(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('AI Engine request failed', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
