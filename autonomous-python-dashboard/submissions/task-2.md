# Task 2: Validate Required Config at Startup

## What changed
- `app/config.py`: Added `validate_settings()` function that runs at import time after `settings = build_settings()`

## Behavior
- `GEMINI_API_KEY` empty → `sys.exit()` with clear error message (app cannot function without it)
- `TELEGRAM_BOT_TOKEN` empty → stderr warning (Telegram media downloads will fail but app is usable)
- All 5 webhook URLs empty → stderr warning (publishing will fail for all targets)

## Why
Previously the app started fine with missing keys and only failed at runtime when a user triggered Gemini generation, producing a confusing 503 error.

## Tradeoffs
- Uses `sys.exit()` for GEMINI_API_KEY rather than raising an exception, because this runs at module import time and a clean exit with a message is more helpful than a traceback
- Does not use logging (uses stderr) because logging config is in the same file and this runs at import time
