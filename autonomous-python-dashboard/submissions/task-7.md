# Task 7: Add Request Logging Middleware

## What changed
- `app/main.py`: Added `request_logging_middleware` that logs `METHOD /path STATUS DURATIONms` for every HTTP request

## Why
No request visibility existed. Operators couldn't see which endpoints were being hit or how long they took.

## Tradeoffs
- Logs all requests including static files; could be filtered if too noisy
- Uses `time.monotonic()` for timing which is not affected by clock adjustments
