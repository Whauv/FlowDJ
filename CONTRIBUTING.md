# Contributing

## Development Setup
1. Backend:
   - `cd backend`
   - `python -m venv .venv`
   - `./.venv/Scripts/Activate.ps1`
   - `pip install -e ".[dev]"` (runtime + test/lint tools; use `pip install -e .` for runtime only)
2. Frontend:
   - `cd frontend`
   - `npm install`

## Branch Naming
Use one of these prefixes:
- `feature/<name>`
- `fix/<name>`
- `refactor/<name>`

## Running Tests
- Backend (ruff + pytest): `cd backend && ruff check app tests && pytest`
- Frontend unit tests: `cd frontend && npm test`
- Frontend build (typecheck + bundle): `cd frontend && npm run build`
- Visual tests: `cd frontend && npm run test:visual`

CI runs backend lint + tests and frontend lint + build + unit tests on every push/PR to `main`. The Playwright visual suite is run manually (it downloads browser binaries).

## Pull Requests
- Keep PR scope focused.
- Include a concise summary and testing notes.
- Link related issues/tasks when available.
