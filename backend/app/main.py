import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import time
import uuid
import tempfile
import subprocess
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import httpx
import yt_dlp

try:
    from app.models.schemas import ExtractRequest, ExtractResponse
    from app.services.extractor import MediaExtractor, get_ffmpeg_path
except ImportError:
    from backend.app.models.schemas import ExtractRequest, ExtractResponse
    from backend.app.services.extractor import MediaExtractor, get_ffmpeg_path

app = FastAPI(
    title="SocialSaver API",
    description="Production-ready FastAPI backend for extracting and downloading social media videos and images.",
    version="1.0.0"
)

# Enable CORS for Capacitor, Angular, and mobile web clients
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(http://|https://|capacitor://|ionic://).*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def remove_temp_file(path: str):
    """Cleanup function executed after FileResponse completes."""
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"Error removing temp file {path}: {e}")

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "SocialSaver", "ffmpeg": bool(get_ffmpeg_path())}

@app.post("/api/extract", response_model=ExtractResponse)
def extract_media(payload: ExtractRequest):
    """
    Extracts media metadata, titles, and item lists from Instagram,
    YouTube (Videos & Shorts), Threads, and X (Twitter).
    """
    if not payload.url or not payload.url.strip():
        raise HTTPException(status_code=400, detail="URL must not be empty.")
    try:
        return MediaExtractor.extract_info(payload.url.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract media: {str(e)}")

@app.get("/api/download")
async def download_media(
    url: str = Query(..., description="Target media or post URL"),
    mode: str = Query("video_with_audio", pattern="^(image|video_with_audio|video_mute)$"),
    item_index: Optional[int] = Query(None, description="Index for carousel item"),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Streams media directly to the client:
    - mode == 'image': Proxies high-res image to avoid mobile CORS issues.
    - mode == 'video_with_audio': Merges best video + audio into MP4 and streams.
    - mode == 'video_mute': Downloads/strips audio via ffmpeg and streams muted MP4.
    """
    timestamp = int(time.time())
    ffmpeg_exe = get_ffmpeg_path()
    ffmpeg_dir = os.path.dirname(ffmpeg_exe) if ffmpeg_exe else None

    # 1. Image Mode: Proxy stream directly
    if mode == "image":
        try:
            client = httpx.AsyncClient(follow_redirects=True, timeout=30.0)
            req = client.build_request("GET", url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Referer": ""
            })
            resp = await client.send(req, stream=True)

            async def stream_generator():
                try:
                    async for chunk in resp.aiter_bytes():
                        yield chunk
                finally:
                    await resp.aclose()
                    await client.aclose()

            content_type = resp.headers.get("content-type", "image/jpeg")
            ext = "png" if "png" in content_type else "webp" if "webp" in content_type else "jpg"
            filename = f"socialsaver_{timestamp}.{ext}"

            return StreamingResponse(
                stream_generator(),
                media_type=content_type,
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=86400"
                }
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to proxy image: {str(e)}")

    # 2. Video with Audio
    temp_dir = tempfile.gettempdir()
    unique_id = uuid.uuid4().hex[:8]

    if mode == "video_with_audio":
        output_template = os.path.join(temp_dir, f"socialsaver_aud_{unique_id}_{timestamp}.%(ext)s")
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': output_template,
            'merge_output_format': 'mp4',
        }
        if ffmpeg_dir:
            ydl_opts['ffmpeg_location'] = ffmpeg_dir

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                final_file = ydl.prepare_filename(info)
                # Ensure .mp4 extension
                if not os.path.exists(final_file):
                    base, _ = os.path.splitext(final_file)
                    final_file = f"{base}.mp4"

            if not os.path.exists(final_file):
                raise FileNotFoundError("Merged video file could not be generated.")

            background_tasks.add_task(remove_temp_file, final_file)
            return FileResponse(
                path=final_file,
                media_type="video/mp4",
                filename=f"socialsaver_video_{timestamp}.mp4"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to download video with audio: {str(e)}")

    # 3. Video Muted (Strip audio)
    if mode == "video_mute":
        raw_output_template = os.path.join(temp_dir, f"socialsaver_raw_{unique_id}_{timestamp}.%(ext)s")
        muted_output = os.path.join(temp_dir, f"socialsaver_muted_{unique_id}_{timestamp}.mp4")

        # First download best video
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'bestvideo[ext=mp4]/best[ext=mp4]/best',
            'outtmpl': raw_output_template,
        }
        if ffmpeg_dir:
            ydl_opts['ffmpeg_location'] = ffmpeg_dir

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                raw_file = ydl.prepare_filename(info)
                if not os.path.exists(raw_file):
                    base, _ = os.path.splitext(raw_file)
                    raw_file = f"{base}.mp4"

            if not os.path.exists(raw_file):
                raise FileNotFoundError("Raw video download failed.")

            # Run ffmpeg to strip audio cleanly (-c copy -an)
            if ffmpeg_exe:
                cmd = [
                    ffmpeg_exe, "-y", "-i", raw_file,
                    "-c", "copy", "-an", muted_output
                ]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                # Cleanup raw
                remove_temp_file(raw_file)
                final_file = muted_output
            else:
                # If no ffmpeg binary, return the raw file directly
                final_file = raw_file

            background_tasks.add_task(remove_temp_file, final_file)
            return FileResponse(
                path=final_file,
                media_type="video/mp4",
                filename=f"socialsaver_muted_{timestamp}.mp4"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate mute video: {str(e)}")

# Serve Angular frontend SPA static assets if built/present
static_dirs = [
    Path(__file__).resolve().parent.parent / "static",
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist" / "frontend" / "browser"
]

for s_dir in static_dirs:
    if s_dir.exists() and (s_dir / "index.html").exists():
        @app.get("/{full_path:path}")
        def serve_frontend_spa(full_path: str):
            if full_path.startswith("api/") or full_path in ("health", "docs", "openapi.json"):
                raise HTTPException(status_code=404, detail="Not Found")
            file_candidate = s_dir / full_path
            if file_candidate.is_file():
                return FileResponse(str(file_candidate))
            return FileResponse(str(s_dir / "index.html"))
        break
