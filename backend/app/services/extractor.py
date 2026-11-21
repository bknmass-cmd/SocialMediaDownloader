import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import re
import uuid
import tempfile
import subprocess
from typing import Dict, Any, List, Optional
import yt_dlp
import httpx

try:
    from app.models.schemas import ExtractResponse, MediaItemSchema
except ImportError:
    from backend.app.models.schemas import ExtractResponse, MediaItemSchema

def get_ffmpeg_path() -> Optional[str]:
    """Finds ffmpeg path from environment, PATH, or imageio_ffmpeg."""
    try:
        import imageio_ffmpeg
        path = imageio_ffmpeg.get_ffmpeg_exe()
        if path and os.path.exists(path):
            return path
    except Exception:
        pass

    import shutil
    return shutil.which("ffmpeg")

def detect_platform(url: str) -> str:
    url_lower = url.lower()
    if "instagram.com" in url_lower or "instagr.am" in url_lower:
        return "instagram"
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "youtube"
    if "threads.net" in url_lower:
        return "threads"
    if "twitter.com" in url_lower or "x.com" in url_lower or "t.co" in url_lower:
        return "twitter"
    return "generic"

def is_video_metadata(entry: Dict[str, Any]) -> bool:
    """Accurately checks whether an entry/info dict represents a video or a photo."""
    vcodec = entry.get("vcodec")
    if vcodec and vcodec != "none":
        return True
    ext = (entry.get("ext") or "").lower()
    if ext in ["mp4", "webm", "mkv", "mov", "m4v"]:
        return True
    formats = entry.get("formats") or []
    for f in formats:
        if f.get("vcodec") and f.get("vcodec") != "none":
            return True
        f_ext = (f.get("ext") or "").lower()
        if f_ext in ["mp4", "webm", "mkv", "mov"]:
            return True
    return False

