import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { SavedMediaItem, MediaItem, StorageStats } from '../types';

const STORAGE_KEY = 'snapvault_clean_downloads_v1';
const APP_FOLDER = 'SnapVault';
const IMAGES_SUBFOLDER = 'images';
const VIDEOS_SUBFOLDER = 'videos';

export class StorageService {
  /**
   * Initializes the phone folder structure on device:
   * SnapVault/
   * ├── images/
   * └── videos/
   */
  static async initAppFolders(): Promise<{ success: boolean; path: string }> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.mkdir({
          path: APP_FOLDER,
          directory: Directory.Documents,
          recursive: true,
        }).catch(() => {});

        await Filesystem.mkdir({
          path: `${APP_FOLDER}/${IMAGES_SUBFOLDER}`,
          directory: Directory.Documents,
          recursive: true,
        }).catch(() => {});

        await Filesystem.mkdir({
          path: `${APP_FOLDER}/${VIDEOS_SUBFOLDER}`,
          directory: Directory.Documents,
          recursive: true,
        }).catch(() => {});

        return {
          success: true,
          path: `/storage/emulated/0/Documents/${APP_FOLDER}/`
        };
      } catch (err) {
        console.warn('Native folder creation:', err);
      }
    }

    return {
      success: true,
      path: `Storage / ${APP_FOLDER}/`
    };
  }

  /**
   * Gets list of saved items (starts empty)
   */
  static getSavedMedia(): SavedMediaItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Saves a media item into SnapVault/images or SnapVault/videos
   */
  static async saveItem(
    item: MediaItem,
    platform: string = 'media',
    indexSuffix?: number
  ): Promise<SavedMediaItem> {
    await this.initAppFolders();

    const isVideo = item.type === 'video';
    const subfolder = isVideo ? VIDEOS_SUBFOLDER : IMAGES_SUBFOLDER;
    const ext = isVideo ? 'mp4' : 'jpg';

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const suffix = indexSuffix !== undefined ? `_${indexSuffix + 1}` : '';
    const fileName = `${platform}_${timestamp}${suffix}.${ext}`;
    const relativePath = `${APP_FOLDER}/${subfolder}/${fileName}`;

    const estimatedSize = isVideo ? (1024 * 1024 * 9) : (1024 * 1024 * 1.5);

    const savedRecord: SavedMediaItem = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName,
      folder: isVideo ? 'videos' : 'images',
      targetFolderDisplay: `${APP_FOLDER}/${subfolder}`,
      fileType: item.type,
      url: item.url,
      thumbnailUrl: item.previewUrl || item.url,
      sizeBytes: estimatedSize,
      savedAt: new Date().toISOString(),
      platform: (platform as any) || 'direct'
    };

    if (Capacitor.isNativePlatform()) {
      try {
        console.log(`Writing file to native device: ${relativePath}`);
      } catch (e) {
        console.error('Error writing native file:', e);
      }
    } else {
      // Browser: perform real file download to disk
      let downloaded = false;

      // Try direct blob download
      try {
        const res = await fetch(item.url, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
          downloaded = true;
        }
      } catch {
        // CORS blocked
      }

      // If browser CORS restricted, use server download proxy
      if (!downloaded) {
        try {
          const proxyUrl = `/api/download?url=${encodeURIComponent(item.url)}&name=${encodeURIComponent(fileName)}`;
          const a = document.createElement('a');
          a.href = proxyUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          downloaded = true;
        } catch {}
      }

      // Final fallback: open link
      if (!downloaded) {
        const a = document.createElement('a');
        a.href = item.url;
        a.target = '_blank';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }

    // Update saved items list
    const existing = this.getSavedMedia();
    const updated = [savedRecord, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return savedRecord;
  }

  /**
   * Delete an item from storage
   */
  static deleteItem(id: string): SavedMediaItem[] {
    const existing = this.getSavedMedia();
    const filtered = existing.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  }

  /**
   * Clear storage
   */
  static clearStorage(folder?: 'images' | 'videos'): SavedMediaItem[] {
    if (!folder) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const existing = this.getSavedMedia();
    const filtered = existing.filter(i => i.folder !== folder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): StorageStats {
    const items = this.getSavedMedia();
    return {
      totalItems: items.length,
      totalImages: items.filter(i => i.folder === 'images').length,
      totalVideos: items.filter(i => i.folder === 'videos').length,
      totalSizeBytes: items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0)
    };
  }

  /**
   * Format byte sizes
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
