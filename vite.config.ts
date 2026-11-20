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
            const fileName = parsed.searchParams.get('name') || 'download_media';

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

            console.log(`[API /api/extract] Extracting: ${targetUrl}`);

            // Multi-URL check
            const subUrls = targetUrl.split(/[\s,]+/).filter(u => /^https?:\/\//i.test(u));
            if (subUrls.length > 1) {
              const items = subUrls.map((u, idx) => {
                const isVid = /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(u) || /video|reel|clip/i.test(u);
                return {
                  id: `item-${idx}-${Date.now()}`,
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
                id: `batch-${Date.now()}`,
                platform: 'direct',
                title: `${items.length} Files`,
                author: {
                  name: 'Multi-URL Selection',
                  handle: `${items.length} items`,
                  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
                  verified: true
                },
                caption: `Extracted ${items.length} dynamic media files.`,
                originalUrl: targetUrl,
                isMultiImage: items.filter(it => it.type === 'image').length > 1,
                hasVideo: items.some(it => it.type === 'video'),
                items
              }));
              return;
            }

            // Direct Video check
            if (/\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(targetUrl)) {
              let domain = 'Direct Source';
              try { domain = new URL(targetUrl).hostname; } catch {}

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({
                id: `vid-${Date.now()}`,
                platform: 'direct',
                title: `${domain} Video`,
                author: {
                  name: domain,
                  handle: domain,
                  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
                  verified: true
                },
                caption: `Dynamic video file: ${targetUrl}`,
                originalUrl: targetUrl,
                isMultiImage: false,
                hasVideo: true,
                items: [{
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

            // Direct Image check
            if (/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(targetUrl)) {
              let domain = 'Direct Source';
              try { domain = new URL(targetUrl).hostname; } catch {}

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({
                id: `img-${Date.now()}`,
                platform: 'direct',
                title: `${domain} Image`,
                author: {
                  name: domain,
                  handle: domain,
                  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
                  verified: true
                },
                caption: `Dynamic image file: ${targetUrl}`,
                originalUrl: targetUrl,
                isMultiImage: false,
                hasVideo: false,
                items: [{
                  id: `img-${Date.now()}`,
                  type: 'image',
                  url: targetUrl,
                  previewUrl: targetUrl
                }]
              }));
              return;
            }

            // Twitter / X extraction via fxtwitter
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
                      const items: any[] = [];

                      if (tweet.media?.photos) {
                        tweet.media.photos.forEach((p: any, idx: number) => {
                          items.push({
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
                          items.push({
                            id: `tw-vid-${idx}-${Date.now()}`,
                            type: 'video',
                            url: v.url,
                            previewUrl: v.thumbnail_url || '',
                            hasAudio: true,
                            duration: v.duration
                          });
                        });
                      }

                      if (items.length > 0) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.end(JSON.stringify({
                          id: `tw-${statusId}`,
                          platform: 'twitter',
                          title: `${tweet.author?.name || user}'s Tweet`,
                          author: {
                            name: tweet.author?.name || user,
                            handle: tweet.author?.screen_name || user,
                            avatar: tweet.author?.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
                            verified: !!tweet.author?.is_blue_verified
                          },
                          caption: tweet.text || '',
                          originalUrl: targetUrl,
                          isMultiImage: items.filter(it => it.type === 'image').length > 1,
                          hasVideo: items.some(it => it.type === 'video'),
                          items
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

            // OpenGraph Web Crawling Fallback (Instagram, Threads, etc.)
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

              const items: any[] = [];

              ogVideos.forEach((vUrl, idx) => {
                if (!items.some(m => m.url === vUrl)) {
                  items.push({
                    id: `og-vid-${idx}-${Date.now()}`,
                    type: 'video',
                    url: vUrl,
                    previewUrl: ogImages[0] || '',
                    hasAudio: true
                  });
                }
              });

              ogImages.forEach((imgUrl, idx) => {
                if (!imgUrl.includes('default-og') && !imgUrl.includes('favicon') && !items.some(m => m.url === imgUrl)) {
                  items.push({
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
                : 'direct';

              if (items.length > 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({
                  id: `extracted-${Date.now()}`,
                  platform: cleanPlatform,
                  title: titleMatch ? titleMatch[1].split('•')[0].trim() : `${cleanPlatform.toUpperCase()} Media`,
                  author: {
                    name: titleMatch ? titleMatch[1].split('•')[0].trim() : `${cleanPlatform.toUpperCase()} User`,
                    handle: new URL(targetUrl).pathname.split('/')[1] || cleanPlatform,
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                    verified: false
                  },
                  caption: descMatch ? descMatch[1] : (titleMatch ? titleMatch[1] : `Media from ${targetUrl}`),
                  originalUrl: targetUrl,
                  isMultiImage: items.filter(it => it.type === 'image').length > 1,
                  hasVideo: items.some(it => it.type === 'video'),
                  items
                }));
                return;
              }
            } catch (crawlErr) {
              console.warn('[Crawl error]', crawlErr);
            }

            // Universal Dynamic fallback
            const isVid = /video|reel|clip|watch|tv/i.test(targetUrl);
            let domainName = 'social';
            try { domainName = new URL(targetUrl).hostname.replace('www.', ''); } catch {}

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              id: `dyn-${Date.now()}`,
              platform: /instagram/i.test(targetUrl) ? 'instagram' : /twitter|x\.com/i.test(targetUrl) ? 'twitter' : /threads/i.test(targetUrl) ? 'threads' : 'direct',
              title: `@${domainName}`,
              author: {
                name: `@${domainName}`,
                handle: domainName,
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                verified: false
              },
              caption: `Media link: ${targetUrl}`,
              originalUrl: targetUrl,
              isMultiImage: false,
              hasVideo: isVid,
              items: [{
                id: `dyn-item-1`,
                type: isVid ? 'video' : 'image',
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
          return;
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
