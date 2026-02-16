<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Note: Laravel 11 scheduling is configured in app/Console/Kernel.php or bootstrap/app.php
// For automated market scraping, run: php artisan schedule:work
// Or add to cron: * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
