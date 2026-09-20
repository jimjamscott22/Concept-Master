@echo off
cd /d "%~dp0\.."

call npm --prefix frontend run build
if errorlevel 1 exit /b %errorlevel%

start "Backend" cmd /k "uv run uvicorn backend.main:app --port 8000"
start "Frontend" cmd /k "cd frontend && npm run preview"
