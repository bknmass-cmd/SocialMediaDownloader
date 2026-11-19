# 📸 SnapVault - Social Media Media Saver PRO

> **All-in-one Media Saver for Android (Instagram, Twitter / X, & Threads)**

SnapVault is an ultra-fast, modern Android mobile application designed to extract and save media from the top 3 social media platforms:
1. **Instagram** (Posts, Reels, Carousel / Multi-Images)
2. **Twitter / X** (Photos, Multi-photo sets, Videos & Clips)
3. **Threads** (Carousels & Video Posts)

---

## ✨ Features

- 📱 **Attractive Mobile UI**: Built with a sleek dark aesthetic, gradient highlights for each platform, interactive tabs, and mobile-friendly touch targets.
- 🖼️ **Multi-Image Support**:
  - Paste any carousel / multi-image post.
  - Preview all photos in a responsive grid.
  - Select individual photo(s) using custom checkboxes, or tap **"Select All"** / **"Deselect All"**.
  - Download only the selected photos or all photos with one tap.
- 🎥 **Video Player with Audio Controls**:
  - Direct video preview playback with seek bar and duration.
  - Dedicated buttons: **"With Music / Sound" (Unmute)** and **"Mute Video"** with real-time audio wave animation.
  - Download high-definition MP4 videos directly.
- 📁 **Automatic Phone Storage Folder Organization**:
  - Automatically creates and manages storage folders on your Android device:
    - `SnapVault/` (Main App Folder)
      - `SnapVault/images/` (Saved Photos)
      - `SnapVault/videos/` (Saved MP4 Videos)
  - In-app **Folder Explorer tab** lets you browse, preview, and delete saved files.
- ⚡ **1-Click Quick Demo Links**: Built-in test samples for Instagram, Twitter / X, and Threads so you can test all features instantly.

---

## 🚀 Running Locally (Live Preview)

The local server is already running! You can open:

- **Local Browser**: [http://localhost:5173/](http://localhost:5173/)
- **Mobile Device on Same Wi-Fi**: Open `http://192.168.1.3:5173/` on your phone's Chrome/browser!

To restart the local dev server manually at any time:
```bash
npm run dev
```

---

## 📦 How to Build the Android APK

The project is completely configured with Capacitor and the native Android scaffold in `android/`.

### Option A: Using the 1-Click Batch Script
Run:
```cmd
build-apk.bat
```

### Option B: Using Android Studio
1. Open terminal and run:
   ```cmd
   npm run build
   npx cap sync android
   npx cap open android
   ```
2. In Android Studio, go to:
   **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
3. Your APK will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### Option C: Using GitHub Actions (Automated Cloud APK Build)
Push this repository to GitHub. The included workflow `.github/workflows/build-apk.yml` will automatically build the APK on GitHub's cloud servers and provide a downloadable `.apk` artifact with zero local setup needed!

---

## 📱 Installing on Your Phone
1. Transfer `app-debug.apk` to your phone (via USB, Google Drive, WhatsApp, etc.).
2. Tap the `.apk` file on your phone.
3. Allow *"Install unknown apps"* if prompted.
4. Launch **SnapVault** — it will automatically create the `SnapVault/images` and `SnapVault/videos` folders on your phone storage!
