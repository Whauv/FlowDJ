from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.services.track_source import MEDIA_ROOT, ensure_track_dirs

app = FastAPI(title="FlowDJ API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_track_dirs()
app.mount("/media", StaticFiles(directory=MEDIA_ROOT), name="media")
app.include_router(router)

