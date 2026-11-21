@echo off
title SocialSaver - FastAPI Backend Server
echo ========================================================
echo   SocialSaver - Python FastAPI Backend (Port 8000)
echo ========================================================

cd /d "%~dp0backend"

:: Detect Python executable
set "PY_BIN=python"
if exist "C:\Users\balak\AppData\Local\Python\pythoncore-3.15-64\python.exe" (
    set "PY_BIN=C:\Users\balak\AppData\Local\Python\pythoncore-3.15-64\python.exe"
) else if exist "C:\Users\balak\AppData\Local\Python\bin\python.exe" (
    set "PY_BIN=C:\Users\balak\AppData\Local\Python\bin\python.exe"
)

echo Using Python: %PY_BIN%
"%PY_BIN%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
