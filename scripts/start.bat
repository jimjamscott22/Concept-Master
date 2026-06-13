@echo off
cd /d "%~dp0\.."

start "Backend" cmd /k "uv run uvicorn backend.main:app --reload --port 8000"
start "Frontend" cmd /k "cd frontend && npm run preview"