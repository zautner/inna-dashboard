from __future__ import annotations

import fcntl
import json
import logging
import mimetypes
import os
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

from .config import settings
from .schedule import apply_derived_schedule_to_plan

logger = logging.getLogger(__name__)

UPLOAD_ROUTE_PREFIX = "/uploads/"
ACTIVE_QUEUE_STATUSES = {"new", "waiting_media", "draft", "rethinking"}
QUEUE_STATUS_ORDER = ["new", "waiting_media", "draft", "rethinking", "approved", "canceled", "posted"]
PLAN_ITEM_PROCESSING_STATUS = "approved"
DASHBOARD_COMMANDS = [
    {"command": "Plans", "description": "Create, edit, and manage your content plans. Set start date, requirements, and generate a structured plan."},
    {"command": "Queue", "description": "View queue items (new, waiting for media, draft, rethinking), run processing, and attach media to slots that are waiting."},
    {"command": "Process", "description": "Run AI draft generation on new queue items. Requires media to be attached to each item."},
    {"command": "Draft Review", "description": "Review AI-generated drafts. Approve to schedule, rethink with feedback, or cancel."},
    {"command": "Publishing", "description": "View scheduled, published, and failed posts. Trigger manual publishing or retry failed targets."},
    {"command": "Persona", "description": "Edit Inna's persona context: name, specialty, location, voice, target audience, forbidden words, and quotes."},
    {"command": "Monitor", "description": "See an at-a-glance dashboard health summary: queue status, publish stats, and recent activity."},
]
CHANNEL_WEBHOOKS = {
    "Instagram Feed": settings.instagram_feed_webhook_url,
    "Instagram Story": settings.instagram_story_webhook_url,
    "Instagram Reel": settings.instagram_reel_webhook_url,
    "Facebook Post": settings.facebook_post_webhook_url,
    "TikTok Video": settings.tiktok_video_webhook_url,
}
DEFAULT_INNA_CONTEXT = {
    "name": "Inna",
    "specialty": "Shiatsu & Chinese Medicine",
    "location": "Tel Aviv, Gush Dan (Givatayim, Ramat Gan, Holon, Bat Yam)",
    "philosophy": "Shiatsu is about touch and Qi flow. It's not just physical tissue; it's about helping the body heal itself by smoothing the flow of energy.",
    "voice": {
        "tone": "Warm, human, expert but accessible, no corporate jargon, first-person.",
        "forbiddenWords": ["my dear", "sweetie", "listen to me", "I know best", "final decision"],
        "style": "Short, to the point, leaving room for discussion.",
    },
    "targetAudience": "Women 40+, often with orthopedic issues (back, neck, shoulder pain), general fatigue, or lack of sleep.",
    "quotes": [
        "Shiatsu is about Qi flow. If there is smooth flow, the person feels good. If there is stagnation, we feel pain.",
        "The treatment is who you are. The difference between masters is the quality of touch.",
        "I don't believe in just massage. Only the brain can release the muscle. In Shiatsu, we create a connection with the brain.",
        "It's a dialogue between practitioner and patient.",
    ],
}


def ensure_storage() -> None:
    settings.plans_file.parent.mkdir(parents=True, exist_ok=True)
    settings.bot_queue_file.parent.mkdir(parents=True, exist_ok=True)
    settings.bot_activity_file.parent.mkdir(parents=True, exist_ok=True)
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.inna_context_file.parent.mkdir(parents=True, exist_ok=True)

    _ensure_json_file(settings.plans_file, [])
    _ensure_json_file(settings.bot_queue_file, [])
    _ensure_json_file(settings.bot_activity_file, [])
    if not settings.inna_context_file.exists():
        _write_json(settings.inna_context_file, DEFAULT_INNA_CONTEXT)


def read_queue_items(statuses: list[str] | None = None, limit: int | None = None) -> list[dict[str, Any]]:
    items = _read_json_list(settings.bot_queue_file)
    if statuses:
        normalized = {status for status in statuses if status}
        items = [item for item in items if item.get("status") in normalized]
    if limit is not None and limit >= 0:
        items = items[:limit]
    return items


