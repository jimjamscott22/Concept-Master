# Docker Compose Setup

## Implementation Summary

### 2026-07-03 - Add Docker Compose development stack

- Added a root `compose.yaml` that runs MariaDB, the FastAPI backend, and the Vite React frontend as one local development stack.
- Added backend and frontend Dockerfiles, plus Docker ignore files, so each service can build repeatably without copying local virtual environments, Node modules, build output, or secrets.
- Made the Vite API proxy target configurable with `VITE_API_PROXY_TARGET`, defaulting to the existing `http://localhost:8000` behavior outside Docker and using `http://backend:8000` inside Compose.
- Documented the Compose workflow in `README.md` and this file, including ports, environment overrides, data reset, and rebuild commands.

## Run

From the repository root:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
- MariaDB from host tools: `127.0.0.1:3307`

The backend initializes the database schema before starting Uvicorn. `SYNC_ON_START` defaults to `1` in Compose, so the app also syncs `content/terms`, `content/articles`, and `content/categories.yml` into MariaDB on startup.

## Services

| Service | Purpose | Container port | Host port |
|---|---|---:|---:|
| `db` | MariaDB database | `3306` | `3307` |
| `backend` | FastAPI API | `8000` | `8000` |
| `frontend` | Vite dev server | `5173` | `5173` |

## Environment Overrides

Compose reads the repository `.env` file automatically for variable interpolation. If a value is not present, these development defaults are used:

```ini
DB_NAME=concept_master
DB_USER=concept_user
DB_PASS=concept_password
MARIADB_ROOT_PASSWORD=concept_root_password
DB_HOST_PORT=3307
BACKEND_PORT=8000
FRONTEND_PORT=5173
SYNC_ON_START=1
```

Inside the Compose network, the backend always connects to MariaDB at `db:3306`.

## Common Commands

Start or rebuild the stack:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up -d --build
```

Stop containers while keeping the database volume:

```bash
docker compose down
```

Reset the database and Node modules volume:

```bash
docker compose down -v
```

Run a one-off content sync:

```bash
docker compose exec backend python -m backend.sync_content
docker compose exec backend python -m backend.sync_articles
```

## Notes

- The backend mounts `./backend` and `./content`, so FastAPI reloads code changes and app CRUD writes still update the markdown source files.
- The frontend mounts `./frontend` and keeps container dependencies in the `frontend_node_modules` volume, avoiding host/container Node module conflicts.
- MariaDB data lives in the `db_data` volume and survives `docker compose down`.
