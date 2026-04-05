# Task 15: Update .gitignore

## What changed
- `.gitignore`: Added Python artifacts (`__pycache__`, `*.pyc`, `.venv`), environment files (`.env`), testing artifacts (`.pytest_cache`, `.coverage`), and IDE files (`.idea`, `.vscode`)

## Why
Without these entries, developer environments would track generated files and potentially leak secrets via `.env` files.
