@echo off
title SocialSaver - Full Stack Launcher
echo ========================================================
echo   SocialSaver - Launching Full Stack Solution
echo   1. FastAPI Backend:  http://localhost:8000
echo   2. Angular Frontend: http://localhost:4200
echo ========================================================

start "SocialSaver Backend" cmd /c "%~dp0run-backend.bat"
timeout /t 2 >nul
start "SocialSaver Frontend" cmd /c "%~dp0run-frontend.bat"

echo.
echo Both servers started in dedicated windows!
echo Open http://localhost:4200 in your browser to test locally.
echo.
pause
