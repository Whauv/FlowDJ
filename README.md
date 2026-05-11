# FlowDJ (Phase 6 Smart Track Recommendation Layer)

FlowDJ now includes a lightweight AI-assisted next-track recommender built as a hybrid metadata + rule engine (ML-replaceable service boundary).

## Phase 6 Features
- Recommended next tracks in live panel
- Human-readable reason strings per recommendation
- Strategy selector:
  - Build Energy
  - Maintain Groove
  - Cool Down
  - Surprise Switch
- Mood filter input (for tag bias)
- Bias control:
  - Safe
  - Balanced
  - Adventurous
- Session-history-aware filtering (avoid repeating already-used tracks)

## Hybrid Engine Inputs
- BPM
- Musical key (Camelot relation)
- Energy estimate
- Genre tags (when available)
- Session history IDs
- Desired direction and bias

## Backend Service/API
- Service module: `backend/app/core/recommendation_engine.py`
- Fixtures: `backend/app/core/recommendation_fixtures.json`
- API routes:
  - `GET /recommendations/fixtures`
  - `POST /recommendations/next`

## Frontend Integration
- API client: `frontend/src/services/api/recommendationApi.ts`
- Strategy UI: `frontend/src/components/recommendations/StrategySelector.tsx`
- Suggestions UI: `frontend/src/components/recommendations/NextTrackPanel.tsx`
- Recommendation types: `frontend/src/modules/recommendations/types.ts`
- App wiring: `frontend/src/app/App.tsx`

## Run
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```