def read_plans() -> list[dict[str, Any]]:
    return [normalize_plan(plan) for plan in _read_json_list(settings.plans_file)]


def read_queue_item(item_id: str) -> dict[str, Any] | None:
    for item in _read_json_list(settings.bot_queue_file):
        if str(item.get("id")) == item_id:
            return item
    return None


def read_queue_counts() -> dict[str, int]:
    counts = {status: 0 for status in QUEUE_STATUS_ORDER if status != "posted"}
    for item in _read_json_list(settings.bot_queue_file):
        status = item.get("status")
        if status in counts:
            counts[status] += 1
    counts["total"] = sum(counts.values())
    return counts


def read_queue_stats() -> dict[str, int]:
    queue = _read_json_list(settings.bot_queue_file)
    return {
        "inQueue": len([item for item in queue if item.get("status") in {"new", "waiting_media"}]),
        "draftsPending": len([item for item in queue if item.get("status") in {"draft", "rethinking"}]),
        "approved": len([item for item in queue if item.get("status") == "approved"]),
    }


def read_pending_plan_items() -> list[dict[str, Any]]:
    return [
        item
        for item in _read_json_list(settings.bot_queue_file)
        if item.get("plan_item_id") and item.get("status") in {"new", "waiting_media"}
    ]


def add_queue_item(item: dict[str, Any]) -> dict[str, Any]:
    queue = _read_json_list(settings.bot_queue_file)
    queue.append(item)
    _write_json(settings.bot_queue_file, queue)
    return item


