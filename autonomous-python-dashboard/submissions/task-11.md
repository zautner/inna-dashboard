# Task 11: Add File Locking for JSON Storage

## What changed
- `app/storage.py`: Modified `_write_json()` to acquire an exclusive lock (`fcntl.flock`) on a `.lock` file before writing
- Lock is released in a `finally` block after `os.replace()`

## Why
Without locking, concurrent requests (e.g., simultaneous approve + publish) could cause a read-modify-write race condition and corrupt the JSON files.

## Tradeoffs
- Uses `fcntl.flock` which is Linux/macOS only (not Windows); acceptable since Docker deployment targets Linux
- Lock is per-file (e.g., `media_queue.json.lock`), so operations on different files don't block each other
- Read operations are not locked (acceptable since writes are atomic via `os.replace`)
- Does not prevent cross-file inconsistencies (e.g., between plans.json and media_queue.json during sync)
