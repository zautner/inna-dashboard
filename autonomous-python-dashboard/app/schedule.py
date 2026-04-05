from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any


WEEKDAY_ALIASES = {
    "sun": 6,
    "sunday": 6,
    "mon": 0,
    "monday": 0,
    "tue": 1,
    "tues": 1,
    "tuesday": 1,
    "wed": 2,
    "wednesday": 2,
    "thu": 3,
    "thur": 3,
    "thurs": 3,
    "thursday": 3,
    "fri": 4,
    "friday": 4,
    "sat": 5,
    "saturday": 5,
}
DEFAULT_PUBLISH_HOUR = 9
DEFAULT_PUBLISH_MINUTE = 0
START_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def normalize_plan_start_date(start_date: Any) -> str | None:
    if not isinstance(start_date, str) or not start_date.strip():
        return None
    trimmed = start_date.strip()
    if START_DATE_PATTERN.match(trimmed):
        return trimmed
    try:
        parsed = datetime.fromisoformat(trimmed.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.date().isoformat()


def resolve_item_schedule(start_date: Any, day_label: Any, existing_publish_at: Any = None) -> dict[str, Any]:
    normalized_start = normalize_plan_start_date(start_date)
    if not normalized_start:
        return {
            "publishAt": None,
            "offsetDays": None,
            "error": "Set a plan start date to derive this item's publish day.",
        }

    label = normalize_schedule_label(day_label)
    if not label:
        return {
            "publishAt": None,
            "offsetDays": None,
            "error": "Add a day label such as Monday, Week 2 - Thursday, or Day 5.",
        }

    start = datetime.fromisoformat(f"{normalized_start}T00:00:00")
    offset_days: int | None = None
    normalized_label = label.lower()

    weekday_index = get_weekday_index(normalized_label)
    if weekday_index is not None:
        offset_days = get_day_offset_within_week(start, weekday_index)

    if offset_days is None:
        match = re.match(r"^day\s+(\d+)$", normalized_label)
        if match:
            offset_days = max(0, int(match.group(1)) - 1)

    if offset_days is None:
        match = re.match(r"^week\s+(\d+)\s*[-,]\s*(.+)$", normalized_label)
        if match:
            week_index = max(0, int(match.group(1)) - 1)
            nested = match.group(2)
            nested_weekday = get_weekday_index(nested)
            if nested_weekday is not None:
                offset_days = week_index * 7 + get_day_offset_within_week(start, nested_weekday)
            else:
                nested_day_match = re.match(r"^day\s+(\d+)$", nested)
                if nested_day_match:
                    offset_days = week_index * 7 + max(0, int(nested_day_match.group(1)) - 1)

    if offset_days is None:
        match = re.match(r"^month\s+(\d+)\s*,?\s*week\s+(\d+)(?:\s*[-,]\s*(.+))?$", normalized_label)
        if match:
            month_index = max(0, int(match.group(1)) - 1)
            week_index = max(0, int(match.group(2)) - 1)
            nested = (match.group(3) or "").strip()
            base_offset = month_index * 28 + week_index * 7
            if not nested:
                offset_days = base_offset
            else:
                nested_weekday = get_weekday_index(nested)
                if nested_weekday is not None:
                    offset_days = base_offset + get_day_offset_within_week(start, nested_weekday)
                else:
                    nested_day_match = re.match(r"^day\s+(\d+)$", nested)
                    if nested_day_match:
                        offset_days = base_offset + max(0, int(nested_day_match.group(1)) - 1)

    if offset_days is None:
        match = re.match(r"^week\s+(\d+)$", normalized_label)
        if match:
            offset_days = max(0, int(match.group(1)) - 1) * 7

    if offset_days is None:
        return {
            "publishAt": None,
            "offsetDays": None,
            "error": "Use labels like Monday, Week 2 - Thursday, Month 2, Week 3, or Day 5.",
        }

    publish_at = start + timedelta(days=offset_days)
    hours, minutes = get_time_parts(existing_publish_at)
    publish_at = publish_at.replace(hour=hours, minute=minutes, second=0, microsecond=0)
    return {
        "publishAt": publish_at.isoformat() + "Z",
        "offsetDays": offset_days,
        "error": None,
    }


def apply_derived_schedule_to_plan(plan: Any, preserve_existing_publish_at_without_start_date: bool = True) -> Any:
    if not isinstance(plan, dict):
        return plan
    start_date = normalize_plan_start_date(plan.get("startDate"))
    items = plan.get("items") if isinstance(plan.get("items"), list) else []
    next_items = []

    for item in items:
        if not isinstance(item, dict):
            next_items.append(item)
            continue
        next_item = dict(item)
        if not start_date:
            next_item["publishAt"] = item.get("publishAt") if preserve_existing_publish_at_without_start_date else None
        else:
            schedule = resolve_item_schedule(start_date, item.get("day"), item.get("publishAt"))
            next_item["publishAt"] = schedule["publishAt"]
        next_items.append(next_item)

    next_plan = dict(plan)
    next_plan["startDate"] = start_date
    next_plan["items"] = next_items
    return next_plan


def normalize_schedule_label(day_label: Any) -> str:
    if not isinstance(day_label, str):
        return ""
    return re.sub(r"\s+", " ", day_label.strip())


def get_weekday_index(label: str) -> int | None:
    return WEEKDAY_ALIASES.get(label.strip().lower())


def get_day_offset_within_week(start_date: datetime, weekday_index: int) -> int:
    return (weekday_index - start_date.weekday() + 7) % 7


def get_time_parts(existing_publish_at: Any) -> tuple[int, int]:
    if not isinstance(existing_publish_at, str) or not existing_publish_at:
        return DEFAULT_PUBLISH_HOUR, DEFAULT_PUBLISH_MINUTE
    try:
        parsed = datetime.fromisoformat(existing_publish_at.replace("Z", "+00:00"))
    except ValueError:
        return DEFAULT_PUBLISH_HOUR, DEFAULT_PUBLISH_MINUTE
    return parsed.hour, parsed.minute
