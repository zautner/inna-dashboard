from __future__ import annotations

import pytest

from app.schedule import (
    apply_derived_schedule_to_plan,
    get_day_offset_within_week,
    get_weekday_index,
    normalize_plan_start_date,
    normalize_schedule_label,
    resolve_item_schedule,
)


class TestNormalizePlanStartDate:
    def test_valid_iso_date(self):
        assert normalize_plan_start_date("2025-04-07") == "2025-04-07"

    def test_iso_datetime_with_z(self):
        assert normalize_plan_start_date("2025-04-07T09:00:00Z") == "2025-04-07"

    def test_empty_string(self):
        assert normalize_plan_start_date("") is None

    def test_none(self):
        assert normalize_plan_start_date(None) is None

    def test_garbage(self):
        assert normalize_plan_start_date("not-a-date") is None


class TestGetWeekdayIndex:
    @pytest.mark.parametrize("label,expected", [
        ("monday", 0),
        ("Mon", 0),
        ("friday", 4),
        ("Fri", 4),
        ("sunday", 6),
        ("Sun", 6),
    ])
    def test_known_weekdays(self, label, expected):
        assert get_weekday_index(label) == expected

    def test_unknown_returns_none(self):
        assert get_weekday_index("notaday") is None


class TestNormalizeScheduleLabel:
    def test_strips_whitespace(self):
        assert normalize_schedule_label("  Week 2 - Friday  ") == "Week 2 - Friday"

    def test_collapses_spaces(self):
        assert normalize_schedule_label("Week  2  -  Friday") == "Week 2 - Friday"

    def test_none_returns_empty(self):
        assert normalize_schedule_label(None) == ""

    def test_non_string(self):
        assert normalize_schedule_label(42) == ""


class TestResolveItemSchedule:
    def test_plain_weekday(self):
        result = resolve_item_schedule("2025-04-07", "Friday")
        assert result["error"] is None
        assert result["publishAt"] == "2025-04-11T09:00:00Z"
        assert result["offsetDays"] == 4

    def test_same_day_as_start(self):
        result = resolve_item_schedule("2025-04-07", "Monday")
        assert result["publishAt"] == "2025-04-07T09:00:00Z"
        assert result["offsetDays"] == 0

    def test_day_number(self):
        result = resolve_item_schedule("2025-04-07", "Day 3")
        assert result["publishAt"] == "2025-04-09T09:00:00Z"
        assert result["offsetDays"] == 2

    def test_day_1_is_start_date(self):
        result = resolve_item_schedule("2025-04-07", "Day 1")
        assert result["publishAt"] == "2025-04-07T09:00:00Z"
        assert result["offsetDays"] == 0

    def test_week_offset(self):
        result = resolve_item_schedule("2025-04-07", "Week 2")
        assert result["publishAt"] == "2025-04-14T09:00:00Z"
        assert result["offsetDays"] == 7

    def test_week_with_weekday(self):
        result = resolve_item_schedule("2025-04-07", "Week 2 - Friday")
        assert result["publishAt"] == "2025-04-18T09:00:00Z"
        assert result["offsetDays"] == 11

    def test_month_week_weekday(self):
        result = resolve_item_schedule("2025-04-07", "Month 2, Week 1 - Monday")
        assert result["error"] is None
        assert result["offsetDays"] == 28

    def test_missing_start_date(self):
        result = resolve_item_schedule(None, "Monday")
        assert result["error"] is not None
        assert result["publishAt"] is None

    def test_missing_day_label(self):
        result = resolve_item_schedule("2025-04-07", "")
        assert result["error"] is not None

    def test_invalid_label(self):
        result = resolve_item_schedule("2025-04-07", "Blurgsday")
        assert result["error"] is not None

    def test_preserves_existing_time(self):
        result = resolve_item_schedule("2025-04-07", "Monday", "2025-04-07T14:30:00Z")
        assert result["publishAt"] == "2025-04-07T14:30:00Z"


class TestApplyDerivedScheduleToPlan:
    def test_applies_schedule_to_items(self):
        plan = {
            "startDate": "2025-04-07",
            "items": [
                {"day": "Monday"},
                {"day": "Friday"},
            ],
        }
        result = apply_derived_schedule_to_plan(plan)
        assert result["items"][0]["publishAt"] == "2025-04-07T09:00:00Z"
        assert result["items"][1]["publishAt"] == "2025-04-11T09:00:00Z"

    def test_no_start_date_preserves_existing(self):
        plan = {
            "startDate": None,
            "items": [
                {"day": "Monday", "publishAt": "2025-04-07T09:00:00Z"},
            ],
        }
        result = apply_derived_schedule_to_plan(plan)
        assert result["items"][0]["publishAt"] == "2025-04-07T09:00:00Z"

    def test_non_dict_passthrough(self):
        assert apply_derived_schedule_to_plan("not a dict") == "not a dict"
