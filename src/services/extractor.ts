import { ExtractedMedia, Platform, MediaItem } from '../types';

export class ExtractorService {
  /**
   * Detects platform from URL
   */
  static detectPlatform(url: string): Platform {
    const clean = url.trim().toLowerCase();
    if (clean.includes('instagram.com') || clean.includes('instagr.am')) return 'instagram';
    if (clean.includes('twitter.com') || clean.includes('x.com') || clean.includes('t.co')) return 'twitter';
    if (clean.includes('threads.net')) return 'threads';
    return 'direct';
  }

  /**
   * Extracts media from pasted URL dynamically
   */
  static async extract(inputUrl: string): Promise<ExtractedMedia> {
    const raw = inputUrl.trim();
    if (!raw) {
      throw new Error('Please enter or paste a valid URL.');
    }

    const platform = this.detectPlatform(raw);

    // 1. Check for multiple URLs separated by spaces, commas, or newlines
    const subUrls = raw.split(/[\s,]+/).filter(u => /^https?:\/\//i.test(u));
    if (subUrls.length > 1) {
      const items: MediaItem[] = subUrls.map((u, i) => {
        const isVid = /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(u) || /video|reel|clip/i.test(u);
        return {
          id: `item-${i}-${Date.now()}`,
          type: isVid ? 'video' : 'image',
          url: u,
          previewUrl: u,
          hasAudio: isVid
        };
      });

      return {
        id: `batch-${Date.now()}`,
        platform,
        title: `Batch of ${items.length} Files`,
        author: {
          name: 'Multi-URL Selection',
          handle: `${items.length} items`,
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          verified: true
        },
        caption: `Pasted ${items.length} URLs. Select specific images or download all.`,
        originalUrl: raw,
        items,
        isMultiImage: items.filter(it => it.type === 'image').length > 1,
        hasVideo: items.some(it => it.type === 'video')
      };
    }

    // 2. Direct Video link check (.mp4, .webm, etc.)
    if (/\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(raw)) {
      let domain = 'Direct Source';
      try { domain = new URL(raw).hostname; } catch {}

      return {
        id: `vid-${Date.now()}`,
        platform: 'direct',
        title: `${domain} Video`,
        author: {
          name: domain,
          handle: domain,
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          verified: true
        },
        caption: `Direct video file: ${raw}`,
        originalUrl: raw,
        items: [{
          id: `vid-item-${Date.now()}`,
          type: 'video',
          url: raw,
          previewUrl: '',
          hasAudio: true,
          duration: 30
        }],
        isMultiImage: false,
        hasVideo: true
      };
    }

    // 3. Direct Image link check (.jpg, .png, etc.)
    if (/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(raw)) {
      let domain = 'Direct Source';
      try { domain = new URL(raw).hostname; } catch {}

      return {
        id: `img-${Date.now()}`,
        platform: 'direct',
        title: `${domain} Image`,
        author: {
          name: domain,
          handle: domain,
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          verified: true
        },
        caption: `Direct image file: ${raw}`,
        originalUrl: raw,
        items: [{
          id: `img-item-${Date.now()}`,
          type: 'image',
          url: raw,
          previewUrl: raw
        }],
        isMultiImage: false,
        hasVideo: false
      };
    }

    // 4. Query Server Endpoint (/api/extract?url=...)
    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(raw)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Server extract request failed:', e);
    }

    // 5. Fallback wrapper: present the user's URL directly with media player / viewer
    const isVideoLikely = /reel|video|clip|watch|tv/i.test(raw);
    let hostname = 'social.media';
    try { hostname = new URL(raw).hostname; } catch {}

    return {
      id: `dyn-${Date.now()}`,
      platform,
      title: `${platform.toUpperCase()} Post`,
      author: {
        name: `@${hostname.replace('www.', '')}`,
        handle: new URL(raw).pathname.split('/')[1] || platform,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        verified: true
      },
      caption: `Media link from: ${raw}`,
      originalUrl: raw,
      items: [{
        id: `item-${Date.now()}`,
        type: isVideoLikely ? 'video' : 'image',
        url: raw,
        previewUrl: raw,
        hasAudio: isVideoLikely
      }],
      isMultiImage: false,
      hasVideo: isVideoLikely
    };
  }
}
