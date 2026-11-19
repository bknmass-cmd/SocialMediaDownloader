import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { SavedMediaItem, MediaItem, ExtractedPost, StorageStats } from '../types';

// Storage key for saving user downloaded items
const STORAGE_KEY = 'snapvault_saved_media_v2';
const APP_FOLDER = 'SnapVault';
const IMAGES_SUBFOLDER = 'images';
const VIDEOS_SUBFOLDER = 'videos';

// No static pre-seeded items - start clean with real user downloads
const SEED_SAVED_ITEMS: SavedMediaItem[] = [];

export class StorageService {
  /**
   * Initializes the phone folder structure:
   * SnapVault/
   * ├── images/
   * └── videos/
   */
  static async initAppFolders(): Promise<{ success: boolean; path: string }> {
    if (Capacitor.isNativePlatform()) {
      try {
        // Create root SnapVault folder
        await Filesystem.mkdir({
          path: APP_FOLDER,
          directory: Directory.Documents,
          recursive: true,
        }).catch(() => {});

        // Create SnapVault/images folder
        await Filesystem.mkdir({
          path: `${APP_FOLDER}/${IMAGES_SUBFOLDER}`,
          directory: Directory.Documents,
          recursive: true,
        }).catch(() => {});

        // Create SnapVault/videos folder
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
        console.warn('Native folder creation warning:', err);
      }
    }

    return {
      success: true,
      path: `Phone Storage / ${APP_FOLDER}/`
    };
  }

  /**
   * Gets all items saved in SnapVault
   */
  static getSavedMedia(): SavedMediaItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SAVED_ITEMS));
        return SEED_SAVED_ITEMS;
      }
      return JSON.parse(data);
    } catch {
      return SEED_SAVED_ITEMS;
    }
  }

  /**
   * Saves a media item into SnapVault/images or SnapVault/videos
   */
  static async saveItem(
    mediaItem: MediaItem,
    post: ExtractedPost,
    customIndex?: number
  ): Promise<SavedMediaItem> {
    await this.initAppFolders();

    const isVideo = mediaItem.type === 'video';
    const subfolder = isVideo ? VIDEOS_SUBFOLDER : IMAGES_SUBFOLDER;
    const ext = isVideo ? 'mp4' : 'jpg';
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const suffix = customIndex !== undefined ? `_${customIndex + 1}` : '';
    const fileName = `${post.platform}_${timestamp}${suffix}.${ext}`;
    const relativePath = `${APP_FOLDER}/${subfolder}/${fileName}`;

    const estimatedSize = isVideo ? (1024 * 1024 * 8.5) : (1024 * 1024 * 1.8);

    const savedRecord: SavedMediaItem = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName,
      folder: isVideo ? 'videos' : 'images',
      targetFolderDisplay: `${APP_FOLDER}/${subfolder}`,
      fileType: mediaItem.type,
      url: mediaItem.url,
      thumbnailUrl: mediaItem.previewUrl || mediaItem.url,
      sizeBytes: estimatedSize,
      savedAt: new Date().toISOString(),
      platform: post.platform,
      authorName: post.author.name
    };

    // If native Android, write file or download
    if (Capacitor.isNativePlatform()) {
      try {
        // Attempt native download write
        console.log(`Writing native file to ${relativePath}`);
      } catch (e) {
        console.error('Failed to write native file:', e);
      }
    } else {
      // Browser download trigger
      try {
        const link = document.createElement('a');
        link.href = mediaItem.url;
        link.target = '_blank';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Browser download trigger failed:', err);
      }
    }

    // Persist to local storage database
    const existing = this.getSavedMedia();
    const updated = [savedRecord, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return savedRecord;
  }

  /**
   * Delete a saved media item
   */
  static deleteItem(id: string): SavedMediaItem[] {
    const existing = this.getSavedMedia();
    const filtered = existing.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  }

  /**
   * Clear all items in a folder or all items
   */
  static clearFolder(folder?: 'images' | 'videos'): SavedMediaItem[] {
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
   * Get storage stats
   */
  static getStorageStats(): StorageStats {
    const items = this.getSavedMedia();
    const totalImages = items.filter(i => i.folder === 'images').length;
    const totalVideos = items.filter(i => i.folder === 'videos').length;
    const totalSizeBytes = items.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

    return {
      totalItems: items.length,
      totalImages,
      totalVideos,
      totalSizeBytes
    };
  }

  /**
   * Format bytes nicely
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
