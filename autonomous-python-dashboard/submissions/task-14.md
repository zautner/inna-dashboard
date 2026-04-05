# Task 14: Add API Integration Tests

## What changed
- Created `tests/test_api.py` with 14 test cases covering:
  - Health endpoint (ok response, readiness probe)
  - Queue endpoints (empty items, counts, stats)
  - Plans endpoints (empty list, save plans)
  - Upload endpoint (image upload, non-media rejection, large file rejection)
  - Bot monitor, Inna context (get/update), help docs

## Why
API endpoints were completely untested. Integration tests catch routing, serialization, and middleware issues that unit tests miss.

## Tradeoffs
- Uses `importlib.reload()` per test to rebuild settings with fresh env vars — slightly slow but ensures true isolation
- Does not test Gemini-dependent endpoints (/api/process) since that requires mocking the Gemini SDK
