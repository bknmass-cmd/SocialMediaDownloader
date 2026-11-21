export type Platform = 'instagram' | 'youtube' | 'threads' | 'twitter' | 'generic';
export type MediaType = 'single_image' | 'carousel' | 'video';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  thumbnail_url: string;
  media_url: string;
  duration?: number | null;
}

export interface ExtractResponse {
  platform: Platform;
  media_type: MediaType;
  title: string;
  items: MediaItem[];
  originalUrl?: string;
}

export interface SavedMedia {
  id: string;
  fileName: string;
  folder: 'Pictures/SocialSaver' | 'Movies/SocialSaver';
  type: 'image' | 'video';
  thumbnailUrl: string;
  fileUri?: string;
  sizeBytes: number;
  savedAt: string;
  platform: Platform;
  isMuted?: boolean;
}
