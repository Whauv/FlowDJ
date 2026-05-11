from typing import Literal

from pydantic import BaseModel


ModeName = Literal["browse", "mix", "fx", "recovery"]


class MappingEntry(BaseModel):
    action: str
    code: str
    label: str
    description: str


class ProfileMappings(BaseModel):
    browse: list[MappingEntry]
    mix: list[MappingEntry]
    fx: list[MappingEntry]
    recovery: list[MappingEntry]


class KeyProfile(BaseModel):
    id: str
    name: str
    compact: bool
    mappings: ProfileMappings


class KeyboardProfilesPayload(BaseModel):
    selectedProfileId: str
    profiles: list[KeyProfile]
