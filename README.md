# FlowDJ (Phase 5 Post-Mix Analytics)

FlowDJ is a laptop-native DJ system with keyboard-first mixing and now a complete session analytics layer to help users improve over time.

## Phase 5 Features
- Session timeline recorder (master gain, crossfader, energy over time)
- Transition event log (per transition metrics)
- Backend session persistence APIs
- Post-session scorecard and transition-by-transition report
- Replay panel (transition markers)
- Improvement suggestion panel
- Export session as JSON and CSV

## Metrics Tracked and Scored
- Transition timing
- Dead air duration
- Overlap quality
- Abrupt volume changes
- BPM mismatch severity
- Key clash risk
- Loop usage quality
- Recovery actions used
- Average energy flow across the set

## Scoring Logic
Scoring is rule-based and transparent in backend analytics pipeline (`backend/app/core/session_store.py`).

Examples:
- Dead air is estimated from low master-gain timeline windows.
- BPM mismatch severity is average mismatch across logged transitions.
- Key clash risk is averaged from transition harmonic risk estimates.
- Total score is a weighted aggregate of timing/overlap/abruptness/mismatch/risk/loop/dead-air factors.

## Backend Session Model + APIs
Defined in:
- `backend/app/api/schemas.py`
- `backend/app/core/session_store.py`
- `backend/app/api/routes.py`

Endpoints:
- `POST /sessions/start`
- `POST /sessions/append`
- `POST /sessions/finalize`
- `GET /sessions`
- `GET /sessions/{session_id}`
- `GET /sessions/{session_id}/export/json`
- `GET /sessions/{session_id}/export/csv`

## Frontend Analytics Pipeline
- Timeline sampling and transition logging integrated in `frontend/src/app/App.tsx`
- Analytics panel in `frontend/src/components/analytics/SessionAnalyticsPanel.tsx`
- Session API client in `frontend/src/services/api/sessionApi.ts`
- Helpers in `frontend/src/modules/analytics/`

## Run
### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --port 8000
```

## Notes
- Keep backend running to persist and finalize analytics sessions.
- Use the Session Analytics panel to end a session and generate scorecard/report.
- Export buttons provide JSON/CSV session artifacts for review.
