from fastapi import APIRouter
from app.api.schemas import KeyboardProfilesPayload
from app.services.keyboard_profiles import load_keyboard_profiles, save_keyboard_profiles

router = APIRouter()
DEFAULT_KEYBOARD_PAYLOAD = KeyboardProfilesPayload(selectedProfileId="default-laptop", profiles=[])


@router.get("/keyboard-profiles", response_model=KeyboardProfilesPayload)
def get_keyboard_profiles() -> KeyboardProfilesPayload:
    return load_keyboard_profiles(DEFAULT_KEYBOARD_PAYLOAD)


@router.put("/keyboard-profiles", response_model=KeyboardProfilesPayload)
def put_keyboard_profiles(payload: KeyboardProfilesPayload) -> KeyboardProfilesPayload:
    save_keyboard_profiles(payload)
    return payload
