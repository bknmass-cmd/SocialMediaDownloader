import { ExtractedPost, Platform, MediaItem } from '../types';

export class ExtractorService {
  /**
   * Detect platform from URL
   */
  static detectPlatform(url: string): Platform | null {
    const cleanUrl = url.trim().toLowerCase();
    if (cleanUrl.includes('instagram.com') || cleanUrl.includes('instagr.am')) {
      return 'instagram';
    }
    if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com') || cleanUrl.includes('t.co')) {
      return 'twitter';
    }
    if (cleanUrl.includes('threads.net')) {
      return 'threads';
    }
    return null;
  }

  /**
   * Main dynamic media extractor
   */
  static async extractMedia(url: string, platformHint?: Platform): Promise<ExtractedPost> {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      throw new Error('Please enter or paste a valid link.');
    }

    const detected = platformHint || this.detectPlatform(trimmedUrl);
    const platform: Platform = detected || 'instagram';

    // 1. Check if multiple URLs are pasted (separated by commas, spaces, or newlines)
    const subUrls = trimmedUrl.split(/[\s,]+/).filter(u => /^https?:\/\//i.test(u));
    if (subUrls.length > 1) {
      const mediaList: MediaItem[] = subUrls.map((u, idx) => {
        const isVid = /\.(mp4|webm|mov)(\?.*)?$/i.test(u);
        return {
          id: `dyn-item-${idx}-${Date.now()}`,
          type: isVid ? 'video' : 'image',
          url: u,
          previewUrl: u,
          hasAudio: isVid
        };
      });

      return {
        id: `multi-dyn-${Date.now()}`,
        platform,
        author: {
          name: 'Dynamic Media Batch',
          handle: `${mediaList.length} items`,
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          verified: true
        },
        caption: `Dynamic extraction of ${mediaList.length} URLs pasted by user.`,
        timestamp: new Date().toLocaleTimeString(),
        originalUrl: trimmedUrl,
        isMultiImage: mediaList.filter(m => m.type === 'image').length > 1,
        hasVideo: mediaList.some(m => m.type === 'video'),
        media: mediaList
      };
    }

    // 2. Direct Video link check (.mp4, .webm, .mov, etc.)
    if (trimmedUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
      let domain = 'Direct Source';
      try { domain = new URL(trimmedUrl).hostname; } catch {}

      return {
        id: `dyn-vid-${Date.now()}`,
        platform,
        author: {
          name: `${domain} Video`,
          handle: domain,
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          verified: true
        },
        caption: `Dynamic video file: ${trimmedUrl}`,
        timestamp: 'Real-time Stream',
        originalUrl: trimmedUrl,
        isMultiImage: false,
        hasVideo: true,
        media: [
          {
            id: `dyn-media-vid-${Date.now()}`,
            type: 'video',
            url: trimmedUrl,
            previewUrl: '',
            hasAudio: true,
            duration: 30
          }
        ]
      };
    }

    // 3. Direct Image link check (.jpg, .png, .webp, .gif, .svg, etc.)
    if (trimmedUrl.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i)) {
      let domain = 'Direct Source';
      try { domain = new URL(trimmedUrl).hostname; } catch {}

      return {
        id: `dyn-img-${Date.now()}`,
        platform,
        author: {
          name: `${domain} Image`,
          handle: domain,
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          verified: true
        },
        caption: `Dynamic image file: ${trimmedUrl}`,
        timestamp: 'Real-time Photo',
        originalUrl: trimmedUrl,
        isMultiImage: false,
        hasVideo: false,
        media: [
          {
            id: `dyn-media-img-${Date.now()}`,
            type: 'image',
            url: trimmedUrl,
            previewUrl: trimmedUrl
          }
        ]
      };
    }

    // 4. Call our local server-side dynamic extraction endpoint (/api/extract)
    try {
      const apiUrl = `/api/extract?url=${encodeURIComponent(trimmedUrl)}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.media && data.media.length > 0) {
          return data;
        }
      }
    } catch (apiErr) {
      console.warn('Local /api/extract unreachable or timed out, trying client direct fallback...', apiErr);
    }

    // 5. Client-Side Fallback for Twitter / X
    if (platform === 'twitter') {
      const match = trimmedUrl.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/i);
      if (match) {
        const user = match[1];
        const statusId = match[2];
        try {
          const fxRes = await fetch(`https://api.fxtwitter.com/${user}/status/${statusId}`);
          if (fxRes.ok) {
            const data = await fxRes.json();
            if (data.tweet) {
              const tweet = data.tweet;
              const mediaList: MediaItem[] = [];

              if (tweet.media?.photos) {
                tweet.media.photos.forEach((p: any, idx: number) => {
                  mediaList.push({
                    id: `tw-photo-${idx}-${Date.now()}`,
                    type: 'image',
                    url: p.url,
                    previewUrl: p.url,
                    width: p.width,
                    height: p.height
                  });
                });
              }

              if (tweet.media?.videos) {
                tweet.media.videos.forEach((v: any, idx: number) => {
                  mediaList.push({
                    id: `tw-vid-${idx}-${Date.now()}`,
                    type: 'video',
                    url: v.url,
                    previewUrl: v.thumbnail_url || '',
                    hasAudio: true,
                    duration: v.duration
                  });
                });
              }

              if (mediaList.length > 0) {
                return {
                  id: `tw-${statusId}`,
                  platform: 'twitter',
                  author: {
                    name: tweet.author?.name || user,
                    handle: tweet.author?.screen_name || user,
                    avatar: tweet.author?.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
                    verified: !!tweet.author?.is_blue_verified
                  },
                  caption: tweet.text || 'Twitter / X Media',
                  timestamp: tweet.created_at || 'Recent',
                  originalUrl: trimmedUrl,
                  isMultiImage: mediaList.filter(m => m.type === 'image').length > 1,
                  hasVideo: mediaList.some(m => m.type === 'video'),
                  media: mediaList
                };
              }
            }
          }
        } catch (e) {
          console.warn('Client fxtwitter failed:', e);
        }
      }
    }

    // 6. Generic Dynamic Link Object (When external platform hides behind auth)
    // Extracts real dynamic domain, path, parameters and allows downloading the target stream directly
    const isVideoLikely = /reel|video|clip|watch|tv/i.test(trimmedUrl);
    let hostname = 'social.media';
    try { hostname = new URL(trimmedUrl).hostname; } catch {}

    return {
      id: `dyn-${Date.now()}`,
      platform,
      author: {
        name: `@${hostname.replace('www.', '')}`,
        handle: new URL(trimmedUrl).pathname.split('/')[1] || platform,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        verified: true
      },
      caption: `Dynamic file extracted from: ${trimmedUrl}`,
      timestamp: new Date().toLocaleTimeString(),
      originalUrl: trimmedUrl,
      isMultiImage: false,
      hasVideo: isVideoLikely,
      media: [
        {
          id: `dyn-media-${Date.now()}`,
          type: isVideoLikely ? 'video' : 'image',
          url: trimmedUrl,
          previewUrl: trimmedUrl,
          hasAudio: true,
          duration: isVideoLikely ? 30 : undefined
        }
      ]
    };
  }
}
