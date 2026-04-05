# Task 1: Add Structured Logging

## What changed
- `app/config.py`: Added `logging.basicConfig()` with timestamped format, configurable via `LOG_LEVEL` env var
- `app/main.py`: Added `logger = logging.getLogger(__name__)` and log calls for upload, process, approve/cancel/rethink, and publish actions
- `app/storage.py`: Added logger; replaced silent `except` in `_read_json_list` and `_read_json_object` with `logger.warning`; added `logger.error` in publish failure path
- `app/gemini_service.py`: Added logger with info for API calls, warning for retries, error for final failures

## Why
Zero logging made production debugging impossible. Silent JSON decode errors meant data corruption went unnoticed.

## Tradeoffs
- Used Python stdlib `logging` rather than structlog/loguru to avoid adding dependencies
- Log format is human-readable rather than JSON; JSON can be added later with a handler swap
- LOG_LEVEL defaults to INFO to avoid noisy DEBUG output in production
