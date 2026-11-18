"""JSON-backed storage helpers for MVP persistence.

This module is the single place that decides *where* persisted JSON lives and
owns the low-level read/write mechanics (encoding, indentation, parent-dir
creation). Services build their file paths via :func:`data_path` so the whole
app can be relocated by setting the ``FLOWDJ_DATA_DIR`` environment variable
(used by tests to isolate each run, and by deployments to point at a writable
volume).
"""

from __future__ import annotations

import json
import os
from pathlib import Path

# Default: this package's own folder (``app/storage``), which holds the seeded
# JSON files that ship with the repo.
DEFAULT_DATA_DIR = Path(__file__).resolve().parent

# Environment variable that overrides the data directory at runtime.
DATA_DIR_ENV = "FLOWDJ_DATA_DIR"


def get_data_dir() -> Path:
    """Return the active data directory, honoring the env override per call."""
    override = os.environ.get(DATA_DIR_ENV)
    return Path(override) if override else DEFAULT_DATA_DIR


def data_path(name: str) -> Path:
    """Resolve ``name`` inside the active data directory."""
    return get_data_dir() / name


def read_json(path: Path, default: object) -> object:
    """Return parsed JSON from ``path``, or ``default`` when it does not exist.

    A malformed file raises ``json.JSONDecodeError`` so callers can decide how to
    recover (e.g. fall back to defaults and rewrite).
    """
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: object) -> None:
    """Write ``payload`` as indented JSON, creating parent dirs as needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
