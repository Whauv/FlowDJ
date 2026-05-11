from typing import Literal

from pydantic import BaseModel, Field


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


class SessionTransitionEvent(BaseModel):
    timestamp_ms: int
    from_deck: Literal["A", "B"]
    to_deck: Literal["A", "B"]
    bpm_mismatch: float
    key_clash_risk: float
    overlap_seconds: float
    abrupt_volume_delta: float
    used_loop: bool = False
    used_recovery: bool = False
    notes: str = ""


class SessionTimelinePoint(BaseModel):
    timestamp_ms: int
    master_gain: float = Field(ge=0.0, le=1.0)
    crossfader: float = Field(ge=0.0, le=1.0)
    energy: float = Field(ge=0.0, le=10.0)


class SessionAnalyticsPayload(BaseModel):
    id: str
    started_at_iso: str
    ended_at_iso: str
    transition_timing_score: float
    dead_air_seconds: float
    overlap_quality_score: float
    abrupt_volume_score: float
    bpm_mismatch_severity: float
    key_clash_risk: float
    loop_usage_quality: float
    recovery_actions_used: int
    average_energy_flow: float
    total_score: float
    suggestions: list[str]
    transitions: list[SessionTransitionEvent]
    timeline: list[SessionTimelinePoint]


class SessionCreateRequest(BaseModel):
    started_at_iso: str


class SessionAppendRequest(BaseModel):
    id: str
    timeline: list[SessionTimelinePoint] = []
    transitions: list[SessionTransitionEvent] = []


class SessionFinalizeRequest(BaseModel):
    id: str
    ended_at_iso: str
