import json
from pathlib import Path
from typing import Any

from app.api.schemas import KeyboardProfilesPayload

CONFIG_PATH = Path(__file__).resolve().parent / "keyboard_profiles.json"


def load_keyboard_profiles(default_payload: KeyboardProfilesPayload) -> KeyboardProfilesPayload:
    if not CONFIG_PATH.exists():
        save_keyboard_profiles(default_payload)
        return default_payload

    try:
        content = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        return KeyboardProfilesPayload.model_validate(content)
    except (json.JSONDecodeError, ValueError):
        save_keyboard_profiles(default_payload)
        return default_payload


def save_keyboard_profiles(payload: KeyboardProfilesPayload) -> None:
    CONFIG_PATH.write_text(
        json.dumps(payload.model_dump(), indent=2),
        encoding="utf-8",
    )


def to_payload(data: dict[str, Any]) -> KeyboardProfilesPayload:
    return KeyboardProfilesPayload.model_validate(data)
