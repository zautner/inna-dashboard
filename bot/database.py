import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

# The JSON file used as a lightweight database for the media queue
DB_FILE = os.getenv("BOT_QUEUE_FILE", str(Path(__file__).with_name("media_queue.json")))
ACTIVITY_FILE = os.getenv("BOT_ACTIVITY_FILE", str(Path(__file__).with_name("bot_activity.json")))
PLANS_FILE = os.getenv("PLANS_FILE", str(Path(__file__).resolve().parent.parent / "plans.json"))
ACTIVITY_LIMIT = int(os.getenv("BOT_ACTIVITY_LIMIT", "250"))

def load_db() -> list:
    """Loads all media items from the JSON database file."""
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_db(data: list):
    """Saves the provided list of media items to the JSON database file."""
    Path(DB_FILE).parent.mkdir(parents=True, exist_ok=True)
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_activity() -> list:
    """Loads bot activity entries from the activity log file."""
    if not os.path.exists(ACTIVITY_FILE):
        return []
    with open(ACTIVITY_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_activity(entries: list):
    """Persists bot activity entries with a bounded history."""
    Path(ACTIVITY_FILE).parent.mkdir(parents=True, exist_ok=True)
    bounded_entries = entries[-ACTIVITY_LIMIT:]
    with open(ACTIVITY_FILE, "w", encoding="utf-8") as f:
        json.dump(bounded_entries, f, ensure_ascii=False, indent=2)

def add_media(file_id: str, file_type: str, caption: str) -> str:
    """
    Adds a newly uploaded photo or video to the queue.
    Status starts as 'new'.
    """
    db = load_db()
    item_id = str(uuid.uuid4())[:8]
    db.append({
        "id": item_id,
        "file_id": file_id,
        "file_type": file_type,
        "caption": caption,
        "status": "new", # new, draft, rethinking, approved, canceled
        "generated_text": ""
    })
    save_db(db)
    return item_id


def add_activity_entry(entry: dict) -> dict:
    """Appends a single command/error activity entry to the activity log."""
    entries = load_activity()
    normalized_entry = {
        "id": entry.get("id", str(uuid.uuid4())[:8]),
        "timestamp": entry.get("timestamp", datetime.now(timezone.utc).isoformat()),
        **entry,
    }
    entries.append(normalized_entry)
    save_activity(entries)
    return normalized_entry


def log_command(command: str, outcome: str, summary: str, details: str = "", severity: str = "info", chat_id: int = None, metadata: dict = None) -> dict:
    """Logs the result of a Telegram bot command invocation."""
    return add_activity_entry({
        "kind": "command",
        "command": command,
        "outcome": outcome,
        "severity": severity,
        "summary": summary,
        "details": details,
        "chat_id": chat_id,
        "metadata": metadata or {},
    })


def log_severe_error(source: str, summary: str, details: str = "", severity: str = "error", chat_id: int = None, command: str = None, item_id: str = None, metadata: dict = None) -> dict:
    """Logs a severe bot error that should be visible in the dashboard monitor."""
    return add_activity_entry({
        "kind": "error",
        "source": source,
        "command": command,
        "item_id": item_id,
        "severity": severity,
        "summary": summary,
        "details": details,
        "chat_id": chat_id,
        "metadata": metadata or {},
    })

def get_items_by_status(status: str, limit: int = None) -> list:
    """Retrieves items matching a specific status, up to an optional limit."""
    db = load_db()
    items = [item for item in db if item.get("status") == status]
    if limit:
        return items[:limit]
    return items


def get_all_items() -> list:
    """Returns the full queue."""
    return load_db()


def get_status_counts() -> dict:
    """Returns counts of queue items per status."""
    counts = {
        "new": 0,
        "waiting_media": 0,
        "draft": 0,
        "rethinking": 0,
        "approved": 0,
        "canceled": 0,
    }
    for item in load_db():
        status = item.get("status")
        if status in counts:
            counts[status] += 1
    counts["total"] = sum(counts.values())
    return counts


def get_publication_counts() -> dict:
    """Returns counts of scheduled/published/failed publish jobs across the queue."""
    counts = {
        "scheduled": 0,
        "published": 0,
        "failed": 0,
        "waiting_for_schedule": 0,
        "approved_items": 0,
    }
    for item in load_db():
        if item.get("status") == "approved":
            counts["approved_items"] += 1
            if not item.get("publish_at"):
                counts["waiting_for_schedule"] += 1
        if item.get("status") in {"approved", "posted"}:
            for job in item.get("publish_jobs", []):
                status = job.get("status")
                if status in counts:
                    counts[status] += 1
    return counts


def get_publication_preview(limit: int = 5) -> list:
    """Returns the next scheduled publication items."""
    items = [
        item for item in load_db()
        if item.get("status") == "approved" and item.get("publish_at")
        and any(job.get("status") == "scheduled" for job in item.get("publish_jobs", []))
    ]
    items.sort(key=lambda item: item.get("publish_at", ""))
    return items[:limit]


def get_items_ready_for_publish(now: datetime = None) -> list:
    """Returns approved queue items whose scheduled publish time has arrived."""
    current_time = now or datetime.now(timezone.utc)
    ready_items = []
    for item in load_db():
        if item.get("status") != "approved":
            continue
        publish_at = parse_iso_datetime(item.get("publish_at"))
        if not publish_at or publish_at > current_time:
            continue
        if any(job.get("status") == "scheduled" for job in item.get("publish_jobs", [])):
            ready_items.append(item)
    return ready_items


def get_queue_preview(limit: int = 5) -> list:
    """Returns a short preview of active queue items."""
    active_statuses = {"new", "waiting_media", "draft", "rethinking"}
    items = [item for item in load_db() if item.get("status") in active_statuses]
    return items[:limit]

def update_item(item_id: str, updates: dict):
    """Updates specific fields of an item in the database."""
    db = load_db()
    for item in db:
        if item["id"] == item_id:
            item.update(updates)
            break
    save_db(db)


def update_publish_job(item_id: str, target: str, updates: dict) -> dict:
    """Updates a single publish job for a queue item and returns the updated item."""
    db = load_db()
    updated_item = None
    for item in db:
        if item["id"] != item_id:
            continue
        publish_jobs = item.get("publish_jobs", [])
        for job in publish_jobs:
            if job.get("target") == target:
                job.update(updates)
                updated_item = item
                break
        if updated_item:
            break
    save_db(db)
    return updated_item

def get_item(item_id: str) -> dict:
    """Retrieves a single item by its ID."""
    db = load_db()
    for item in db:
        if item["id"] == item_id:
            return item
    return None


def mark_plan_item_posted(plan_item_id: str):
    """Marks a plan item as posted in plans.json after all publish targets succeed."""
    if not os.path.exists(PLANS_FILE):
        return
    with open(PLANS_FILE, "r", encoding="utf-8") as f:
        try:
            plans = json.load(f)
        except json.JSONDecodeError:
            return

    changed = False
    for plan in plans:
        for item in plan.get("items", []):
            if item.get("id") == plan_item_id:
                item["status"] = "posted"
                changed = True
                break
        if changed:
            break

    if changed:
        Path(PLANS_FILE).parent.mkdir(parents=True, exist_ok=True)
        with open(PLANS_FILE, "w", encoding="utf-8") as f:
            json.dump(plans, f, ensure_ascii=False, indent=2)

def get_pending_plan_items() -> list:
    """Returns plan-sourced items that are waiting for media to be supplied by Inna."""
    db = load_db()
    return [
        item for item in db
        if item.get("plan_item_id") and item.get("status") in ("new", "waiting_media")
    ]


def get_recent_command_activity(limit: int = 20) -> list:
    """Returns the most recent command status entries, newest first."""
    commands = [entry for entry in load_activity() if entry.get("kind") == "command"]
    commands.sort(key=lambda entry: entry.get("timestamp", ""), reverse=True)
    return commands[:limit]


def get_recent_severe_errors(limit: int = 10) -> list:
    """Returns the most recent severe errors, newest first."""
    errors = [entry for entry in load_activity() if entry.get("kind") == "error"]
    errors.sort(key=lambda entry: entry.get("timestamp", ""), reverse=True)
    return errors[:limit]


def parse_iso_datetime(value: str | None) -> datetime | None:
    """Parses an ISO datetime string into an aware UTC datetime when possible."""
    if not value or not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


