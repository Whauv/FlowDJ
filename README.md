# FlowDJ (Phase 3 Keyboard-First UX)

FlowDJ is a laptop-native DJ MVP built around keyboard-primary mixing.

## Stack
- Frontend: React + TypeScript + Vite + Zustand
- Backend: FastAPI (Python)
- Audio: Web Audio API + HTML media elements

## Phase 3 Features
- Mode-aware keyboard system: Browse, Mix, FX, Recovery
- Editable keybind profiles with conflict detection
- Default profile + optional one-hand profile
- Live on-screen shortcut legend for current mode
- Keyboard mapping panel (`G`)
- Onboarding/help overlay (`H`)
- Debounced keyboard actions for reliability
- Hold-to-trigger protection for dangerous recovery action
- Recovery mode actions:
  - Emergency fade
  - Kill switch (hold)
  - Safe transition
- Profile persistence via backend config file (`backend/app/core/keyboard_profiles.json`)

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## Run Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --port 8000
```

## Keyboard Defaults
### Global mode switching
- `1`: Browse Mode
- `2`: Mix Mode
- `3`: FX Mode
- `4`: Recovery Mode
- `Tab`: Switch active deck
- `H`: Help overlay
- `G`: Key mapping panel

### Browse Mode
- `Q`/`P`: Load to Deck A/B
- `Up`/`Down`: Library navigation placeholder
- `/`: Search focus placeholder

### Mix Mode
- `Z`/`X`: Play/Pause Deck A/B
- `C`: Cue set/jump
- `V`: Sync active deck BPM to other deck
- `Left`/`Right`: Seek active deck
- `,`/`.`: Crossfader nudges
- `B`/`N`: EQ low/high macro toggle
- `L`: Loop in/out
- `K`: Autoloop

### FX Mode
- `J`: FX slot 1
- `K`: FX slot 2
- `L`: Momentary FX toggle
- `A`/`S`: Deck volume down/up

### Recovery Mode
- `F`: Emergency fade
- `R` (hold): Kill switch
- `T`: Safe transition
- `N`/`M`: Master down/up

## API
- `GET /health`
- `GET /version`
- `GET /keyboard-profiles`
- `PUT /keyboard-profiles`
