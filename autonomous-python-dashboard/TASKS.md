# Production Tasks

## Status Legend
- [ ] pending
- [~] in-progress
- [x] done
- [!] rejected — reason appended inline

## Tasks
- [x] 1. Add structured logging — Configure Python logging in all modules (config, main, storage, gemini_service) with JSON-formatted output and request context
- [x] 2. Validate required config at startup — Fail fast in config.py if GEMINI_API_KEY is missing; warn for optional vars like TELEGRAM_BOT_TOKEN
- [x] 3. Add FastAPI lifespan for graceful shutdown — Use lifespan context manager to log startup/shutdown and clean up in-progress operations
- [x] 4. Enhance health check endpoint — Verify storage directory writability and Gemini API key presence; add /api/ready for readiness probes
- [x] 5. Add file upload size limits — Enforce max upload size (50MB) in media upload endpoints to prevent disk exhaustion
- [x] 6. Add CORS middleware — Configure CORSMiddleware with restricted origins from environment variable
- [x] 7. Add request logging middleware — Log method, path, status code, and duration for every HTTP request
- [x] 8. Create production Dockerfile — Multi-stage build, non-root user, health check, proper signal handling with uvicorn
- [x] 9. Pin transitive dependencies — Generate requirements-lock.txt with all resolved dependency versions
- [x] 10. Add retry logic to gemini_service — Retry Gemini API calls with exponential backoff (3 attempts) on transient failures
- [x] 11. Add file locking for JSON storage — Use fcntl/filelock for read-modify-write cycles in storage.py to prevent race conditions
- [x] 12. Set up pytest and initial test infrastructure — Add pytest config, conftest.py with test fixtures, and basic smoke tests for config and storage
- [x] 13. Add unit tests for schedule.py — Test all day label formats, edge cases, and error conditions
- [x] 14. Add API integration tests — Test critical FastAPI endpoints (health, queue CRUD, plans, upload) using TestClient
- [x] 15. Update .gitignore — Add __pycache__, .env, .venv, *.pyc, .pytest_cache, and IDE files
- [x] 16. Update README with production deployment guide — Add API endpoint reference, Docker instructions, environment variable table, and troubleshooting section
