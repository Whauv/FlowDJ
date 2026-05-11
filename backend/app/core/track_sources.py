from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

try:
    from yt_dlp import YoutubeDL
except Exception:  # pragma: no cover
    YoutubeDL = None


MEDIA_ROOT = Path(__file__).resolve().parent.parent / "media"
TRACKS_ROOT = MEDIA_ROOT / "tracks"


def ensure_track_dirs() -> None:
    TRACKS_ROOT.mkdir(parents=True, exist_ok=True)


def track_url(file_name: str) -> str:
    return f"/media/tracks/{file_name}"


def _safe_stem(name: str) -> str:
    return "".join(ch for ch in name if ch.isalnum() or ch in ("-", "_", " ")).strip().replace(" ", "_") or "track"


def list_tracks() -> list[dict[str, str]]:
    ensure_track_dirs()
    tracks: list[dict[str, str]] = []
    for file_path in sorted(TRACKS_ROOT.glob("*.mp3"), key=lambda p: p.stat().st_mtime, reverse=True):
        tracks.append(
            {
                "id": file_path.stem,
                "title": file_path.stem,
                "source": "local",
                "filename": file_path.name,
                "url": track_url(file_path.name),
            }
        )
    return tracks


async def save_uploaded_mp3(file: UploadFile) -> dict[str, str]:
    ensure_track_dirs()
    name = file.filename or "upload.mp3"
    if not name.lower().endswith(".mp3"):
        raise HTTPException(status_code=400, detail="Only .mp3 files are supported for local uploads.")

    safe_name = f"{_safe_stem(Path(name).stem)}-{uuid.uuid4().hex[:8]}.mp3"
    target = TRACKS_ROOT / safe_name
    with target.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    return {
        "id": target.stem,
        "title": Path(name).stem,
        "source": "local",
        "filename": target.name,
        "url": track_url(target.name),
    }


def import_youtube_as_mp3(youtube_url: str) -> dict[str, str]:
    ensure_track_dirs()
    if YoutubeDL is None:
        raise HTTPException(status_code=500, detail="yt-dlp is not installed on the backend.")

    output_template = str(TRACKS_ROOT / f"yt-{uuid.uuid4().hex[:10]}.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "noplaylist": True,
        "quiet": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
    }
    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            downloaded = Path(ydl.prepare_filename(info))
            mp3_path = downloaded.with_suffix(".mp3")
            if not mp3_path.exists():
                raise HTTPException(status_code=500, detail="Failed to generate mp3 from the YouTube source.")
            return {
                "id": mp3_path.stem,
                "title": str(info.get("title") or mp3_path.stem),
                "source": "youtube",
                "filename": mp3_path.name,
                "url": track_url(mp3_path.name),
            }
    except HTTPException:
        raise
    except Exception as exc:
        message = str(exc)
        if "ffmpeg" in message.lower():
            raise HTTPException(status_code=500, detail="FFmpeg is required for YouTube-to-mp3 import.") from exc
        raise HTTPException(status_code=400, detail=f"YouTube import failed: {message}") from exc
