@echo off
title SocialSaver - Angular Frontend Dev Server
echo ========================================================
echo   SocialSaver - Angular 22 Frontend (Port 4200)
echo ========================================================

cd /d "%~dp0frontend"
call npm.cmd start
pause
