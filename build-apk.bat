@echo off
echo ========================================================
echo   SnapVault - Building Android APK
echo ========================================================

echo.
echo [1/3] Compiling web production bundle...
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web build failed.
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
echo [3/3] Assembling Debug APK...
if defined JAVA_HOME (
    cd android
    call gradlew.bat assembleDebug
    if %ERRORLEVEL% EQU 0 (
        cd ..
        copy android\app\build\outputs\apk\debug\app-debug.apk SnapVault-debug.apk
        echo.
        echo ========================================================
        echo   SUCCESS! APK built successfully:
        echo   SnapVault-debug.apk (Root folder)
        echo   android\app\build\outputs\apk\debug\app-debug.apk
        echo ========================================================
    ) else (
        echo [ERROR] Gradle build failed. Check Java or Android SDK settings.
        cd ..
    )
) else (
    echo [NOTICE] JAVA_HOME is not set in this shell.
    echo To build locally:
    echo   1. Install Java JDK 17 (e.g. from https://adoptium.net/)
    echo   2. Run this script again, or run 'npx cap open android' in Android Studio
    echo      and click: Build -^> Build Bundle(s) / APK(s) -^> Build APK(s)
)

echo.
pause
