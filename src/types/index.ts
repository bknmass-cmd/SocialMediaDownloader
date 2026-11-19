export type Platform = 'instagram' | 'twitter' | 'threads';

export interface Author {
  name: string;
  handle: string;
  avatar: string;
  verified?: boolean;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  previewUrl: string;
  width?: number;
  height?: number;
  duration?: number; // in seconds for videos
  hasAudio?: boolean;
  aspectRatio?: string;
}

export interface ExtractedPost {
  id: string;
  platform: Platform;
  author: Author;
  caption: string;
  timestamp: string;
  originalUrl: string;
  media: MediaItem[];
  isMultiImage: boolean;
  hasVideo: boolean;
}

export interface SavedMediaItem {
  id: string;
  fileName: string;
  folder: 'images' | 'videos';
  targetFolderDisplay: string; // e.g. "SnapVault/images" or "SnapVault/videos"
  fileType: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  sizeBytes: number;
  savedAt: string;
  platform: Platform;
  authorName?: string;
}

export interface StorageStats {
  totalItems: number;
  totalImages: number;
  totalVideos: number;
  totalSizeBytes: number;
}
