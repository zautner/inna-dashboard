from __future__ import annotations

import logging
import shutil
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Any
from urllib import parse as urllib_parse

from fastapi import FastAPI, File, Form, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from .config import settings
from .gemini_service import generate_post_from_server, load_media_bytes
from .storage import (
    add_queue_item,
    build_upload_queue_item,
    ensure_storage,
    list_bot_commands,
    persist_plans,
    publish_due_items,
    read_bot_monitor,
    read_help_docs,
    read_inna_context,
    read_pending_plan_items,
    read_plans,
    read_publishing_overview,
    read_publishing_timeline,
    read_queue_counts,
    read_queue_item,
    read_queue_items,
    read_queue_stats,
    retry_publish_target,
    update_queue_item,
    write_inna_context,
)

logger = logging.getLogger(__name__)

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB


class QueueActionPayload(BaseModel):
    action: str
    feedback: str | None = None


class ProcessPayload(BaseModel):
    batch_size: int | None = None


class InnaContextPayload(BaseModel):
    name: str | None = None
    specialty: str | None = None
    location: str | None = None
    philosophy: str | None = None
    voice: dict[str, Any] | None = None
    targetAudience: str | None = None
    quotes: list[str] | None = None


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_storage()
    logger.info("Dashboard started — data_dir=%s batch_size=%d", settings.data_dir, settings.batch_size)
    yield
    logger.info("Dashboard shutting down")


app = FastAPI(title="Inna AI Dashboard", lifespan=lifespan)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

_ALLOWED_ORIGINS = [o.strip() for o in (settings.app_url or "http://localhost:8090").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next) -> Response:
    start = time.monotonic()
    response: Response = await call_next(request)
    elapsed_ms = (time.monotonic() - start) * 1000
    logger.info("%s %s %d %.0fms", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


templates = Jinja2Templates(directory=str(settings.autonomous_root / "templates"))

app.mount("/static", StaticFiles(directory=str(settings.autonomous_root / "static")), name="static")
app.mount("/uploads", StaticFiles(directory=str(settings.uploads_dir)), name="uploads")


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "app_name": "Inna AI Dashboard",
            "batch_size": settings.batch_size,
            "data_root": str(settings.data_dir),
        },
    )


@app.get("/api/health")
async def health() -> dict[str, Any]:
    storage_writable = _check_storage_writable()
    return {
        "ok": storage_writable and bool(settings.gemini_api_key),
        "batchSize": settings.batch_size,
        "queueFile": str(settings.bot_queue_file),
        "uploadsDir": str(settings.uploads_dir),
        "storageWritable": storage_writable,
        "geminiKeyPresent": bool(settings.gemini_api_key),
    }


@app.get("/api/ready")
async def readiness() -> dict[str, Any]:
    storage_writable = _check_storage_writable()
    if not storage_writable:
        raise HTTPException(status_code=503, detail="Storage directory is not writable.")
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")
    return {"ready": True}


@app.get("/api/queue-items")
async def queue_items(
    status: str | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1, le=200),
) -> dict[str, Any]:
    statuses = [part.strip() for part in status.split(",")] if status else None
    items = read_queue_items(statuses=statuses, limit=limit)
    return {"items": items, "pendingPlanItems": read_pending_plan_items()}


@app.get("/api/queue-counts")
async def queue_counts() -> dict[str, int]:
    return read_queue_counts()


@app.get("/api/queue-stats")
async def queue_stats() -> dict[str, int]:
    return read_queue_stats()


@app.get("/api/plans")
async def plans() -> list[dict[str, Any]]:
    return read_plans()


@app.post("/api/plans")
async def save_plans(payload: list[dict[str, Any]]) -> dict[str, Any]:
    persisted = persist_plans(payload)
    logger.info("Saved %d plans", len(persisted))
    return {"success": True, "plans": persisted}


@app.get("/api/inna-context")
async def inna_context() -> dict[str, Any]:
    return read_inna_context()


@app.put("/api/inna-context")
async def save_inna_context(payload: InnaContextPayload) -> dict[str, Any]:
    return write_inna_context(payload.model_dump(exclude_none=True))


@app.get("/api/bot-monitor")
async def bot_monitor() -> dict[str, Any]:
    monitor = read_bot_monitor()
    monitor["timeline"] = read_publishing_timeline()
    return monitor


@app.get("/api/publishing-overview")
async def publishing_overview() -> dict[str, Any]:
    overview = read_publishing_overview()
    overview["timeline"] = read_publishing_timeline()
    return overview


@app.get("/api/bot-commands")
async def bot_commands() -> dict[str, Any]:
    return {"commands": list_bot_commands()}


@app.get("/api/help-docs")
async def help_docs() -> dict[str, Any]:
    return read_help_docs()


