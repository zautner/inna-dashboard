# Task 9: Pin Transitive Dependencies

## What changed
- Created `requirements-lock.txt` with all resolved dependency versions (pip freeze output)

## Why
Without pinned transitive dependencies, builds are non-reproducible — different installs can pull different versions of Pydantic, Starlette, etc.

## Tradeoffs
- Separate lock file rather than replacing `requirements.txt`, so developers can still see direct dependencies clearly
- Lock file needs manual regeneration when requirements.txt changes
