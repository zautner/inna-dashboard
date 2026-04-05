# Task 10: Add Retry Logic to Gemini Service

## What changed
- `app/gemini_service.py`: Added retry loop with 3 attempts and exponential backoff (2s, 4s delays) around `client.models.generate_content()`
- Logs each attempt, warnings on retry, error on final failure

## Why
Gemini API can fail transiently (rate limits, network issues). Without retry, a single API hiccup fails the entire processing request.

## Tradeoffs
- Uses `time.sleep()` which blocks the event loop; acceptable because this is the only CPU-intensive endpoint and the app runs single-worker
- Catches broad `Exception` to handle any SDK error; could be narrowed to specific Google API exceptions if the SDK exposes them
- 3 retries with 2s base delay means worst case is ~8s wait before failure
