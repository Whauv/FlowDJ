from fastapi import APIRouter, File, UploadFile
from app.api.schemas import TrackAsset, YoutubeImportRequest
from app.services.track_source import import_youtube_as_mp3, list_tracks, save_uploaded_mp3

router = APIRouter()


@router.get("/tracks", response_model=list[TrackAsset])
def get_tracks() -> list[TrackAsset]:
    return [TrackAsset.model_validate(item) for item in list_tracks()]


@router.post("/tracks/upload", response_model=TrackAsset)
async def upload_track(file: UploadFile = File(...)) -> TrackAsset:
    track = await save_uploaded_mp3(file)
    return TrackAsset.model_validate(track)


@router.post("/tracks/import-youtube", response_model=TrackAsset)
def import_youtube_track(payload: YoutubeImportRequest) -> TrackAsset:
    track = import_youtube_as_mp3(str(payload.url))
    return TrackAsset.model_validate(track)
