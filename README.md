# FlowDJ (Phase 4 Guided Transitions + Beginner Assist)

FlowDJ is a laptop-native DJ MVP built around keyboard-primary mixing, now extended with interpretable transition guidance.

## New in Phase 4
- Rule-based compatibility scoring for next-track suggestions using:
  - BPM difference
  - harmonic key compatibility (Camelot adjacency)
  - energy mismatch
- Suggested Next Track panel in mixer
- Suggested transition actions in mixer area:
  - start blend now
  - enable 8-bar loop
  - lower bass on outgoing deck
  - swap decks at drop
  - use echo out
- Phrase-aware timing hint based on 8-bar boundary estimation
- Safe Mix mode toggle to reduce risky transitions
- Visual warnings for BPM/key/energy clashes
- Explanation text for every recommendation
- Example transition test cases for sample tracks

## Architecture (Phase 4 additions)
- `frontend/src/modules/transitions/engine.ts`
  - rule-based compatibility and transition hint engine
- `frontend/src/modules/transitions/sampleTracks.ts`
  - candidate track metadata set
- `frontend/src/modules/transitions/testCases.ts`
  - example test cases for recommendation behavior

## How compatibility score works
Compatibility score is weighted and interpretable:
- BPM score: tempo gap penalty
- Key score: exact/adjacent/non-harmonic mapping
- Energy score: large energy jump penalty
- Safe Mix mode applies extra penalties to risky candidates

Each recommendation includes explanation text and warnings.

## UI behavior
- Suggestions update live as deck position changes.
- Mixer shows:
  - top candidate track + compatibility score
  - explanation line
  - warning chips/messages
  - action guidance card with phrase hint
- Safe Mix toggle changes recommendation ranking in real time.

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

## Existing API
- `GET /health`
- `GET /version`
- `GET /keyboard-profiles`
- `PUT /keyboard-profiles`

## Example Test Cases
Implemented in:
- `frontend/src/modules/transitions/testCases.ts`

Scenarios include:
- Balanced house blend
- Safe-mix conservative ranking
- Energy-clash warning detection
