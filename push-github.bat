@echo off
title SocialMediaDownloader - Git Push to GitHub
echo ========================================================
echo   Pushing code to GitHub:
echo   https://github.com/bknmass-cmd/SocialMediaDownloader.git
echo ========================================================
echo.

if exist "C:\Program Files\Git\cmd" set "PATH=C:\Program Files\Git\cmd;%PATH%"
cd /d "%~dp0"

echo [1/3] Staging any remaining files...
git add -A

echo.
echo [2/3] Verifying Remote URL...
git remote set-url origin https://github.com/bknmass-cmd/SocialMediaDownloader.git
git remote -v

echo.
echo [3/3] Pushing to main branch...
echo (If Git Credential Manager or GitHub login popup appears, please sign in)
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Code pushed successfully to GitHub!
    echo   Repository: https://github.com/bknmass-cmd/SocialMediaDownloader
    echo ========================================================
) else (
    echo.
    echo [NOTICE] If the push failed due to authentication:
    echo 1. Complete the GitHub login popup window on your screen.
    echo 2. Or create a Personal Access Token (Classic) at:
    echo    https://github.com/settings/tokens
    echo    and enter it when prompted for your password.
)

echo.
pause
