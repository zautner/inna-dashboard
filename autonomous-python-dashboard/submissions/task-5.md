# Task 5: Add File Upload Size Limits

## What changed
- `app/main.py`: Added `MAX_UPLOAD_SIZE = 50MB` constant and `_check_upload_size()` helper
- Called before `_save_upload()` in both `/api/media/upload` and `/api/queue-items/{id}/attach-media`
- Returns HTTP 413 (Payload Too Large) with a descriptive message

## Why
Without size limits, a single large upload could exhaust disk space and crash the application.

## Tradeoffs
- Uses `file.file.seek()` to measure size, which reads the entire file into memory via SpooledTemporaryFile — acceptable since the limit is 50MB and the app runs single-worker
- 50MB is generous enough for most videos but prevents obvious abuse
