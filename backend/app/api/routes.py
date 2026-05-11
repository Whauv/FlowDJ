from fastapi import APIRouter

from app.api.schemas import KeyboardProfilesPayload
from app.core.keyboard_profiles import load_keyboard_profiles, save_keyboard_profiles

router = APIRouter()

DEFAULT_KEYBOARD_PAYLOAD = KeyboardProfilesPayload(
    selectedProfileId="default-laptop",
    profiles=[]
)


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "flowdj-api"}


@router.get("/version")
def version() -> dict[str, str]:
    return {"version": "0.3.0", "stage": "keyboard-first"}


@router.get("/keyboard-profiles", response_model=KeyboardProfilesPayload)
def get_keyboard_profiles() -> KeyboardProfilesPayload:
    payload = load_keyboard_profiles(DEFAULT_KEYBOARD_PAYLOAD)
    return payload


@router.put("/keyboard-profiles", response_model=KeyboardProfilesPayload)
def put_keyboard_profiles(payload: KeyboardProfilesPayload) -> KeyboardProfilesPayload:
    save_keyboard_profiles(payload)
    return payload
