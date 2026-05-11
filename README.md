# FlowDJ

FlowDJ is a laptop-first DJ platform with keyboard-primary mixing and an integrated intelligent lighting engine (FlowLight).

This repository now includes:
- Core two-deck mixing workflow
- Keyboard-first interaction model with mode-aware controls
- Guided transitions and recommendations
- Post-session analytics
- Rule-based smart next-track suggestions
- Music-synced lighting architecture with virtual preview and extensible hardware adapter layer

## Tech Stack

### Frontend
- React + TypeScript + Vite
- Zustand state management
- Web Audio API based playback engine

### Backend
- FastAPI (Python)
- JSON-backed config/session storage for MVP workflows

## Current Capabilities

### DJ Engine
- Local audio import per deck
- Play/pause, seek, gain, crossfader, master output
- BPM estimation, waveform preview, cue and loop controls
- Mode placeholders: Browse / Mix / FX / Recovery

### Keyboard-First UX
- Configurable keybind profiles
- On-screen live legend
- Mapping editor with conflict detection
- One-hand profile option
- Onboarding/help modal

### Transition Assist
- Rule-based compatibility scoring (BPM/key/energy)
- Suggested transition actions and phrase hints
- Safe Mix toggle and visual warnings

### Session Analytics
- Session timeline + transition event logging
- Post-session scorecard and improvement suggestions
- Transition-by-transition report + replay markers
- Export JSON and CSV

### Smart Recommendations
- Hybrid recommendation engine (metadata + rules)
- Direction controls: build / maintain / cool down / surprise switch
- Bias controls: safe / balanced / adventurous
- Mood targeting and human-readable reason strings

### FlowLight (Lighting)
- DJ-state event bus to lighting engine
- Scene engine driven by BPM, beat phase, phrase section, deck dominance, crossfader, energy
- Key-aware + mood-aware palette system with full override controls
- Virtual fixture preview with explanation labels
- Adapter abstraction for DMX / Hue / MIDI-clock style outputs
- Simulation-first operation with no hardware required

## Project Structure

```text
FlowDJ/
  frontend/
    src/
      app/
      components/
      modules/
        analytics/
        transitions/
        recommendations/
        flowlight/
      services/
      state/
      styles/
  backend/
    app/
      api/
      core/
```

## Run Locally

### 1) Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173`
Backend defaults to `http://localhost:8000`

## Key Backend Endpoints

- `GET /health`
- `GET /version`
- Keyboard profiles:
  - `GET /keyboard-profiles`
  - `PUT /keyboard-profiles`
- Sessions/analytics:
  - `POST /sessions/start`
  - `POST /sessions/append`
  - `POST /sessions/finalize`
  - `GET /sessions`
  - `GET /sessions/{session_id}`
  - `GET /sessions/{session_id}/export/json`
  - `GET /sessions/{session_id}/export/csv`
- Recommendations:
  - `GET /recommendations/fixtures`
  - `POST /recommendations/next`

## Hardware Integration Notes (FlowLight)

FlowLight is provider-based. Real hardware integrations should implement the adapter interface used by `src/modules/flowlight`:
- `connect()`
- `disconnect()`
- `sendState(state)`

Current adapters are safe placeholders/stubs for:
- DMX path
- Philips Hue path
- MIDI/clock path

This keeps app logic isolated from transport/protocol details and allows simulation mode to remain fully functional during development.

## Status

The project has moved beyond phase-specific snapshots and this README now represents the latest consolidated state.
