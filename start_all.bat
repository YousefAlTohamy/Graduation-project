@echo off
cd /d %~dp0
title CareerCompass Launcher
echo ===================================================
echo   Starting CareerCompass Graduation Project
echo ===================================================

echo.
echo 1. Starting Frontend (React)...
start "CareerCompass Frontend" cmd /k "cd frontend && npm run dev"

echo 2. Starting Backend API (Laravel)...
start "CareerCompass Backend" cmd /k "cd backend-api && php artisan serve"

echo 3. Starting AI Engine (Python)...
start "CareerCompass AI Engine" cmd /k "cd ai-engine && call venv\Scripts\activate && uvicorn main:app --reload --port 8001"

echo.
echo ===================================================
echo   All services launched in separate windows!
echo   Frontend: http://localhost:5173
echo ===================================================
echo.
pause