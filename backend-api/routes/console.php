<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Log;
use App\Jobs\ProcessMarketScraping;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ============================================
// SCHEDULED TASKS CONFIGURATION
// ============================================

// Market Intelligence: Automated Job Scraping - Monday at 2 AM
Schedule::job(new ProcessMarketScraping())
    ->weekly()
    ->mondays()
    ->at('02:00')
    ->name('market-scraping-monday')
    ->onSuccess(function () {
        Log::info('Market scraping job (Monday) completed successfully');
    })
    ->onFailure(function () {
        Log::error('Market scraping job (Monday) failed');
    });

// Market Intelligence: Automated Job Scraping - Thursday at 2 AM
Schedule::job(new ProcessMarketScraping())
    ->weekly()
    ->thursdays()
    ->at('02:00')
    ->name('market-scraping-thursday')
    ->onSuccess(function () {
        Log::info('Market scraping job (Thursday) completed successfully');
    })
    ->onFailure(function () {
        Log::error('Market scraping job (Thursday) failed');
    });

// Skill Importance Calculation: Daily at Midnight
// Recalculates skill importance scores for all job titles
Schedule::command('skills:calculate-importance --all')
    ->daily()
    ->at('00:00')
    ->name('skill-importance-calculation')
    ->onSuccess(function () {
        Log::info('Skill importance calculation completed successfully');
    })
    ->onFailure(function () {
        Log::error('Skill importance calculation failed');
    });

// ============================================
// PRODUCTION DEPLOYMENT NOTES
// ============================================
//
// To activate the scheduler in production, add this to your crontab:
// * * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
//
// Or run the scheduler daemon (recommended for development):
// php artisan schedule:work
//
// ============================================
