@echo off
title NutriGuard - Food Ingredient Analyzer
color 0A

echo ==============================================================
echo        NutriGuard - Food Ingredient Analyzer (Objective 1)
echo ==============================================================
echo.
echo Starting Unified Frontend + Backend Server...
echo.

:: Free port 5173 if previously occupied by a stale process
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

cd /d "%~dp0"

:: Check dependencies
if not exist "node_modules" (
    echo [1/3] Installing dependencies...
    call npm install
) else (
    echo [1/3] Dependencies found.
)

:: Check database
if not exist "nutriguard.db" (
    echo [2/3] Initializing and seeding database from datasets...
    python seed_db.py
) else (
    echo [2/3] Database ready.
)

echo [3/3] Starting NutriGuard server on Port 5173...
echo.
echo ==============================================================
echo  Opening NutriGuard at: http://localhost:5173/
echo.
echo  Keep this window OPEN while using NutriGuard.
echo  Press Ctrl + C in this window to stop the server anytime.
echo ==============================================================
echo.

:: Open browser automatically to port 5173 after 4 seconds
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5173/"

:: Start dev server on port 5173
call npm run dev

pause
