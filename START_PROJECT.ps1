$ErrorActionPreference = "Continue"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CareerCompass - Multi-Service Startup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Frontend Setup
Write-Host ""
Write-Host "Package Frontend Setup" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

cd "a:\Graduation-project\frontend"

if (Test-Path "node_modules") {
    Write-Host "Frontend dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install 2>&1 | Out-Null
    Write-Host "Frontend dependencies installed" -ForegroundColor Green
}

# 2. Backend Setup
Write-Host ""
Write-Host "Backend Setup" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

cd "a:\Graduation-project\backend-api"

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -Force
}

if (-not (Test-Path "vendor")) {
    Write-Host "Installing Composer dependencies..." -ForegroundColor Yellow
    composer install 2>&1 | Out-Null
    Write-Host "Composer dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Composer dependencies already installed" -ForegroundColor Green
}

# 3. AI Engine Setup
Write-Host ""
Write-Host "AI Engine Setup" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

cd "a:\Graduation-project\ai-engine"

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
}

& ".\venv\Scripts\activate.ps1"

if (-not (Test-Path "venv\Lib\site-packages\fastapi")) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    & ".\venv\Scripts\python" -m pip install -q -r requirements.txt
    Write-Host "Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Python dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps: Start these services in separate terminal windows:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. FRONTEND (Port 5173):" -ForegroundColor White
Write-Host "   cd a:\Graduation-project\frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. BACKEND API (Port 8000):" -ForegroundColor White
Write-Host "   cd a:\Graduation-project\backend-api && php artisan serve" -ForegroundColor Gray
Write-Host ""
Write-Host "3. AI ENGINE (Port 8001):" -ForegroundColor White
Write-Host "   cd a:\Graduation-project\ai-engine" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\activate" -ForegroundColor Gray
Write-Host "   uvicorn main:app --reload --port 8001" -ForegroundColor Gray
Write-Host ""
Write-Host "Then open: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""

