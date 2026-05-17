# Contributing

## Development Setup
1. Backend:
   - `cd backend`
   - `python -m venv .venv`
   - `./.venv/Scripts/Activate.ps1`
   - `pip install -r requirements.txt`
2. Frontend:
   - `cd frontend`
   - `npm install`

## Branch Naming
Use one of these prefixes:
- `feature/<name>`
- `fix/<name>`
- `refactor/<name>`

## Running Tests
- Backend: `cd backend && pytest`
- Frontend build/test: `cd frontend && npm run build`
- Visual tests: `cd frontend && npm run test:visual`

## Pull Requests
- Keep PR scope focused.
- Include a concise summary and testing notes.
- Link related issues/tasks when available.
