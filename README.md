# FlowDJ (Phase 1 Scaffold)

FlowDJ is a laptop-first DJ web app MVP designed for keyboard-primary mixing.

## Stack
- Frontend: React + TypeScript + Vite + Zustand
- Backend: Python + FastAPI
- Audio foundation: Web Audio API placeholder engine

## Phase 1 Scope
- Two decks
- Center mixer panel
- Waveform view placeholder
- Library panel
- Top transport/status bar
- Keyboard shortcut system service with configurable mappings
- Mode system placeholder: Browse, Mix, FX, Recovery
- Dark theme by default

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

## Keyboard Defaults
- `Space`: Play/Pause Deck A
- `Enter`: Play/Pause Deck B
- `1`: Browse Mode
- `2`: Mix Mode
- `3`: FX Mode
- `4`: Recovery Mode

Mappings are managed in:
- `frontend/src/services/keyboard/KeyboardManager.ts`

## Notes
This is a clean scaffold only. Advanced DJ logic (beat sync, cue system, loops, FX routing, full waveform analysis, hardware integration) is intentionally deferred.
