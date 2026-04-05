from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path

import pytest


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """Create a TestClient with isolated storage."""
    data_dir = tmp_path / "api_data"
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

    (data_dir / "plans.json").write_text("[]")
    (data_dir / "media_queue.json").write_text("[]")
    (data_dir / "activity.json").write_text("[]")

    # Rebuild settings and re-import app with fresh config
    import importlib
    import app.config
    importlib.reload(app.config)
    import app.storage
    importlib.reload(app.storage)
    import app.gemini_service
    importlib.reload(app.gemini_service)
    import app.main
    importlib.reload(app.main)

    from fastapi.testclient import TestClient
    from app.main import app as fastapi_app

    with TestClient(fastapi_app) as tc:
        yield tc


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert "batchSize" in data
        assert data["storageWritable"] is True
        assert data["geminiKeyPresent"] is True

    def test_ready_returns_200(self, client):
        response = client.get("/api/ready")
        assert response.status_code == 200
        assert response.json()["ready"] is True


class TestQueueEndpoints:
    def test_queue_items_empty(self, client):
        response = client.get("/api/queue-items")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []

    def test_queue_counts_empty(self, client):
        response = client.get("/api/queue-counts")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0

    def test_queue_stats_empty(self, client):
        response = client.get("/api/queue-stats")
        assert response.status_code == 200
        data = response.json()
        assert data["inQueue"] == 0
        assert data["draftsPending"] == 0
        assert data["approved"] == 0


class TestPlansEndpoints:
    def test_get_plans_empty(self, client):
        response = client.get("/api/plans")
        assert response.status_code == 200
        assert response.json() == []

    def test_save_plans(self, client):
        plans = [{"name": "Test Plan", "type": "week", "items": []}]
        response = client.post("/api/plans", json=plans)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["plans"]) == 1
        assert data["plans"][0]["name"] == "Test Plan"


class TestUploadEndpoint:
    def test_upload_image(self, client):
        file_content = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
        response = client.post(
            "/api/media/upload",
            files={"file": ("test.png", BytesIO(file_content), "image/png")},
            data={"caption": "test caption"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["url"].startswith("/uploads/")
        assert data["queueItemId"]

    def test_upload_rejects_non_media(self, client):
        response = client.post(
            "/api/media/upload",
            files={"file": ("test.txt", BytesIO(b"hello"), "text/plain")},
        )
        assert response.status_code == 400

    def test_upload_rejects_large_file(self, client):
        large_content = b"\x00" * (51 * 1024 * 1024)  # 51 MB
        response = client.post(
            "/api/media/upload",
            files={"file": ("big.png", BytesIO(large_content), "image/png")},
        )
        assert response.status_code == 413


class TestBotMonitor:
    def test_bot_monitor(self, client):
        response = client.get("/api/bot-monitor")
        assert response.status_code == 200
        data = response.json()
        assert "queueCounts" in data
        assert "timeline" in data


class TestInnaContext:
    def test_get_default_context(self, client):
        response = client.get("/api/inna-context")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Inna"
        assert "voice" in data

    def test_update_context(self, client):
        response = client.put("/api/inna-context", json={"name": "Test Name"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Name"


class TestHelpDocs:
    def test_help_docs(self, client):
        response = client.get("/api/help-docs")
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert len(data["documents"]) > 0
