#!/usr/bin/env bash
cd "$(dirname "$0")/.."

uv run uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

cd frontend
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
