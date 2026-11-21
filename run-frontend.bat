@echo off
title SocialSaver - Angular Frontend Dev Server
echo ========================================================
echo   SocialSaver - Angular 22 Frontend (Port 4200)
echo ========================================================

if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
call npm.cmd start
pause
