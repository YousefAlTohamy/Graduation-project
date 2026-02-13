#!/usr/bin/env pwsh
# CareerCompass - One-Click Run All Services Script
# This script starts all 3 services in separate terminal windows

$ErrorActionPreference = "Continue"
$projectRoot = "a:\Graduation-project"

# Colors
$headerColor = "Cyan"
$successColor = "Green"
$infoColor = "Yellow"
$errorColor = "Red"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $headerColor
Write-Host "║         CareerCompass - Starting All Services              ║" -ForegroundColor $headerColor
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $headerColor
Write-Host ""

# Check if services are already running
$frontendRunning = Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match "vite|dev"}
$backendRunning = Get-Process php -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match "artisan"}
$aiRunning = Get-Process uvicorn -ErrorAction SilentlyContinue

if ($frontendRunning -or $backendRunning -or $aiRunning) {
    Write-Host "⚠️  Some services may already be running:" -ForegroundColor $infoColor
    if ($frontendRunning) { Write-Host "   • Frontend (Node.js process detected)" -ForegroundColor $infoColor }
    if ($backendRunning) { Write-Host "   • Backend (PHP process detected)" -ForegroundColor $infoColor }
    if ($aiRunning) { Write-Host "   • AI Engine (Uvicorn process detected)" -ForegroundColor $infoColor }
    Write-Host ""
}

# 1. Start Frontend
Write-Host "📱 Starting Frontend Service..." -ForegroundColor $infoColor
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\frontend'; Write-Host ''; Write-Host 'Frontend starting on port 5173...' -ForegroundColor Cyan; npm run dev"
)
Start-Sleep -Seconds 2
Write-Host "✓ Frontend window opened" -ForegroundColor $successColor
Write-Host ""

# 2. Start Backend
Write-Host "🔧 Starting Backend API Service..." -ForegroundColor $infoColor
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\backend-api'; Write-Host ''; Write-Host 'Backend starting on port 8000...' -ForegroundColor Cyan; php artisan serve"
)
Start-Sleep -Seconds 2
Write-Host "✓ Backend window opened" -ForegroundColor $successColor
Write-Host ""

# 3. Start AI Engine
Write-Host "🤖 Starting AI Engine Service..." -ForegroundColor $infoColor
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\ai-engine'; Write-Host ''; Write-Host 'AI Engine starting on port 8001...' -ForegroundColor Cyan; .\venv\Scripts\activate.ps1; uvicorn main:app --reload --port 8001"
)
Start-Sleep -Seconds 2
Write-Host "✓ AI Engine window opened" -ForegroundColor $successColor
Write-Host ""

# Display completion message
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $successColor
Write-Host "║              ✅ All Services Started!                      ║" -ForegroundColor $successColor
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $successColor
Write-Host ""
Write-Host "🌐 Open your browser and visit:" -ForegroundColor $headerColor
Write-Host "   → http://localhost:5173" -ForegroundColor $successColor
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor $headerColor
Write-Host "   • Frontend    : http://localhost:5173" -ForegroundColor "White"
Write-Host "   • Backend API : http://localhost:8000" -ForegroundColor "White"
Write-Host "   • AI Engine   : http://localhost:8001" -ForegroundColor "White"
Write-Host ""
Write-Host "⏱️  Give services 10-15 seconds to fully start up..." -ForegroundColor $infoColor
Write-Host ""
Write-Host "💡 To stop all services, close all three terminal windows." -ForegroundColor $infoColor
Write-Host ""
