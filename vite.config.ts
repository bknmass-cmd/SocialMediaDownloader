import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Custom Vite plugin to handle dynamic media extraction on the local server
function dynamicExtractorPlugin(): Plugin {
  return {
    name: 'dynamic-extractor-plugin',
    configureServer(server) {
      server.middlewares.use('/api/extract', async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          return next();
        }

        try {
          const parsedUrl = new URL(req.url || '', 'http://localhost:5173');
          const targetUrl = parsedUrl.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }

          console.log(`[API /api/extract] Processing dynamic URL: ${targetUrl}`);

          // 1. Check for multiple URLs separated by comma or whitespace
          const subUrls = targetUrl.split(/[\s,]+/).filter(u => u.startsWith('http'));
          if (subUrls.length > 1) {
            const mediaList = subUrls.map((u, idx) => {
              const isVid = /\.(mp4|webm|mov)(\?.*)?$/i.test(u);
              return {
                id: `dynamic-item-${idx}-${Date.now()}`,
                type: isVid ? 'video' : 'image',
                url: u,
                previewUrl: u,
                hasAudio: isVid
              };
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              id: `multi-dynamic-${Date.now()}`,
              platform: 'generic',
              author: {
                name: 'Multiple Dynamic Media',
                handle: `${mediaList.length} items loaded`,
                avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
                verified: true
              },
              caption: `Successfully extracted ${mediaList.length} dynamic media files.`,
              timestamp: new Date().toLocaleTimeString(),
              originalUrl: targetUrl,
              isMultiImage: mediaList.filter(m => m.type === 'image').length > 1,
              hasVideo: mediaList.some(m => m.type === 'video'),
              media: mediaList
            }));
            return;
          }

          // 2. Direct Video check (.mp4, .mov, etc.)
          if (/\.(mp4|webm|mov)(\?.*)?$/i.test(targetUrl)) {
            const domain = new URL(targetUrl).hostname;
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              id: `direct-vid-${Date.now()}`,
              platform: 'generic',
              author: {
                name: `${domain} Stream`,
                handle: domain,
                avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
                verified: true
              },
              caption: `Dynamic video extracted from ${targetUrl}`,
              timestamp: 'Dynamic Stream',
              originalUrl: targetUrl,
              isMultiImage: false,
              hasVideo: true,
              media: [{
                id: `vid-${Date.now()}`,
                type: 'video',
                url: targetUrl,
                previewUrl: '',
                hasAudio: true,
                duration: 30
              }]
            }));
            return;
          }

          // 3. Direct Image check (.jpg, .png, etc.)
          if (/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(targetUrl)) {
            const domain = new URL(targetUrl).hostname;
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              id: `direct-img-${Date.now()}`,
              platform: 'generic',
              author: {
                name: `${domain} Photo`,
                handle: domain,
                avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
                verified: true
              },
              caption: `Dynamic image extracted from ${targetUrl}`,
              timestamp: 'Dynamic Photo',
              originalUrl: targetUrl,
              isMultiImage: false,
              hasVideo: false,
              media: [{
                id: `img-${Date.now()}`,
                type: 'image',
                url: targetUrl,
                previewUrl: targetUrl
              }]
            }));
            return;
          }

          // 4. Twitter / X Extraction
          if (/twitter\.com|x\.com/i.test(targetUrl)) {
            const match = targetUrl.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/i);
            if (match) {
              const user = match[1];
              const statusId = match[2];
              try {
                const fxRes = await fetch(`https://api.fxtwitter.com/${user}/status/${statusId}`, {
                  headers: { 'User-Agent': 'TelegramBot (like TwitterBot)' }
                });
                if (fxRes.ok) {
                  const data = await fxRes.json();
                  if (data.tweet) {
                    const tweet = data.tweet;
                    const mediaList: any[] = [];

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
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.setHeader('Access-Control-Allow-Origin', '*');
                      res.end(JSON.stringify({
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
                        originalUrl: targetUrl,
                        isMultiImage: mediaList.filter(m => m.type === 'image').length > 1,
                        hasVideo: mediaList.some(m => m.type === 'video'),
                        media: mediaList
                      }));
                      return;
                    }
                  }
                }
              } catch (e: any) {
                console.warn('[Twitter fetch fallback]', e.message);
              }
            }
          }

          // 5. OpenGraph HTML Crawling for Instagram, Threads, and Web links
          const pageRes = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });
          const html = await pageRes.text();

          const ogImages = [...html.matchAll(/<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["']\s+content=["']([^"']+)["']/gi)].map(m => m[1]);
          const ogVideos = [...html.matchAll(/<meta\s+(?:property|name)=["'](?:og:video|og:video:secure_url|twitter:player:stream)["']\s+content=["']([^"']+)["']/gi)].map(m => m[1]);
          const titleMatch = html.match(/<meta\s+(?:property|name)=["'](?:og:title|twitter:title)["']\s+content=["']([^"']+)["']/i);
          const descMatch = html.match(/<meta\s+(?:property|name)=["'](?:og:description|twitter:description)["']\s+content=["']([^"']+)["']/i);

          const mediaList: any[] = [];

          // Add extracted videos
          ogVideos.forEach((vUrl, idx) => {
            if (!mediaList.some(m => m.url === vUrl)) {
              mediaList.push({
                id: `og-vid-${idx}-${Date.now()}`,
                type: 'video',
                url: vUrl,
                previewUrl: ogImages[0] || '',
                hasAudio: true
              });
            }
          });

          // Add extracted images (filter default platform icons)
          ogImages.forEach((imgUrl, idx) => {
            if (!imgUrl.includes('default-og') && !imgUrl.includes('favicon') && !mediaList.some(m => m.url === imgUrl)) {
              mediaList.push({
                id: `og-img-${idx}-${Date.now()}`,
                type: 'image',
                url: imgUrl,
                previewUrl: imgUrl
              });
            }
          });

          const cleanPlatform = /instagram\.com|instagr\.am/i.test(targetUrl) ? 'instagram'
            : /twitter\.com|x\.com/i.test(targetUrl) ? 'twitter'
            : /threads\.net/i.test(targetUrl) ? 'threads'
            : 'generic';

          if (mediaList.length > 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              id: `extracted-${Date.now()}`,
              platform: cleanPlatform,
              author: {
                name: titleMatch ? titleMatch[1].split('•')[0].trim() : `${cleanPlatform.toUpperCase()} User`,
                handle: new URL(targetUrl).pathname.split('/')[1] || cleanPlatform,
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                verified: false
              },
              caption: descMatch ? descMatch[1] : (titleMatch ? titleMatch[1] : `Extracted media from ${targetUrl}`),
              timestamp: 'Live Post',
              originalUrl: targetUrl,
              isMultiImage: mediaList.filter(m => m.type === 'image').length > 1,
              hasVideo: mediaList.some(m => m.type === 'video'),
              media: mediaList
            }));
            return;
          }

          // If no media tags found directly, return dynamic fallback constructed from the user's URL
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            id: `dyn-${Date.now()}`,
            platform: cleanPlatform,
            author: {
              name: `${cleanPlatform.toUpperCase()} Dynamic Link`,
              handle: new URL(targetUrl).hostname,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
              verified: false
            },
            caption: `Dynamic content extracted for: ${targetUrl}`,
            timestamp: new Date().toLocaleTimeString(),
            originalUrl: targetUrl,
            isMultiImage: false,
            hasVideo: /video|reel|clip|watch|tv/i.test(targetUrl),
            media: [{
              id: `dyn-media-1`,
              type: /video|reel|clip|watch|tv/i.test(targetUrl) ? 'video' : 'image',
              url: targetUrl,
              previewUrl: targetUrl,
              hasAudio: true
            }]
          }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Server extraction error' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), dynamicExtractorPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
