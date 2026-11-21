# SocialSaver 🚀
> Complete, production-grade social media downloader solution for **Instagram**, **YouTube & Shorts**, **Threads**, and **X (Twitter)**. Built with **Python (FastAPI)** + **Angular 22** + **Capacitor 8** for Android.

---

## 📱 Features

1. **Multi-Platform URL Extraction (`POST /api/extract`):**
   - Extracts metadata, single photos, high-res carousel posts, and video streams with thumbnails and durations.
   - Built with `yt-dlp` and `ffmpeg`.
   - Supports Instagram (Posts, Reels, Carousels), YouTube (Videos & Shorts), Threads, and X (Twitter).

2. **Custom Media Streaming & Transformation (`GET /api/download`):**
   - **High-Res Images:** Proxied streaming directly through backend to avoid CORS restrictions.
   - **Video with Audio:** Merges best video and best audio streams into MP4 and cleans up temporary files after delivery.
   - **Muted Video (No Audio):** Generates clean audio-free MP4 via FFmpeg stream stripping (`-c copy -an`).

3. **Angular 22 Mobile-First Frontend:**
   - Standalone components and Angular Signals (`signal`, `computed`).
   - Tailwind CSS dark-themed mobile UI.
   - One-tap paste from Android clipboard via `@capacitor/clipboard`.
   - Responsive 2-column image carousel selection grid with "Select All", "Deselect All", "Download Selected (X)", and "Download All".
   - Dual video download buttons: **Download Video (With Music)** and **Download Mute Video (No Audio)**.
   - In-app gallery tab tracking saved items, with native file sharing (`@capacitor/share`).

4. **Native Android Integration:**
   - **Automatic App Folder Creation:** Automatically creates `Pictures/SocialSaver` and `Movies/SocialSaver`.
   - **Native Android MediaStore Bridge (`MediaStorePlugin.java`):** Automatically registers saved images and videos with the Android `MediaStore` content provider (`RELATIVE_PATH`), ensuring downloaded files immediately appear in the phone's native Gallery app.
   - Configurable Backend IP in settings modal (`http://localhost:8000`, `http://10.0.2.2:8000`, or LAN IP).

---

## 📂 Project Architecture

```
insta/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                 # FastAPI endpoints & CORS
│   │   ├── models/schemas.py       # Pydantic validation schemas
│   │   └── services/extractor.py   # yt-dlp metadata extraction & FFmpeg
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Containerized deployment
│   └── run.bat                     # Quick backend launcher
│
├── frontend/                       # Angular 22 + Capacitor 8 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── models/             # MediaItem, ExtractResponse, SavedMedia
│   │   │   ├── services/           # ApiService, StorageService, MediaStoreService
│   │   │   ├── app.component.ts    # Signals state & download handlers
│   │   │   ├── app.component.html  # Mobile UI layout
│   │   │   └── app.component.css
│   │   └── styles.css              # Tailwind CSS styles
│   ├── android/                    # Native Android platform
│   │   └── app/src/main/
│   │       ├── java/com/socialsaver/app/
│   │       │   ├── MainActivity.java
│   │       │   └── MediaStorePlugin.java # Native MediaStore registration
│   │       └── AndroidManifest.xml # Permissions & cleartext traffic
│   ├── capacitor.config.ts         # App ID: com.socialsaver.app
│   └── package.json
│
├── run-all.bat                     # Starts both backend and frontend
├── run-backend.bat                 # Starts FastAPI backend
├── run-frontend.bat                # Starts Angular frontend
└── build-apk.bat                   # Builds Android APK
```

---

## ⚡ Quick Start

### 1. Run Backend and Frontend Concurrently
Double-click `run-all.bat` or run:
```bat
run-all.bat
```
- **Backend API:** `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- **Frontend App:** `http://localhost:4200`

---

## 📦 Building the Android APK

1. Make sure you have **Java JDK 17+** and the **Android SDK** installed.
2. Run the build script:
```bat
build-apk.bat
```
This script will:
- Run `ng build` for Angular 22
- Sync the build into the Capacitor Android project (`npx cap sync android`)
- Run Gradle (`gradlew.bat assembleDebug`)
- Output `SocialSaver-debug.apk` directly to the project root directory.

### Alternative: Build with Android Studio
```bash
cd frontend
npx cap open android
```
In Android Studio:
1. Wait for Gradle sync to finish.
2. Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Locate the APK under `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.
4. Install on your Android phone using `adb install app-debug.apk` or transfer the file to your device.
