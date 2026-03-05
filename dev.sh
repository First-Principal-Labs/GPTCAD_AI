#!/bin/bash
# GPTCAD Development Server
# Starts both backend (FastAPI) and frontend (Vite) concurrently

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting GPTCAD development servers..."

# Start backend
echo "[Backend] Starting FastAPI on port 8080..."
(
  cd "$ROOT_DIR"
  source .venv/bin/activate 2>/dev/null || true
  uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
) &
BACKEND_PID=$!

# Start frontend
echo "[Frontend] Starting Vite on port 5175..."
(
  cd "$ROOT_DIR/frontend"
  npm run dev
) &
FRONTEND_PID=$!

# Handle cleanup on exit
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

echo ""
echo "  Backend:  http://localhost:8080"
echo "  Frontend: http://localhost:5175"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

wait
