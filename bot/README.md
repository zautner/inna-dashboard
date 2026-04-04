# Inna Telegram Bot

This folder contains the Python Telegram bot used by the dashboard workflow.

It uses:

- `python-telegram-bot` for the Telegram interface
- `google-genai` for Gemini-powered text generation

## What this bot processes

The bot supports two queue sources:

1. **Direct Telegram uploads**
   - Inna sends a photo or video to the bot.
   - The bot stores the Telegram `file_id` in the queue.

2. **Dashboard-approved plan items**
   - The dashboard saves approved items into `media_queue.json`.
   - Those entries include `media_url` that points to a file in the shared uploads directory.
   - The bot reads the file directly from shared storage and sends the generated draft back to Telegram.

## Queue storage and wiring

The bot queue is stored as JSON.

By default:

- queue file: `bot/media_queue.json`
- activity log: `bot/bot_activity.json`
- shared uploads directory: `../uploads`
- persona context: `../inna-context.json`

All paths are configurable via environment variables (see below).

## Bot workflow

### A. Telegram-first media flow

1. Inna uploads a photo or video to the bot.
2. The bot stores it in the queue with status `new`.
3. Inna sends `/process`.
4. The bot downloads the media from Telegram, sends it to Gemini, and stores the generated draft.
5. The bot sends the draft back with action buttons:
   - ✅ approve
   - 🔄 rethink
   - ❌ cancel

### B. Dashboard plan-item flow

1. A dashboard item is moved to processing and the plan is saved.
2. The dashboard writes a queue item with:
   - `plan_item_id`
   - `plan_id`
   - `plan_name`
   - `caption`
   - `file_type`
   - `media_url`
   - `publish_at`
   - `publish_targets`
3. The bot loads that queue item.
4. If `media_url` exists, the bot reads the media file from shared storage.
5. If no media is present yet, the bot asks Inna to send the missing file in Telegram and resumes processing from there.

### C. Scheduled publishing

After Telegram approval, the bot holds items until their `publish_at` time arrives and then routes them to configured webhooks per content type.

## Queue statuses used by the bot

- `new` – ready to process
- `waiting_media` – plan item exists but still needs media from Telegram
- `draft` – Gemini draft generated and waiting for Inna's decision
- `rethinking` – waiting for revision feedback
- `approved` – approved inside Telegram and queued for publishing
- `posted` – all publish targets completed successfully
- `canceled` – canceled inside Telegram

## Environment variables

Create a `.env` file in `bot/` or export these variables before running:

```env
# Required
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GEMINI_API_KEY=your_gemini_api_key

# Optional — processing and notifications
GEMINI_MODEL=gemini-1.5-flash
BATCH_SIZE=3
INNA_CHAT_ID=

# Optional — shared storage paths (defaults work for repo layout)
BOT_QUEUE_FILE=
BOT_ACTIVITY_FILE=
UPLOADS_DIR=
PLANS_FILE=
INNA_CONTEXT_FILE=

# Optional — publishing
APP_URL=
PUBLISH_POLL_INTERVAL_SECONDS=30
INSTAGRAM_FEED_WEBHOOK_URL=
INSTAGRAM_STORY_WEBHOOK_URL=
INSTAGRAM_REEL_WEBHOOK_URL=
FACEBOOK_POST_WEBHOOK_URL=
TIKTOK_VIDEO_WEBHOOK_URL=
```

Notes:

- `INNA_CHAT_ID` is optional, but useful for startup notifications about pending plan items.
- `GEMINI_MODEL` is optional; use it if a model name changes or a preview model expires.
- If storage paths are not set, the bot uses paths relative to the repo layout.
- `APP_URL` is used to build absolute media URLs for publishing webhooks and lets the bot download dashboard-uploaded `/uploads/...` media over HTTP when it is not sharing the same filesystem.

## Run locally

```bash
cd bot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Run with the dashboard in Docker Compose

From the repository root:

```bash
docker compose up --build
```

In Compose, both services share:

- `BOT_QUEUE_FILE=/data/media_queue.json`
- `BOT_ACTIVITY_FILE=/data/bot_activity.json`
- `UPLOADS_DIR=/data/uploads`
- `PLANS_FILE=/data/plans.json`
- `INNA_CONTEXT_FILE=/data/inna-context.json`

That shared volume is what lets the bot process dashboard-uploaded media directly.

## What was checked in the current wiring

The current repository wiring was updated so that:

- `bot/database.py` resolves the queue file from `BOT_QUEUE_FILE` or `bot/media_queue.json`
- `bot/config.py` resolves the shared uploads directory from `UPLOADS_DIR`
- `bot/config.py` loads persona context from `INNA_CONTEXT_FILE` with safe defaults
- `bot/main.py` can process queue items that contain either `file_id` or `media_url`
- `bot/main.py` runs a background publishing loop that routes approved items to webhooks
- the dashboard and bot can share storage consistently in Docker and local repo-based runs

## Useful manual checks

1. Start the dashboard and bot.
2. Create a plan in the dashboard.
3. Upload media to an item.
4. Start processing for that item and save the plan.
5. Confirm a new entry appears in `media_queue.json`.
6. Send `/process` in Telegram.
7. Confirm the bot returns the media preview and a Gemini-generated draft.

If you want a repository-level verification of plan persistence and queue cleanup, run from the project root:

```bash
npm run verify:lifecycle
npm run verify:context
npm run verify:publishing
```
