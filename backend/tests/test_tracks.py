"""Track source endpoints: listing and local MP3 upload.

The yt-dlp YouTube import path is intentionally not exercised here (it needs
network access + ffmpeg); it is covered only at the unit level / manually.
"""

from __future__ import annotations

import io


def test_list_tracks_empty(client) -> None:
    response = client.get("/tracks")
    assert response.status_code == 200
    assert response.json() == []


def test_upload_rejects_non_mp3(client) -> None:
    files = {"file": ("beat.wav", io.BytesIO(b"not an mp3"), "audio/wav")}
    response = client.post("/tracks/upload", files=files)
    assert response.status_code == 400
    assert "mp3" in response.json()["detail"].lower()


def test_upload_accepts_mp3_and_lists_it(client) -> None:
    files = {"file": ("My Track.mp3", io.BytesIO(b"fake-mp3-bytes"), "audio/mpeg")}
    upload = client.post("/tracks/upload", files=files)
    assert upload.status_code == 200

    body = upload.json()
    assert body["source"] == "local"
    assert body["title"] == "My Track"
    assert body["filename"].endswith(".mp3")
    assert body["url"] == f"/media/tracks/{body['filename']}"

    listing = client.get("/tracks").json()
    assert any(item["filename"] == body["filename"] for item in listing)
