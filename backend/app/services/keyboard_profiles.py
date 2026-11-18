import json
from pathlib import Path
from typing import Any

from app.api.schemas import KeyboardProfilesPayload
from app.storage import json_store


def _config_path() -> Path:
    return json_store.data_path("keyboard_profiles.json")


def load_keyboard_profiles(default_payload: KeyboardProfilesPayload) -> KeyboardProfilesPayload:
    path = _config_path()
    if not path.exists():
        save_keyboard_profiles(default_payload)
        return default_payload

    try:
        content = json_store.read_json(path, None)
        return KeyboardProfilesPayload.model_validate(content)
    except (json.JSONDecodeError, ValueError):
        save_keyboard_profiles(default_payload)
        return default_payload


def save_keyboard_profiles(payload: KeyboardProfilesPayload) -> None:
    json_store.write_json(_config_path(), payload.model_dump())


def to_payload(data: dict[str, Any]) -> KeyboardProfilesPayload:
    return KeyboardProfilesPayload.model_validate(data)
