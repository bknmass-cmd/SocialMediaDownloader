import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function dynamicExtractorPlugin(): Plugin {
  return {
    name: 'dynamic-extractor-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';

        // 1. Download Proxy Handler
        if (reqUrl.startsWith('/api/download')) {
          try {
            const parsed = new URL(reqUrl, 'http://localhost:5173');
            const fileUrl = parsed.searchParams.get('url');
            const fileName = parsed.searchParams.get('name') || 'media_file';

            if (!fileUrl) {
              res.statusCode = 400;
              return res.end('Missing url');
            }

            console.log(`[API /api/download] Streaming: ${fileUrl} -> ${fileName}`);

            const fileResp = await fetch(fileUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });

            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', fileResp.headers.get('content-type') || 'application/octet-stream');
            res.setHeader('Access-Control-Allow-Origin', '*');

            if (fileResp.body) {
              // @ts-ignore
              const { Readable } = await import('node:stream');
              // @ts-ignore
              Readable.fromWeb(fileResp.body).pipe(res);
            } else {
              const buffer = Buffer.from(await fileResp.arrayBuffer());
              res.end(buffer);
            }
            return;
          } catch (err: any) {
            res.statusCode = 500;
            return res.end('Download proxy error: ' + err.message);
          }
        }

        // 2. Dynamic Media Extraction Handler
        if (reqUrl.startsWith('/api/extract')) {
          try {
            const parsedUrl = new URL(reqUrl, 'http://localhost:5173');
            const targetUrl = parsedUrl.searchParams.get('url');

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }

            console.log(`[API /api/extract] Extracting dynamic URL: ${targetUrl}`);

            // A. Multi-URL input check (separated by comma, space, or newline)
            const subUrls = targetUrl.split(/[\s,]+/).filter(u => /^https?:\/\//i.test(u));
            if (subUrls.length > 1) {
              const mediaList = subUrls.map((u, idx) => {
                const isVid = /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(u) || /video|reel|clip/i.test(u);
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
                  name: 'Multi-URL Media Set',
                  handle: `${mediaList.length} files`,
                  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
                  verified: true
                },
                caption: `Extracted ${mediaList.length} dynamic media files.`,
                timestamp: new Date().toLocaleTimeString(),
                originalUrl: targetUrl,
                isMultiImage: mediaList.filter(m => m.type === 'image').length > 1,
                hasVideo: mediaList.some(m => m.type === 'video'),
                media: mediaList
              }));
              return;
            }

            // B. Direct Video file check (.mp4, .mov, etc.)
            if (/\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(targetUrl)) {
              let domain = 'Direct Source';
              try { domain = new URL(targetUrl).hostname; } catch {}

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
                caption: `Dynamic video file: ${targetUrl}`,
                timestamp: 'Real-time Stream',
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

            // C. Direct Image file check (.jpg, .png, etc.)
            if (/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(targetUrl)) {
              let domain = 'Direct Source';
              try { domain = new URL(targetUrl).hostname; } catch {}

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
                caption: `Dynamic image file: ${targetUrl}`,
                timestamp: 'Real-time Photo',
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

            // D. Twitter / X Extraction
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
                  console.warn('[Twitter fetch error]', e.message);
                }
              }
            }

            // E. Instagram Extraction
            if (/instagram\.com|instagr\.am/i.test(targetUrl)) {
              const shortcodeMatch = targetUrl.match(/(?:p|reel|tv)\/([^/?#&]+)/i);
              const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';

              // Try public embed endpoint
              if (shortcode) {
                try {
                  const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                  });
                  const embedHtml = await embedRes.text();
                  const imgMatch = embedHtml.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i);
                  const captionMatch = embedHtml.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/i);
                  const usernameMatch = embedHtml.match(/class="UsernameText"[^>]*>([^<]+)</i);

                  if (imgMatch && imgMatch[1]) {
                    const imgUrl = imgMatch[1].replace(/&amp;/g, '&');
                    const isReel = /reel|tv/i.test(targetUrl);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({
                      id: `insta-${shortcode}`,
                      platform: 'instagram',
                      author: {
                        name: usernameMatch ? usernameMatch[1].trim() : 'Instagram User',
                        handle: usernameMatch ? usernameMatch[1].trim() : 'instagram',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
                        verified: true
                      },
                      caption: captionMatch ? captionMatch[1].replace(/<[^>]+>/g, '').trim() : `Instagram ${isReel ? 'Reel' : 'Post'}`,
                      timestamp: 'Live Post',
                      originalUrl: targetUrl,
                      isMultiImage: false,
                      hasVideo: isReel,
                      media: [{
                        id: `insta-media-${shortcode}`,
                        type: isReel ? 'video' : 'image',
                        url: imgUrl,
                        previewUrl: imgUrl,
                        hasAudio: isReel
                      }]
                    }));
                    return;
                  }
                } catch (e: any) {
                  console.warn('[Insta embed error]', e.message);
                }
              }
            }

            // F. OpenGraph Web Crawling Fallback
            try {
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
            } catch (crawlErr) {
              console.warn('[Crawl error]', crawlErr);
            }

            // G. Universal Dynamic Media Object Fallback
            const isVid = /video|reel|clip|watch|tv/i.test(targetUrl);
            let domainName = 'social';
            try { domainName = new URL(targetUrl).hostname.replace('www.', ''); } catch {}

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              id: `dyn-${Date.now()}`,
              platform: /instagram/i.test(targetUrl) ? 'instagram' : /twitter|x\.com/i.test(targetUrl) ? 'twitter' : /threads/i.test(targetUrl) ? 'threads' : 'generic',
              author: {
                name: `@${domainName}`,
                handle: domainName,
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                verified: true
              },
              caption: `Dynamic media from: ${targetUrl}`,
              timestamp: new Date().toLocaleTimeString(),
              originalUrl: targetUrl,
              isMultiImage: false,
              hasVideo: isVid,
              media: [{
                id: `dyn-media-1`,
                type: isVid ? 'video' : 'image',
                url: targetUrl,
                previewUrl: targetUrl,
                hasAudio: true
              }]
            }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Server extraction error' }));
            return;
          }
        }

        next();
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