@app.post("/api/media/upload")
async def media_upload(
    file: Annotated[UploadFile, File(...)],
    caption: Annotated[str, Form()] = "",
) -> dict[str, Any]:
    _check_upload_size(file)
    saved_name = _save_upload(file)
    item = build_upload_queue_item(saved_name, caption=caption, mime_type=file.content_type or "")
    add_queue_item(item)
    logger.info("Uploaded media %s → queue item %s", saved_name, item["id"])
    return {"url": f"/uploads/{saved_name}", "queueItemId": item["id"], "item": item}


@app.post("/api/queue-items/{item_id}/attach-media")
async def attach_media(
    item_id: str,
    file: Annotated[UploadFile, File(...)],
    caption: Annotated[str, Form()] = "",
) -> dict[str, Any]:
    item = read_queue_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found.")
    if item.get("status") != "waiting_media":
        raise HTTPException(status_code=400, detail="Queue item is not waiting for media.")

    _check_upload_size(file)
    saved_name = _save_upload(file)
    updated = update_queue_item(
        item_id,
        {
            "media_url": f"/uploads/{saved_name}",
            "file_type": "video" if (file.content_type or "").startswith("video/") else "photo",
            "caption": caption or item.get("caption", ""),
            "status": "new",
        },
    )
    return {"item": updated}


@app.post("/api/process")
async def process_queue(payload: ProcessPayload | None = None) -> dict[str, Any]:
    batch_size = payload.batch_size if payload and payload.batch_size else settings.batch_size
    new_items = read_queue_items(statuses=["new"], limit=batch_size)
    if not new_items:
        return {"processed": 0, "withMedia": 0, "waitingForMedia": 0, "items": []}

    processed = 0
    with_media = 0
    waiting_for_media = 0
    results: list[dict[str, Any]] = []

    for item in new_items:
        if item.get("file_id") or item.get("media_url"):
            results.append(await _process_item(item))
            processed += 1
            with_media += 1
        else:
            waiting_for_media += 1
            updated = update_queue_item(item["id"], {"status": "waiting_media"})
            if updated:
                results.append(updated)

    logger.info("Processed batch: %d items (%d with media, %d waiting)", processed + waiting_for_media, with_media, waiting_for_media)
    return {
        "processed": processed,
        "withMedia": with_media,
        "waitingForMedia": waiting_for_media,
        "items": results,
    }


@app.post("/api/queue-items/{item_id}/action")
async def queue_item_action(item_id: str, payload: QueueActionPayload) -> dict[str, Any]:
    item = read_queue_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found.")

    action = payload.action.strip().lower()
    if action == "approve":
        updated = update_queue_item(item_id, {"status": "approved"})
        publish_result = publish_due_items()
        logger.info("Approved item %s", item_id)
        return {"item": updated, "publishResult": publish_result}

    if action == "cancel":
        updated = update_queue_item(item_id, {"status": "canceled"})
        logger.info("Canceled item %s", item_id)
        return {"item": updated}

    if action == "rethink":
        if not payload.feedback or not payload.feedback.strip():
            updated = update_queue_item(item_id, {"status": "rethinking", "rethink_feedback": ""})
            return {"item": updated}
        updated = await _process_item(item, feedback=payload.feedback.strip())
        logger.info("Rethinking item %s with feedback", item_id)
        return {"item": updated}

    raise HTTPException(status_code=400, detail="Unsupported action.")


@app.post("/api/publish-now")
async def publish_now() -> dict[str, Any]:
    result = publish_due_items()
    logger.info("Manual publish: %d published, %d failed", result.get("published", 0), result.get("failed", 0))
    return result


@app.post("/api/queue-items/{item_id}/publish-jobs/{target}/retry")
async def retry_target(item_id: str, target: str) -> dict[str, Any]:
    decoded = urllib_parse.unquote(target)
    try:
        return retry_publish_target(item_id, decoded)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _process_item(item: dict[str, Any], feedback: str | None = None) -> dict[str, Any]:
    try:
        media_bytes, mime_type, _media_path = load_media_bytes(item)
        generated_text = generate_post_from_server(
            media_bytes,
            mime_type,
            original_caption=item.get("caption"),
            previous_draft=item.get("generated_text") if feedback else None,
            feedback=feedback,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    updated = update_queue_item(
        str(item["id"]),
        {
            "status": "draft",
            "generated_text": generated_text,
            "rethink_feedback": feedback or item.get("rethink_feedback", ""),
            "processed_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Queue item disappeared during processing.")
    return updated


def _save_upload(file: UploadFile) -> str:
    content_type = file.content_type or ""
    if not (content_type.startswith("image/") or content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="Only image and video files are allowed.")

    suffix = Path(file.filename or "").suffix.lower()
    saved_name = f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}{suffix}"
    target_path = settings.uploads_dir / saved_name
    with target_path.open("wb") as destination:
        shutil.copyfileobj(file.file, destination)
    return saved_name


def _check_upload_size(file: UploadFile) -> None:
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024 * 1024)} MB.")


def _check_storage_writable() -> bool:
    try:
        probe = settings.uploads_dir / ".probe"
        probe.touch()
        probe.unlink()
        return True
    except OSError:
        return False