class MediaExtractor:
    @staticmethod
    def extract_info(url: str) -> ExtractResponse:
        platform = detect_platform(url)
        ffmpeg_exe = get_ffmpeg_path()

        ydl_opts: Dict[str, Any] = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'noplaylist': False,
            'ignore_no_formats_error': True,  # Critical for Instagram carousels and images
            'extract_flat': False,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }
        if ffmpeg_exe:
            ydl_opts['ffmpeg_location'] = os.path.dirname(ffmpeg_exe)

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    raise ValueError("yt-dlp returned no metadata")
                return MediaExtractor._parse_ydl_info(info, platform, url)
        except Exception as e:
            # Fallback to direct HTTP OpenGraph / metadata scraping
            return MediaExtractor._fallback_extract(url, platform)

    @staticmethod
    def _parse_ydl_info(info: Dict[str, Any], platform: str, original_url: str) -> ExtractResponse:
        title = info.get("title") or info.get("description") or f"{platform.capitalize()} Media"
        if len(title) > 120:
            title = title[:117] + "..."

        items: List[MediaItemSchema] = []

        # 1. Multi-item Carousel / Playlist entries
        if "entries" in info and info["entries"]:
            entries = [e for e in info["entries"] if e]
            for idx, entry in enumerate(entries):
                is_vid = is_video_metadata(entry)
                
                # Retrieve best media and thumbnail URL
                media_url = entry.get("url")
                if not media_url:
                    formats = entry.get("formats") or []
                    video_formats = [f for f in formats if f.get("vcodec") not in (None, "none") or (f.get("ext") or "").lower() in ["mp4", "webm", "mov"]]
                    if video_formats:
                        media_url = video_formats[-1].get("url")
                    elif formats:
                        media_url = formats[-1].get("url")

                thumb = entry.get("thumbnail") or ""
                if not media_url and thumb:
                    media_url = thumb
                if not thumb and media_url:
                    thumb = media_url

                # If still empty, check entry formats for thumbnails
                if not thumb and entry.get("thumbnails"):
                    thumb = entry["thumbnails"][-1].get("url", "")
                    if not media_url:
                        media_url = thumb

                items.append(MediaItemSchema(
                    id=str(entry.get("id") or f"item-{idx + 1}"),
                    type="video" if is_vid else "image",
                    thumbnail_url=thumb,
                    media_url=media_url or thumb,
                    duration=entry.get("duration")
                ))

            media_type = "carousel" if len(items) > 1 else ("video" if items and items[0].type == "video" else "single_image")
            return ExtractResponse(
                platform=platform if platform in ["instagram", "youtube", "threads", "twitter"] else "generic",
                media_type=media_type,
                title=title,
                items=items
            )

        # 2. Single item (Single video or Single photo)
        is_vid = is_video_metadata(info)

        media_url = info.get("url")
        if not media_url:
            formats = info.get("formats") or []
            video_formats = [f for f in formats if f.get("vcodec") not in (None, "none") or (f.get("ext") or "").lower() in ["mp4", "webm", "mov"]]
            if video_formats:
                media_url = video_formats[-1].get("url")
            elif formats:
                media_url = formats[-1].get("url")

        thumb = info.get("thumbnail") or ""
        if not thumb and info.get("thumbnails"):
            thumb = info["thumbnails"][-1].get("url", "")

        if not media_url and thumb:
            media_url = thumb
        if not thumb and media_url:
            thumb = media_url

        items.append(MediaItemSchema(
            id=str(info.get("id") or uuid.uuid4().hex[:8]),
            type="video" if is_vid else "image",
            thumbnail_url=thumb,
            media_url=media_url or thumb,
            duration=info.get("duration")
        ))

        return ExtractResponse(
            platform=platform if platform in ["instagram", "youtube", "threads", "twitter"] else "generic",
            media_type="video" if is_vid else "single_image",
            title=title,
            items=items
        )

    @staticmethod
    def _fallback_extract(url: str, platform: str) -> ExtractResponse:
        """Resilient fallback that checks direct files, OpenGraph tags, or JSON-LD."""
        clean_url = url.strip()

        # Check for multiple space or comma-separated URLs
        sub_urls = [u for u in re.split(r'[\s,]+', clean_url) if u.startswith("http")]
        if len(sub_urls) > 1:
            items = []
            for i, u in enumerate(sub_urls):
                u_is_vid = bool(re.search(r'\.(mp4|webm|mov|mkv)(\?.*)?$', u, re.I))
                items.append(MediaItemSchema(
                    id=f"batch-{i + 1}",
                    type="video" if u_is_vid else "image",
                    thumbnail_url=u,
                    media_url=u,
                    duration=None
                ))
            return ExtractResponse(
                platform="generic",
                media_type="carousel",
                title=f"{len(items)} Items Selection",
                items=items
            )

        # Attempt OpenGraph scraping with httpx
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            }
            with httpx.Client(timeout=10.0, follow_redirects=True, headers=headers) as client:
                resp = client.get(clean_url)
                if resp.status_code == 200:
                    html = resp.text
                    og_videos = re.findall(r'<meta\s+(?:property|name)=["\']og:video(?::secure_url)?["\']\s+content=["\']([^"\']+)["\']', html, re.I)
                    og_images = re.findall(r'<meta\s+(?:property|name)=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html, re.I)

                    if og_videos:
                        vid_url = og_videos[0].replace("&amp;", "&")
                        thumb = og_images[0].replace("&amp;", "&") if og_images else ""
                        return ExtractResponse(
                            platform=platform if platform in ["instagram", "youtube", "threads", "twitter"] else "generic",
                            media_type="video",
                            title=f"{platform.capitalize()} Video",
                            items=[MediaItemSchema(
                                id=uuid.uuid4().hex[:8],
                                type="video",
                                thumbnail_url=thumb,
                                media_url=vid_url,
                                duration=None
                            )]
                        )
                    elif og_images:
                        clean_imgs = list(dict.fromkeys([img.replace("&amp;", "&") for img in og_images]))
                        items = [
                            MediaItemSchema(
                                id=f"img-{i + 1}",
                                type="image",
                                thumbnail_url=img,
                                media_url=img,
                                duration=None
                            ) for i, img in enumerate(clean_imgs)
                        ]
                        return ExtractResponse(
                            platform=platform if platform in ["instagram", "youtube", "threads", "twitter"] else "generic",
                            media_type="carousel" if len(items) > 1 else "single_image",
                            title=f"{platform.capitalize()} Media",
                            items=items
                        )
        except Exception:
            pass

        # Final basic fallback
        is_vid = bool(re.search(r'\.(mp4|webm|mov|mkv)(\?.*)?$', clean_url, re.I)) or ("reel" in clean_url or "video" in clean_url or "shorts" in clean_url)
        is_img = bool(re.search(r'\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$', clean_url, re.I))

        item = MediaItemSchema(
            id=uuid.uuid4().hex[:8],
            type="video" if is_vid else "image",
            thumbnail_url=clean_url if is_img else "",
            media_url=clean_url,
            duration=None
        )
        return ExtractResponse(
            platform=platform if platform in ["instagram", "youtube", "threads", "twitter"] else "generic",
            media_type="video" if is_vid else "single_image",
            title=f"{platform.capitalize()} Media",
            items=[item]
        )
