"""Shared pytest fixtures for the FlowDJ backend.

Each test runs against an isolated temp data directory (via the
``FLOWDJ_DATA_DIR`` override that ``app.storage.json_store`` reads) seeded with
the read-only fixtures the app expects. Writable stores (sessions, keyboard
profiles) start empty so every test is independent, and the committed JSON seed
files under ``app/storage`` are never touched. Uploaded media goes to its own
temp dir.
"""

from __future__ import annotations

import shutil
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def data_dir(tmp_path, monkeypatch) -> Path:
    from app.storage import json_store

    seed_dir = json_store.DEFAULT_DATA_DIR
    target = tmp_path / "data"
    target.mkdir()
    # Seed the read-only fixtures the recommendations endpoint relies on.
    shutil.copy(
        seed_dir / "recommendation_fixtures.json",
        target / "recommendation_fixtures.json",
    )
    monkeypatch.setenv(json_store.DATA_DIR_ENV, str(target))
    return target


@pytest.fixture
def client(data_dir, tmp_path, monkeypatch) -> Iterator[TestClient]:
    # Import the app first so the full package graph loads cleanly. Importing a
    # service module before ``app.main`` triggers a circular import via
    # ``app/api/__init__.py`` (which eagerly re-exports the routers); that shim
    # is slated for removal in the structure cleanup, after which this ordering
    # no longer matters.
    from app.main import app
    from app.services import track_source

    # Uploaded-track storage is separate from the JSON data dir.
    media_root = tmp_path / "media"
    monkeypatch.setattr(track_source, "MEDIA_ROOT", media_root)
    monkeypatch.setattr(track_source, "TRACKS_ROOT", media_root / "tracks")

    with TestClient(app) as test_client:
        yield test_client
