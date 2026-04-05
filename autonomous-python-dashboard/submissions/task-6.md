# Task 6: Add CORS Middleware

## What changed
- `app/main.py`: Added `CORSMiddleware` with allowed origins derived from `APP_URL` env var (falls back to `http://localhost:8090`)

## Why
Without CORS configuration, the frontend can only work same-origin. Adding configurable origins allows deployment behind a reverse proxy with a different domain.

## Tradeoffs
- Uses `allow_methods=["*"]` and `allow_headers=["*"]` for simplicity; could be locked down further if needed
- Multiple origins can be specified by comma-separating `APP_URL`
