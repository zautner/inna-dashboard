import json
import os
import uuid

# The JSON file used as a lightweight database for the media queue
DB_FILE = "media_queue.json"

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
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

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

def get_items_by_status(status: str, limit: int = None) -> list:
    """Retrieves items matching a specific status, up to an optional limit."""
    db = load_db()
    items = [item for item in db if item.get("status") == status]
    if limit:
        return items[:limit]
    return items

def update_item(item_id: str, updates: dict):
    """Updates specific fields of an item in the database."""
    db = load_db()
    for item in db:
        if item["id"] == item_id:
            item.update(updates)
            break
    save_db(db)

def get_item(item_id: str) -> dict:
    """Retrieves a single item by its ID."""
    db = load_db()
    for item in db:
        if item["id"] == item_id:
            return item
    return None

def get_pending_plan_items() -> list:
    """Returns plan-sourced items that are waiting for media to be supplied by Inna."""
    db = load_db()
    return [
        item for item in db
        if item.get("plan_item_id") and item.get("status") in ("new", "waiting_media")
    ]
