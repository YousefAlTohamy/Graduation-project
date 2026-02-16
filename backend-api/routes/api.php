<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CvController;
use App\Http\Controllers\Api\GapAnalysisController;
use App\Http\Controllers\Api\JobController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes (no auth required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public routes (no authentication required)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'CareerCompass API',
        'version' => '1.0.0',
    ]);
});

// Job browsing (public)
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{id}', [JobController::class, 'show']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Get authenticated user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // CV Upload and Skill Management
    Route::post('/upload-cv', [CvController::class, 'upload']);
    Route::get('/user/skills', [CvController::class, 'getUserSkills']);
    Route::delete('/user/skills/{skillId}', [CvController::class, 'removeSkill']);

    // Job Scraping
    Route::post('/jobs/scrape', [JobController::class, 'scrapeAndStore']);
    Route::post('/jobs/scrape-if-missing', [JobController::class, 'scrapeJobTitleIfMissing']);
    Route::get('/scraping-status/{jobId}', [JobController::class, 'checkScrapingStatus'])->name('api.scraping.status');

    // Gap Analysis
    Route::get('/gap-analysis/job/{jobId}', [GapAnalysisController::class, 'analyzeJob']);
    Route::post('/gap-analysis/batch', [GapAnalysisController::class, 'analyzeMultipleJobs']);
    Route::get('/gap-analysis/recommendations', [GapAnalysisController::class, 'getRecommendations']);
});
