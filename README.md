# FlowDJ (Phase 2 Core Deck Engine)

FlowDJ is a laptop-first DJ web app MVP designed for keyboard-primary mixing.

## Stack
- Frontend: React + TypeScript + Vite + Zustand
- Backend: Python + FastAPI
- Audio engine: Browser Web Audio API + media elements (low-latency interactive routing)

## Phase 2 Scope Implemented
- Two-deck playback engine
- Local audio file import (per deck)
- Load track to left/right deck
- Play/pause per deck
- Seek scrub and seek-step controls
- Deck gain controls
- Crossfader + master output controls
- Waveform rendering (per deck + combined view)
- BPM estimation and display
- Cue point set/jump
- Loop in/out and autoloop
- Active-deck visual feedback
- Keyboard-first path for all critical live actions
- Basic unsupported-file error handling

## Project Structure
```text
FlowDJ/
  frontend/
    src/
      app/
      components/
        decks/
        mixer/
        library/
        waveform/
        layout/
      services/
        audioEngine/
        keyboard/
      state/
        utils/
      hooks/
      modules/
        waveform/
        lightingSync/
      styles/
  backend/
    app/
      api/
      core/
```

## Prerequisites
- Node.js 20+
- Python 3.11+

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Run Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000`.

## API Endpoints (Scaffold)
- `GET /health`
- `GET /version`

## Keyboard Controls (Core Live Actions)
- `Q`: Import file to Deck A
- `P`: Import file to Deck B
- `Z`: Play/Pause Deck A
- `X`: Play/Pause Deck B
- `Tab`: Switch active deck
- `Left/Right Arrow`: Seek active deck -5s/+5s
- `A/S`: Decrease/Increase active deck volume
- `,` / `.`: Crossfader left/right
- `N/M`: Master output down/up
- `C`: Cue set (first press) / Cue jump (next presses)
- `L`: Loop In/Out/Clear on active deck
- `K`: Enable active-deck autoloop
- `1/2/3/4`: Browse/Mix/FX/Recovery modes

## Notes
- Mouse controls are available, but all critical deck/mixer actions have keyboard paths.
- BPM estimation is lightweight and intended for MVP guidance.
- Advanced features (beat sync quality tuning, stems, advanced FX chains, controller HID/MIDI integration) are intentionally deferred.
