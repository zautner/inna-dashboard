# Task 12: Set Up Pytest and Test Infrastructure

## What changed
- Created `pyproject.toml` with pytest configuration (testpaths, pythonpath)
- Created `tests/conftest.py` with autouse fixture that isolates all storage to temp directories
- Created `tests/__init__.py`
- Added `pytest>=8.0.0` and `httpx>=0.27.0` to `requirements.txt`

## Why
Zero test coverage. The conftest ensures tests never touch real data files.

## Tradeoffs
- Uses monkeypatch for env vars in conftest, which means tests must reload modules if they import at module level
- httpx is required by FastAPI's TestClient for async support
