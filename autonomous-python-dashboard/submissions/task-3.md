# Task 3: Add FastAPI Lifespan for Graceful Shutdown

## What changed
- `app/main.py`: Added `lifespan()` async context manager using `contextlib.asynccontextmanager`
- Moved `ensure_storage()` from module-level into the lifespan startup phase
- Passed `lifespan=lifespan` to `FastAPI()` constructor
- Logs startup info (data_dir, batch_size) and shutdown message

## Why
Module-level `ensure_storage()` runs at import time, which can cause issues during testing and doesn't integrate with FastAPI's lifecycle. The lifespan pattern allows proper startup/shutdown hooks.

## Tradeoffs
- Shutdown is currently just a log message; more complex cleanup (draining in-progress publishes) could be added later but isn't needed since the app is single-worker
