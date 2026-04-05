# Task 4: Enhance Health Check Endpoint

## What changed
- `app/main.py`: Enhanced `GET /api/health` to include `storageWritable` and `geminiKeyPresent` checks; `ok` is now a computed field
- Added `GET /api/ready` readiness probe that returns 503 if storage is unwritable or API key is missing
- Added `_check_storage_writable()` helper that touches+removes a probe file

## Why
The original health check always returned `ok: true` regardless of actual system state, making it useless for container orchestrators and monitoring.

## Tradeoffs
- Readiness probe does not test Gemini API connectivity (would add latency); it only checks key presence
- Storage probe creates/deletes a file per call; acceptable for health check frequency (every 30s)
