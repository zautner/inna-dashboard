# Task 8: Create Production Dockerfile

## What changed
- Created `Dockerfile` with:
  - `python:3.12-slim` base image
  - Non-root `app` user
  - `/data` volume for persistent storage
  - `HEALTHCHECK` using `/api/health`
  - Single uvicorn worker (appropriate for JSON file-based storage)

## Why
No containerization existed. Manual setup was required for every deployment.

## Tradeoffs
- Single-stage build (no compilation step needed for pure Python)
- Single worker because the app uses file-based storage with file locking that doesn't support concurrent writers across processes
- Uses `/data` as the container storage path, matching the `DASHBOARD_DATA_DIR` convention