def update_queue_item(item_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    queue = _read_json_list(settings.bot_queue_file)
    updated_item = None
    for item in queue:
        if str(item.get("id")) == item_id:
            item.update(updates)
            updated_item = item
            break
    if updated_item is not None:
        _write_json(settings.bot_queue_file, queue)
    return updated_item


def update_publish_job(item_id: str, target: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    queue = _read_json_list(settings.bot_queue_file)
    updated_item = None
    for item in queue:
        if str(item.get("id")) != item_id:
            continue
        for job in item.get("publish_jobs", []):
            if job.get("target") == target:
                job.update(updates)
                updated_item = item
                break
    if updated_item is not None:
        _write_json(settings.bot_queue_file, queue)
    return updated_item


def build_upload_queue_item(file_name: str, caption: str = "", mime_type: str = "") -> dict[str, Any]:
    item_id = str(uuid.uuid4())[:8]
    return {
        "id": item_id,
        "file_id": None,
        "file_type": infer_file_type(file_name=file_name, mime_type=mime_type),
        "caption": caption,
        "media_url": f"{UPLOAD_ROUTE_PREFIX}{file_name}",
        "status": "new",
        "generated_text": "",
        "publish_targets": [],
        "publish_jobs": [],
        "tags": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def persist_plans(plans: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized_plans = [normalize_plan(plan) for plan in plans if isinstance(plan, dict)]
    previous_plans = read_plans()
    _write_json(settings.plans_file, normalized_plans)
    sync_bot_queue(normalized_plans)
    delete_removed_uploads(previous_plans, normalized_plans)
    return normalized_plans


def read_publishing_overview() -> dict[str, Any]:
    queue = _read_json_list(settings.bot_queue_file)
    overview = {
        "scheduled": 0,
        "published": 0,
        "failed": 0,
        "approved_items": 0,
        "waiting_for_schedule": 0,
        "upcoming": [],
    }

    for item in queue:
        if item.get("status") == "approved":
            overview["approved_items"] += 1
            if not item.get("publish_at"):
                overview["waiting_for_schedule"] += 1
        if item.get("status") in {"approved", "posted"}:
            for job in item.get("publish_jobs", []):
                status = job.get("status")
                if status in {"scheduled", "published", "failed"}:
                    overview[status] += 1
        if item.get("status") == "approved" and item.get("publish_at"):
            pending_targets = [job.get("target") for job in item.get("publish_jobs", []) if job.get("status") == "scheduled"]
            if pending_targets:
                overview["upcoming"].append(
                    {
                        "id": item.get("id"),
                        "plan_name": item.get("plan_name") or "",
                        "caption": item.get("caption") or "",
                        "publish_at": item.get("publish_at"),
                        "targets": pending_targets,
                        "media_url": item.get("media_url"),
                        "publish_jobs": item.get("publish_jobs", []),
                        "status": item.get("status"),
                    }
                )

    overview["upcoming"].sort(key=lambda item: str(item.get("publish_at") or ""))
    return overview


def read_publishing_timeline(limit: int = 30) -> list[dict[str, Any]]:
    queue = _read_json_list(settings.bot_queue_file)
    timeline: list[dict[str, Any]] = []
    for item in queue:
        if item.get("status") not in {"approved", "posted"} and not item.get("publish_jobs"):
            continue
        timeline.append(
            {
                "id": item.get("id"),
                "plan_name": item.get("plan_name") or "",
                "caption": item.get("caption") or "",
                "publish_at": item.get("publish_at"),
                "status": item.get("status"),
                "media_url": item.get("media_url"),
                "generated_text": item.get("generated_text") or "",
                "publish_jobs": item.get("publish_jobs", []),
                "targets": item.get("publish_targets", []),
            }
        )
    timeline.sort(key=lambda item: str(item.get("publish_at") or ""), reverse=True)
    return timeline[:limit]


def read_bot_monitor(command_limit: int = 20, error_limit: int = 10) -> dict[str, Any]:
    queue_counts = read_queue_counts()
    publishing_overview = read_publishing_overview()
    recent_items = sorted(
        [item for item in _read_json_list(settings.bot_queue_file) if isinstance(item, dict)],
        key=lambda item: str(item.get("processed_at") or item.get("publish_at") or item.get("id") or ""),
        reverse=True,
    )[:command_limit]

    failed_items = [
        item for item in recent_items
        if item.get("status") == "canceled" or
           any(job.get("status") == "failed" for job in item.get("publish_jobs", []))
    ][:error_limit]

    open_plans = [p for p in _read_json_list(settings.plans_file) if isinstance(p, dict) and p.get("status") != "closed"]
    pending_plan_items = read_pending_plan_items()

    return {
        "queueCounts": queue_counts,
        "publishing": publishing_overview,
        "recentItems": [
            {
                "id": item.get("id"),
                "planName": item.get("plan_name") or item.get("caption") or item.get("id"),
                "status": item.get("status"),
                "generatedText": bool(item.get("generated_text")),
                "publishAt": item.get("publish_at"),
                "processedAt": item.get("processed_at"),
                "publishedAt": item.get("published_at"),
                "failedTargets": [
                    job.get("target") for job in item.get("publish_jobs", [])
                    if job.get("status") == "failed"
                ],
            }
            for item in recent_items
        ],
        "failedItems": [
            {
                "id": item.get("id"),
                "planName": item.get("plan_name") or item.get("caption") or item.get("id"),
                "status": item.get("status"),
                "reason": (
                    "Item canceled"
                    if item.get("status") == "canceled"
                    else f"Failed targets: {', '.join(j.get('target') for j in item.get('publish_jobs', []) if j.get('status') == 'failed')}"
                ),
                "processedAt": item.get("processed_at"),
                "publishAt": item.get("publish_at"),
            }
            for item in failed_items
        ],
        "openPlans": [{"id": p.get("id"), "name": p.get("name"), "itemCount": len(p.get("items", []))} for p in open_plans],
        "pendingPlanItems": pending_plan_items,
        "lastUpdatedAt": datetime.now(timezone.utc).isoformat(),
    }


def read_help_docs() -> dict[str, Any]:
    return {
        "documents": [
            {
                "id": "getting-started",
                "title": "Getting Started",
                "relativePath": None,
                "updatedAt": None,
                "available": True,
                "content": (
                    "Getting Started with Inna AI Dashboard\n"
                    "======================================\n\n"
                    "Welcome to Inna AI Dashboard — a standalone social media planning and publishing tool "
                    "that works alongside the Telegram bot without requiring Telegram at all.\n\n"
                    "Architecture Overview\n----------------------\n"
                    "By default the dashboard stores JSON and uploads under autonomous-python-dashboard/data/:\n"
                    "  • media_queue.json  — content queue\n"
                    "  • plans.json        — saved content plans\n"
                    "  • activity.json     — activity log\n"
                    "  • inna-context.json — persona and voice configuration\n"
                    "  • uploads/          — uploaded photos and videos\n\n"
                    "Point PLANS_FILE, BOT_QUEUE_FILE, and related env vars at the bot's paths if you need one shared store.\n\n"
                    "Queue Lifecycle\n----------------\n"
                    "1. Approve slots on the Plans page (or use the bot) → items enter the queue as 'new'\n"
                    "2. Click 'Process New Items'           → AI generates draft text → status becomes 'draft'\n"
                    "3. Review the draft in Queue page      → Approve / Rethink / Cancel\n"
                    "4. Approved items get a publish date   → status becomes 'approved'\n"
                    "5. The bot publishes automatically when the time comes → status becomes 'posted'\n\n"
                    "Plans\n------\n"
                    "Use Plan Studio to build content schedules (week / month / quarter).\n"
                    "Set a start date, add requirements (day + media type + platforms), and click Generate Plan.\n"
                    "Items need media before they can be processed. Upload directly in the plan editor.\n"
                    "Save the plan → it syncs into the shared queue when you approve items.\n\n"
                    "Publishing Targets\n-------------------\n"
                    "Each queue item can target one or more platforms:\n"
                    "  Instagram Feed, Instagram Story, Instagram Reel,\n"
                    "  Facebook Post, TikTok Video\n\n"
                    "Publish webhooks must be configured in your settings for each platform.\n"
                    "Contact your administrator if posts are not reaching the platforms.\n"
                ),
            },
            {
                "id": "queue-states",
                "title": "Queue States Explained",
                "relativePath": None,
                "updatedAt": None,
                "available": True,
                "content": (
                    "Queue Item Status Reference\n"
                    "============================\n\n"
                    "new           — Item created, waiting for AI processing. Must have media attached.\n"
                    "waiting_media — Item requires media to be attached before it can be processed.\n"
                    "draft         — AI has generated a post text. Ready for human review.\n"
                    "rethinking    — Draft was rejected; feedback has been sent back to the AI.\n"
                    "approved      — Draft accepted; item will be published at the scheduled time.\n"
                    "canceled      — Item removed from the queue without publishing.\n"
                    "posted        — Item has been successfully published to all configured targets.\n"
                ),
            },
            {
                "id": "schedule-reference",
                "title": "Schedule Reference",
                "relativePath": None,
                "updatedAt": None,
                "available": True,
                "content": (
                    "Day Label Reference\n"
                    "====================\n\n"
                    "When setting the 'day' field for a plan item, you can use:\n\n"
                    "Plain weekdays:\n"
                    "  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday\n"
                    "  (also: Mon, Tue, Wed, Thu, Fri, Sat, Sun)\n\n"
                    "Week offset:\n"
                    "  Week 1, Week 2, Week 3, ...   (counts 7 days per week from start date)\n\n"
                    "Week offset + weekday:\n"
                    "  Week 1 - Monday, Week 2 - Friday\n\n"
                    "Day number:\n"
                    "  Day 1, Day 2, Day 3, ...  (1 = start date)\n\n"
                    "Month view:\n"
                    "  Month 1 - Week 1 - Monday\n"
                    "  Month 2 - Week 3\n\n"
                    "Examples:\n"
                    "  Plan starts on 2025-04-07 (Monday)\n"
                    "  'Friday'          → 2025-04-11\n"
                    "  'Week 2'          → 2025-04-14\n"
                    "  'Week 1 - Monday' → 2025-04-07\n"
                    "  'Day 3'           → 2025-04-09\n"
                ),
            },
            {
                "id": "webhook-config",
                "title": "Webhook & Platform Setup",
                "relativePath": None,
                "updatedAt": None,
                "available": True,
                "content": (
                    "Webhook Configuration\n"
                    "=====================\n\n"
                    "Publishing targets require webhook URLs to be configured.\n"
                    "Each platform maps to a specific webhook in your environment:\n\n"
                    "  Instagram Feed   → INSTAGRAM_FEED_WEBHOOK_URL\n"
                    "  Instagram Story  → INSTAGRAM_STORY_WEBHOOK_URL\n"
                    "  Instagram Reel   → INSTAGRAM_REEL_WEBHOOK_URL\n"
                    "  Facebook Post    → FACEBOOK_POST_WEBHOOK_URL\n"
                    "  TikTok Video     → TIKTOK_VIDEO_WEBHOOK_URL\n\n"
                    "When a publish job executes, the dashboard sends a POST request to the "
                    "configured webhook with the queue item data.\n\n"
                    "If 'Publish Due Items' shows 0 published and 0 failed, check:\n"
                    "  1. That approved items exist with a past publish_at timestamp\n"
                    "  2. That webhook URLs are configured and reachable\n"
                    "  3. That the bot log does not show connection errors\n"
                ),
            },
        ]
    }


def read_inna_context() -> dict[str, Any]:
    raw = _read_json_object(settings.inna_context_file)
    return _normalize_inna_context(raw)


def write_inna_context(value: dict[str, Any]) -> dict[str, Any]:
    normalized = _normalize_inna_context(value)
    _write_json(settings.inna_context_file, normalized)
    return normalized


def list_bot_commands() -> list[dict[str, str]]:
    return deepcopy(DASHBOARD_COMMANDS)


def normalize_plan(plan: dict[str, Any]) -> dict[str, Any]:
    normalized = {
        "id": str(plan.get("id") or uuid.uuid4()),
        "name": str(plan.get("name") or "Untitled Plan"),
        "type": plan.get("type") if plan.get("type") in {"week", "month", "quarter"} else "week",
        "status": "closed" if plan.get("status") == "closed" else "open",
        "startDate": plan.get("startDate"),
        "items": [],
    }

    raw_items = plan.get("items") if isinstance(plan.get("items"), list) else []
    for index, item in enumerate(raw_items):
        if not isinstance(item, dict):
            continue
        content_types = item.get("contentTypes") if isinstance(item.get("contentTypes"), list) and item.get("contentTypes") else ["Instagram Feed"]
        normalized["items"].append(
            {
                "id": str(item.get("id") or f"{normalized['id']}-{index}"),
                "day": str(item.get("day") or ""),
                "publishAt": item.get("publishAt") if isinstance(item.get("publishAt"), str) else None,
                "mediaType": item.get("mediaType") if item.get("mediaType") in {"photo", "video", "any"} else "any",
                "uploadedMediaType": item.get("uploadedMediaType") if item.get("uploadedMediaType") in {"photo", "video"} else infer_uploaded_media_type(item.get("mediaUrl"), item.get("mediaType")),
                "contentTypes": [str(content_type) for content_type in content_types],
                "status": item.get("status") if item.get("status") in {"preparing", "waiting for approval", "approved", "posted", "canceled"} else "preparing",
                "mediaUrl": item.get("mediaUrl") if isinstance(item.get("mediaUrl"), str) else None,
                "tags": [str(tag) for tag in item.get("tags", []) if isinstance(tag, str)],
            }
        )
    return apply_derived_schedule_to_plan(normalized)


def publish_due_items() -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    queue = _read_json_list(settings.bot_queue_file)
    published = 0
    failed = 0
    details: list[dict[str, Any]] = []
    changed = False

    for item in queue:
        if item.get("status") != "approved":
            continue
        publish_at = parse_iso_datetime(item.get("publish_at"))
        if not publish_at or publish_at > now:
            continue

        for job in item.get("publish_jobs", []):
            if job.get("status") != "scheduled":
                continue
            target = str(job.get("target") or "")
            attempts = int(job.get("attempts", 0)) + 1
            try:
                response = _publish_via_webhook(target, item)
                job.update(
                    {
                        "status": "published",
                        "attempts": attempts,
                        "last_error": None,
                        "last_attempt_at": now.isoformat(),
                        "published_at": now.isoformat(),
                        "response": response,
                    }
                )
                published += 1
                changed = True
                details.append({"item_id": item.get("id"), "target": target, "status": "published"})
            except Exception as exc:  # noqa: BLE001
                logger.error("Publish failed for item %s → %s: %s", item.get("id"), target, exc)
                job.update(
                    {
                        "status": "failed",
                        "attempts": attempts,
                        "last_error": str(exc),
                        "last_attempt_at": now.isoformat(),
                    }
                )
                failed += 1
                changed = True
                details.append({"item_id": item.get("id"), "target": target, "status": "failed", "error": str(exc)})

        if item.get("publish_jobs") and all(job.get("status") == "published" for job in item.get("publish_jobs", [])):
            item["status"] = "posted"
            item["published_at"] = now.isoformat()
            changed = True
            if item.get("plan_item_id"):
                mark_plan_item_posted(str(item["plan_item_id"]))

    if changed:
        _write_json(settings.bot_queue_file, queue)

    return {"published": published, "failed": failed, "details": details}


def sync_bot_queue(plans: list[dict[str, Any]]) -> None:
    existing_queue = _read_json_list(settings.bot_queue_file)
    desired_plan_items: dict[str, dict[str, Any]] = {}

    for plan in plans:
        for item in plan.get("items", []):
            media_url = normalize_upload_url(item.get("mediaUrl"))
            if item.get("status") != PLAN_ITEM_PROCESSING_STATUS or not media_url:
                continue

            publish_targets = list(dict.fromkeys(item.get("contentTypes", [])))
            existing_queue_item = next((queue_item for queue_item in existing_queue if queue_item.get("plan_item_id") == item.get("id")), None)

            desired_plan_items[str(item["id"])] = {
                "plan_item_id": item["id"],
                "plan_id": plan["id"],
                "plan_name": plan["name"],
                "file_id": None,
                "file_type": item.get("uploadedMediaType") or infer_file_type(file_name=media_url) or ("photo" if item.get("mediaType") == "any" else item.get("mediaType")),
                "caption": build_plan_item_caption(plan["name"], item),
                "media_url": media_url,
                "publish_at": item.get("publishAt"),
                "publish_targets": publish_targets,
                "publish_jobs": merge_publish_jobs(existing_queue_item.get("publish_jobs") if existing_queue_item else None, publish_targets),
                "status": "new",
                "generated_text": "",
                "tags": item.get("tags", []),
            }

    next_queue = []
    orphaned_media: list[str] = []
    remaining_desired_ids = set(desired_plan_items.keys())

    for queue_item in existing_queue:
        if not queue_item.get("plan_item_id"):
            next_queue.append(queue_item)
            continue

        desired = desired_plan_items.get(str(queue_item.get("plan_item_id")))
        if not desired:
            media_url = queue_item.get("media_url")
            if media_url:
                orphaned_media.append(media_url)
            continue

        next_queue.append(
            {
                **queue_item,
                **desired,
                "id": queue_item.get("id") or f"pi-{str(queue_item.get('plan_item_id'))[-8:]}",
                "status": queue_item.get("status") or desired["status"],
                "generated_text": queue_item.get("generated_text") or desired["generated_text"],
                "file_id": queue_item.get("file_id") or desired["file_id"],
            }
        )
        remaining_desired_ids.discard(str(queue_item.get("plan_item_id")))

    for plan_item_id in remaining_desired_ids:
        desired = desired_plan_items[plan_item_id]
        next_queue.append({"id": f"pi-{plan_item_id[-8:]}", **desired})

    _write_json(settings.bot_queue_file, next_queue)

    # Delete media files from orphaned queue items (e.g. deleted plans)
    # Collect all media_url values still referenced by remaining queue items
    surviving_urls = {qi.get("media_url") for qi in next_queue if qi.get("media_url")}
    for media_url in orphaned_media:
        if media_url in surviving_urls:
            continue
        file_path = get_upload_file_path(media_url)
        if file_path and file_path.exists() and file_path.is_file():
            file_path.unlink()
            logger.info("Deleted orphaned media: %s", file_path.name)


def retry_publish_target(item_id: str, target: str) -> dict[str, Any]:
    item = read_queue_item(item_id)
    if not item:
        raise ValueError("Queue item not found.")

    for job in item.get("publish_jobs", []):
        if job.get("target") == target:
            job["status"] = "scheduled"
            job["last_error"] = None
            break
    else:
        raise ValueError("Publish target not found on queue item.")

    update_queue_item(item_id, {"publish_jobs": item.get("publish_jobs", [])})
    return publish_due_items()


def mark_plan_item_posted(plan_item_id: str) -> None:
    plans = _read_json_list(settings.plans_file)
    changed = False
    for plan in plans:
        for item in plan.get("items", []):
            if str(item.get("id")) == plan_item_id:
                item["status"] = "posted"
                changed = True
                break
        if changed:
            break
    if changed:
        _write_json(settings.plans_file, plans)


def infer_file_type(file_name: str = "", mime_type: str = "") -> str:
    if mime_type.startswith("video/"):
        return "video"
    if mime_type.startswith("image/"):
        return "photo"
    guessed, _ = mimetypes.guess_type(file_name)
    guessed = guessed or ""
    if guessed.startswith("video/"):
        return "video"
    return "photo"


def infer_uploaded_media_type(media_url: Any = None, media_type: Any = None) -> str | None:
    if isinstance(media_url, str):
        lower = media_url.lower()
        if any(lower.endswith(ext) for ext in [".mp4", ".mov", ".avi", ".mkv", ".webm"]):
            return "video"
        if any(lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]):
            return "photo"
    if media_type in {"photo", "video"}:
        return media_type
    return None


def normalize_upload_url(media_url: Any) -> str | None:
    if not isinstance(media_url, str) or not media_url.startswith(UPLOAD_ROUTE_PREFIX):
        return None
    file_name = Path(media_url).name
    if not file_name or file_name in {".", ".."}:
        return None
    return f"{UPLOAD_ROUTE_PREFIX}{file_name}"


def get_upload_file_path(media_url: Any) -> Path | None:
    normalized = normalize_upload_url(media_url)
    if not normalized:
        return None
    return settings.uploads_dir / Path(normalized).name


def collect_upload_urls(plans: list[dict[str, Any]]) -> set[str]:
    urls: set[str] = set()
    for plan in plans:
        for item in plan.get("items", []):
            media_url = normalize_upload_url(item.get("mediaUrl"))
            if media_url:
                urls.add(media_url)
    return urls


def delete_removed_uploads(previous_plans: list[dict[str, Any]], next_plans: list[dict[str, Any]]) -> None:
    previous_urls = collect_upload_urls(previous_plans)
    next_urls = collect_upload_urls(next_plans)
    for media_url in previous_urls:
        if media_url in next_urls:
            continue
        file_path = get_upload_file_path(media_url)
        if file_path and file_path.exists() and file_path.is_file():
            file_path.unlink()


def build_plan_item_caption(plan_name: str, item: dict[str, Any]) -> str:
    tags = f" | Tags: {', '.join(item.get('tags', []))}" if item.get("tags") else ""
    publish_at = f" | Publish: {item['publishAt']}" if item.get("publishAt") else ""
    content_types = ", ".join(item.get("contentTypes", []))
    return f"Plan: {plan_name} | {item.get('day', '')} | {content_types}{tags}{publish_at}"


def merge_publish_jobs(existing_publish_jobs: Any, publish_targets: list[str]) -> list[dict[str, Any]]:
    existing_by_target = {}
    if isinstance(existing_publish_jobs, list):
        for job in existing_publish_jobs:
            if isinstance(job, dict) and isinstance(job.get("target"), str):
                existing_by_target[job["target"]] = job

    merged = []
    for target in publish_targets:
        existing = existing_by_target.get(target)
        if existing:
            merged.append({**existing, "target": target})
        else:
            merged.append(
                {
                    "target": target,
                    "status": "scheduled",
                    "attempts": 0,
                    "last_error": None,
                    "published_at": None,
                }
            )
    return merged


def parse_iso_datetime(value: Any) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _publish_via_webhook(target: str, item: dict[str, Any]) -> dict[str, Any]:
    webhook_url = CHANNEL_WEBHOOKS.get(target, "")
    if not webhook_url:
        raise RuntimeError(f"No publishing webhook configured for {target}")

    payload = {
        "queue_item_id": item.get("id"),
        "plan_item_id": item.get("plan_item_id"),
        "plan_id": item.get("plan_id"),
        "plan_name": item.get("plan_name"),
        "target": target,
        "publish_at": item.get("publish_at"),
        "caption": item.get("caption"),
        "generated_text": item.get("generated_text"),
        "media_url": build_public_media_url(item),
        "file_type": item.get("file_type"),
        "tags": item.get("tags", []),
    }

    request = urllib_request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8", errors="ignore")
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(f"Webhook returned status {response.status}: {body}")
            return {"status": response.status, "body": body[:500]}
    except (urllib_error.HTTPError, urllib_error.URLError) as exc:
        raise RuntimeError(str(exc)) from exc


def build_public_media_url(item: dict[str, Any]) -> str | None:
    media_url = item.get("media_url")
    if not isinstance(media_url, str) or not media_url:
        return None
    if media_url.startswith("http://") or media_url.startswith("https://"):
        return media_url
    if settings.app_url and media_url.startswith("/"):
        return f"{settings.app_url}{media_url}"
    return media_url


def _read_json_list(file_path: Path) -> list[dict[str, Any]]:
    if not file_path.exists():
        return []
    try:
        with file_path.open("r", encoding="utf-8") as handle:
            parsed = json.load(handle)
        return parsed if isinstance(parsed, list) else []
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to read JSON list from %s: %s", file_path, exc)
        return []


def _read_json_object(file_path: Path) -> dict[str, Any]:
    if not file_path.exists():
        return {}
    try:
        with file_path.open("r", encoding="utf-8") as handle:
            parsed = json.load(handle)
        return parsed if isinstance(parsed, dict) else {}
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to read JSON object from %s: %s", file_path, exc)
        return {}


def _write_json(file_path: Path, payload: Any) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = file_path.with_suffix(file_path.suffix + ".lock")
    with open(lock_path, "w") as lock_handle:
        fcntl.flock(lock_handle, fcntl.LOCK_EX)
        try:
            with NamedTemporaryFile("w", encoding="utf-8", delete=False, dir=file_path.parent) as handle:
                json.dump(payload, handle, ensure_ascii=False, indent=2)
                handle.flush()
                temp_name = handle.name
            os.replace(temp_name, file_path)
        finally:
            fcntl.flock(lock_handle, fcntl.LOCK_UN)


def _ensure_json_file(file_path: Path, fallback: Any) -> None:
    if not file_path.exists():
        _write_json(file_path, fallback)


def _normalize_inna_context(value: Any) -> dict[str, Any]:
    source = value if isinstance(value, dict) else {}
    voice = source.get("voice") if isinstance(source.get("voice"), dict) else {}

    def as_string(raw: Any, fallback: str) -> str:
        return raw.strip() if isinstance(raw, str) and raw.strip() else fallback

    def as_string_list(raw: Any, fallback: list[str]) -> list[str]:
        if not isinstance(raw, list):
            return list(fallback)
        cleaned = [item.strip() for item in raw if isinstance(item, str) and item.strip()]
        return cleaned if cleaned else list(fallback)

    return {
        "name": as_string(source.get("name"), DEFAULT_INNA_CONTEXT["name"]),
        "specialty": as_string(source.get("specialty"), DEFAULT_INNA_CONTEXT["specialty"]),
        "location": as_string(source.get("location"), DEFAULT_INNA_CONTEXT["location"]),
        "philosophy": as_string(source.get("philosophy"), DEFAULT_INNA_CONTEXT["philosophy"]),
        "voice": {
            "tone": as_string(voice.get("tone"), DEFAULT_INNA_CONTEXT["voice"]["tone"]),
            "forbiddenWords": as_string_list(voice.get("forbiddenWords"), DEFAULT_INNA_CONTEXT["voice"]["forbiddenWords"]),
            "style": as_string(voice.get("style"), DEFAULT_INNA_CONTEXT["voice"]["style"]),
        },
        "targetAudience": as_string(source.get("targetAudience"), DEFAULT_INNA_CONTEXT["targetAudience"]),
        "quotes": as_string_list(source.get("quotes"), DEFAULT_INNA_CONTEXT["quotes"]),
    }
