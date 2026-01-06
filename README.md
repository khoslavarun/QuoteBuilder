# Quote Calculator

Quote Calculator is a FastAPI + React tool that helps exporters price shipments across different advance and payment scenarios with transparent financing assumptions.

## Project structure
- `backend/` – FastAPI service with SQLite, SQLAlchemy models, calc engine, and seed data.
- `frontend/` – Vite + React + TypeScript single-page app.

## Getting started (Replit-friendly)
1) Backend – install Python deps and run the API from the repo root:
```
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```
2) Frontend – install Node deps and start Vite:
```
cd frontend
npm install
npm run dev
```
3) Open the frontend (default `http://localhost:5173`) and ensure `VITE_API_BASE` points to your FastAPI host if it differs from `http://localhost:8000`.

## Core features
- Calculator with Mode A (target net profit on cost) and Mode B (fixed selling price) with default advance chips at 0%, 25%, 30%, 40%, 100%.
- Financing factor = rate × (credit months ÷ 12) using simple interest.
- Results table with landed cost, cash gap, financing, gross/net profit, and per-unit metrics.
- Explain calculations toggle showing formulas and working.
- Products CRUD with quick duplicate and inline edits.
- History list, load-into-calculator, and compare two saved runs side by side.
- CSV export of the results table (Excel-friendly).

## Seed data
On startup the backend seeds demo products:
- Basmati Rice 5kg – bag
- Cotton T-Shirt – piece
- Copper Wire – kg

## Testing
- Backend calculations: `pytest backend/tests`
- Frontend build check: `cd frontend && npm run build`

## Notes
- SQLite file lives at `backend/quote.db` and timestamps use UTC.
- API base URL defaults to `http://localhost:8000`; override with `VITE_API_BASE`.
