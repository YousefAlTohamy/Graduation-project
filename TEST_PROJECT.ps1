#!/usr/bin/env pwsh

Write-Host "CareerCompass Frontend - Test Results" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking frontend files..." -ForegroundColor Yellow

$files = @(
    "src\App.jsx",
    "src\main.jsx",
    "src\index.css",
    "src\api\client.js",
    "src\context\AuthContext.jsx",
    "src\pages\Home.jsx",
    "src\pages\Login.jsx",
    "package.json"
)

$allExists = $true
foreach ($file in $files) {
    $path = "a:\Graduation-project\frontend\$file"
    if (Test-Path $path) {
        Write-Host "OK - $file" -ForegroundColor Green
    } else {
        Write-Host "MISSING - $file" -ForegroundColor Red
        $allExists = $false
    }
}

Write-Host ""
Write-Host "Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "a:\Graduation-project\frontend\node_modules") {
    Write-Host "OK - Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "MISSING - node_modules" -ForegroundColor Red
    $allExists = $false
}

Write-Host ""
if ($allExists) {
    Write-Host "SUCCESS - All files present!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is running at: http://localhost:5174" -ForegroundColor Cyan
} else {
    Write-Host "ERROR - Some files are missing" -ForegroundColor Red
}
