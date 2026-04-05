# Task 13: Add Unit Tests for schedule.py

## What changed
- Created `tests/test_schedule.py` with 30 test cases covering:
  - `normalize_plan_start_date()`: valid dates, ISO datetime, empty/None/garbage
  - `get_weekday_index()`: all day name aliases, unknown returns None
  - `normalize_schedule_label()`: whitespace stripping, None/non-string
  - `resolve_item_schedule()`: plain weekday, same day, Day N, Week N, Week N + weekday, Month/Week/weekday, missing start date, missing label, invalid label, time preservation
  - `apply_derived_schedule_to_plan()`: items with/without start date, non-dict passthrough

## Why
Schedule calculation is critical business logic. Edge cases in date parsing could silently schedule posts on wrong days.
