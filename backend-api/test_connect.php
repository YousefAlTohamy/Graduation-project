<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

echo "Testing connection to 127.0.0.1:8001...\n";

try {
    $response = Http::timeout(5)->get('http://127.0.0.1:8001/openapi.json');
    echo "Status: " . $response->status() . "\n";
    echo "Body length: " . strlen($response->body()) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\nTesting connection to google.com...\n";
try {
    $response = Http::timeout(5)->get('https://google.com');
    echo "Status: " . $response->status() . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
