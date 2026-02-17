@echo off
cd /d %~dp0
title CareerCompass Launcher
echo ===================================================
echo   Starting CareerCompass Graduation Project
echo   with Market Intelligence System
echo ===================================================

echo.
echo 1. Starting Frontend (React)...
start "CareerCompass Frontend" cmd /k "cd frontend && npm run dev"

echo 2. Starting Backend API (Laravel)...
start "CareerCompass Backend" cmd /k "cd backend-api && php artisan serve"

echo 3. Starting AI Engine (Python)...
start "CareerCompass AI Engine" cmd /k "cd ai-engine && call venv\Scripts\activate && uvicorn main:app --reload --port 8001"

echo 4. Starting Queue Worker (Laravel)...
start "CareerCompass Queue Worker" cmd /k "cd backend-api && php artisan queue:work --queue=high,default --tries=3 --timeout=300"

echo 5. Starting Task Scheduler (Laravel)...
start "CareerCompass Scheduler" cmd /k "cd backend-api && php artisan schedule:work"

echo.
echo ===================================================
echo   All services launched in separate windows!
echo   - Frontend:     http://localhost:5173
echo   - Backend API:  http://127.0.0.1:8000
echo   - AI Engine:    http://127.0.0.1:8001
echo   - Queue Worker: Processing background jobs [On-Demand]
echo   - Scheduler:    Running periodic tasks [Every 48h/Daily]
echo ===================================================
echo.
echo Note: Keep all 5 windows open while using the app.
echo.
pause