export type Platform = 'instagram' | 'twitter' | 'threads' | 'direct';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  previewUrl: string;
  width?: number;
  height?: number;
  duration?: number;
  hasAudio?: boolean;
}

export interface ExtractedMedia {
  id: string;
  platform: Platform;
  title: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    verified?: boolean;
  };
  caption: string;
  originalUrl: string;
  items: MediaItem[];
  isMultiImage: boolean;
  hasVideo: boolean;
}

export interface SavedMediaItem {
  id: string;
  fileName: string;
  folder: 'images' | 'videos';
  targetFolderDisplay: string; // "SnapVault/images" or "SnapVault/videos"
  fileType: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  sizeBytes: number;
  savedAt: string;
  platform: Platform;
}

export interface StorageStats {
  totalItems: number;
  totalImages: number;
  totalVideos: number;
  totalSizeBytes: number;
}
