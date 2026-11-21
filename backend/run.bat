@echo off
echo Starting SocialSaver FastAPI Backend...
set PYTHON="C:\Users\balak\AppData\Local\Python\bin\python.exe"
if not exist %PYTHON% set PYTHON=python
cd /d "%~dp0"
%PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
