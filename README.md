# SmartFilter

**Dynamic Student Data Filtering System** — Department of AI & Data Science

SmartFilter lets college teachers and HODs import student data from Excel (upload or clipboard paste), build filtering rules against whatever columns that data happens to contain, and instantly get the list of students they need.

Nothing about the student columns is hardcoded. Whether the sheet has `Name | Roll No | Marks | Active KT` or `Student ID | CGPA | Backlogs | Department`, the interface is generated from the uploaded data.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TanStack Router/Start, Tailwind CSS v4, shadcn/ui |
| Backend | Python, FastAPI, Pandas |
| Database | MongoDB (Motor async driver) |
| Auth | bcrypt password hashing + JWT bearer tokens |

> **Note on running it:** the frontend in this repository runs in the Lovable preview. The FastAPI/MongoDB backend under `backend/` is real, runnable code, but it must be started on your own machine or server — the preview environment cannot run Python. Point the frontend at it with `VITE_API_URL`.

## Folder structure

```
backend/
  app/
    main.py            FastAPI app, CORS, error handlers
    config.py          Environment-driven settings
    db.py              Mongo client + index creation
    deps.py            JWT bearer dependency (current user)
    core/security.py   Password hashing + JWT encode/decode
    routers/auth.py    /api/auth/signup, /login, /me
    schemas/auth.py    Pydantic request/response models
  requirements.txt
  .env.example

src/
  components/          Reusable UI (Brand, AuthLayout, ThemeToggle, ...)
  routes/              File-based routes (landing, login, signup, app shell)
  services/            API client + per-domain service modules
  lib/                 Auth context, theme context, helpers
  styles.css           Design system tokens (light + dark)
```

## Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit the values
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## MongoDB setup

Run MongoDB locally (`mongod`) or use a MongoDB Atlas cluster, then set `MONGODB_URI`. Collections and indexes are created automatically on first startup:

- `users` (unique index on `email`)
- `datasets`, `filter_templates`, `analysis_history` (indexed by `user_id` + `created_at`)
- `notes` (unique index on `user_id`)

## Environment variables

**Backend (`backend/.env`)**

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Database name |
| `JWT_SECRET` | Secret used to sign tokens — use a long random string |
| `JWT_ALGORITHM` | Signing algorithm (default `HS256`) |
| `JWT_EXPIRE_MINUTES` | Token lifetime |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |

**Frontend**

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the API, e.g. `http://localhost:8000/api` |

Secrets are never committed; `.env.example` holds placeholders only.

## Running locally

1. Start MongoDB.
2. Start the backend on port 8000 (above).
3. Set `VITE_API_URL=http://localhost:8000/api` and start the frontend (`npm run dev`).

## API overview

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create a teacher or HOD account, returns JWT |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/auth/me` | Current user from the bearer token |

Dataset, filter, history and notes endpoints are added in later phases.

## How filtering works

The frontend never sends code — only a declarative rule set:

```json
{
  "dataset_id": "...",
  "filters": [
    { "column": "Marks", "operator": "less_than", "value": 35 },
    { "column": "Active KT", "operator": "equals", "value": "Yes" }
  ],
  "logic": "AND"
}
```

The backend validates that every column exists in the dataset and that every operator is one of a fixed allow-list, then builds a Pandas boolean mask per rule and combines the masks with AND/OR. There is no `eval()` and no user-supplied code execution anywhere in the pipeline.

## Deployment

- **Backend:** any container host (Render, Railway, Fly.io, a VPS). Run `uvicorn app.main:app --host 0.0.0.0 --port $PORT` with the environment variables set, and add the deployed frontend origin to `CORS_ORIGINS`.
- **Database:** MongoDB Atlas.
- **Frontend:** publish from Lovable, with `VITE_API_URL` pointing at the deployed backend.

## Future AI feature

No AI is used in V1. The rule format above is deliberately generic so a future assistant could turn "show students below 35 marks who have an active KT" into the exact same JSON and reuse the existing engine unchanged.
