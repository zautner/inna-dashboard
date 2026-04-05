from __future__ import annotations

import json
import os
from pathlib import Path

import pytest


@pytest.fixture(autouse=True)
def _isolate_env(monkeypatch, tmp_path):
    """Point all storage at a temporary directory so tests never touch real data."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    uploads_dir = data_dir / "uploads"
    uploads_dir.mkdir()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("DASHBOARD_DATA_DIR", str(data_dir))
    monkeypatch.setenv("PLANS_FILE", str(data_dir / "plans.json"))
    monkeypatch.setenv("BOT_QUEUE_FILE", str(data_dir / "media_queue.json"))
    monkeypatch.setenv("BOT_ACTIVITY_FILE", str(data_dir / "activity.json"))
    monkeypatch.setenv("UPLOADS_DIR", str(uploads_dir))
    monkeypatch.setenv("INNA_CONTEXT_FILE", str(data_dir / "inna-context.json"))

    # Write default empty JSON files
    (data_dir / "plans.json").write_text("[]")
    (data_dir / "media_queue.json").write_text("[]")
    (data_dir / "activity.json").write_text("[]")


@pytest.fixture()
def data_dir(tmp_path) -> Path:
    return tmp_path / "data"
