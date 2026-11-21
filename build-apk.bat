@echo off
title SocialSaver - Build Android APK
echo ========================================================
echo   SocialSaver - Building Android APK
echo   Monorepo: Angular 22 + Capacitor 8 + MediaStore
echo ========================================================

cd /d "%~dp0frontend"

echo.
echo [1/3] Building Angular 22 production bundle...
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Angular build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Synchronizing Capacitor Android project...
call npx.cmd cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Compiling Native Android APK with Gradle...
if exist "android\gradlew.bat" (
    cd android
    call gradlew.bat assembleDebug
    if %ERRORLEVEL% EQU 0 (
        cd ..
        if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
            copy "android\app\build\outputs\apk\debug\app-debug.apk" "..\SocialSaver-debug.apk" >nul
            echo.
            echo ========================================================
            echo   SUCCESS! APK built successfully:
            echo   - File: SocialSaver-debug.apk (in project root)
            echo   - Path: frontend\android\app\build\outputs\apk\debug\app-debug.apk
            echo ========================================================
        )
    ) else (
        echo.
        echo [INFO] Gradle build requires JDK 17+ and Android SDK.
        echo If you do not have Java in PATH:
        echo   1. Install OpenJDK 17 or 21 (https://adoptium.net/)
        echo   2. Set JAVA_HOME, or open the project in Android Studio:
        echo      cd frontend ^&^& npx cap open android
        echo   3. Click "Build" -^> "Build Bundle(s) / APK(s)" -^> "Build APK(s)"
        cd ..
    )
) else (
    echo [ERROR] android\gradlew.bat not found. Run 'npx cap add android' first.
)

cd /d "%~dp0"
echo.
pause
