# Autonomous Python Dashboard

## Why Python

This autonomous run chooses **Python** as the single-language direction for the rewrite.

Python is the best fit for this repository because:

- the current source of truth for the bot workflow already lives in `bot/main.py`, `bot/database.py`, and `bot/gemini_service.py`
- Gemini prompting, queue processing, scheduled publishing, and Telegram media handling are already implemented in Python
- the workload is mostly JSON file I/O, HTTP endpoints, webhook calls, and background-style processing, which Python handles simply on a single VPS
- Docker Compose already runs a separate Python service for the bot, so consolidating server behavior into Python removes more duplication than a Go rewrite would
- reusing the proven Python prompt and queue semantics is lower risk than porting them into Go while preserving behavior

By default all dashboard state lives under **`autonomous-python-dashboard/data/`** (not the `bot/` tree):

- `data/plans.json`
- `data/media_queue.json`
- `data/activity.json`
- `data/uploads/`
- `data/inna-context.json`

Override `DASHBOARD_DATA_DIR` or individual `PLANS_FILE` / `BOT_QUEUE_FILE` / etc. if you want to share files with the Telegram bot.

## What This Contains

This subfolder provides a standalone Python web app that mirrors the Telegram bot workflow in the browser:

- queue counts and active queue list
- pending plan item banner
- attach-media flow for items waiting for media; new items come from Plans (or the bot)
- process button for new queue items
- draft review with approve, rethink, and cancel actions
- publishing overview and publish-now action
- bot command reference and help docs
- recent command history and severe errors

## Runtime Notes

- The app is intentionally isolated from the root Node/Vite app.
- Default storage is local to this folder (`data/`); point env vars at the bot's JSON paths when you need a single shared store.
- For Telegram-originated media (`file_id`), processing works when `TELEGRAM_BOT_TOKEN` is configured.
- For dashboard-originated media (`media_url`), processing works from the shared uploads directory or via `APP_URL`.

## Run (Local)

```bash
cd autonomous-python-dashboard
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8090
```

Open `http://localhost:8090`.

## Run (Docker)

```bash
cd autonomous-python-dashboard
docker build -t inna-dashboard .
docker run -p 8090:8090 \
  -e GEMINI_API_KEY=your-key \
  -v dashboard-data:/data \
  inna-dashboard
```

## Tests

```bash
pip install -r requirements.txt   # includes pytest and httpx
python -m pytest tests/ -v
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key for content generation |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model to use |
| `TELEGRAM_BOT_TOKEN` | No | — | Required only for Telegram-hosted media downloads |
| `APP_URL` | No | — | Public URL for the dashboard (used in CORS and webhook payloads) |
| `BATCH_SIZE` | No | `3` | Number of queue items to process per batch |
| `LOG_LEVEL` | No | `INFO` | Python logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `DASHBOARD_DATA_DIR` | No | `data/` | Base directory for all storage files |
| `PLANS_FILE` | No | `<data>/plans.json` | Path to plans JSON file |
| `BOT_QUEUE_FILE` | No | `<data>/media_queue.json` | Path to queue JSON file |
| `BOT_ACTIVITY_FILE` | No | `<data>/activity.json` | Path to activity log |
| `UPLOADS_DIR` | No | `<data>/uploads/` | Directory for uploaded media files |
| `INNA_CONTEXT_FILE` | No | `<data>/inna-context.json` | Path to persona context file |
| `INSTAGRAM_FEED_WEBHOOK_URL` | No | — | Webhook URL for Instagram Feed publishing |
| `INSTAGRAM_STORY_WEBHOOK_URL` | No | — | Webhook URL for Instagram Story publishing |
| `INSTAGRAM_REEL_WEBHOOK_URL` | No | — | Webhook URL for Instagram Reel publishing |
| `FACEBOOK_POST_WEBHOOK_URL` | No | — | Webhook URL for Facebook Post publishing |
| `TIKTOK_VIDEO_WEBHOOK_URL` | No | — | Webhook URL for TikTok Video publishing |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Dashboard HTML page |
| `GET` | `/api/health` | Health check (storage writability, API key presence) |
| `GET` | `/api/ready` | Readiness probe (returns 503 if not ready) |
| `GET` | `/api/queue-items` | List queue items (query: `status`, `limit`) |
| `GET` | `/api/queue-counts` | Count items by status |
| `GET` | `/api/queue-stats` | Summary stats (inQueue, draftsPending, approved) |
| `GET` | `/api/plans` | List all plans |
| `POST` | `/api/plans` | Save/update plans |
| `GET` | `/api/inna-context` | Read persona configuration |
| `PUT` | `/api/inna-context` | Update persona configuration |
| `GET` | `/api/bot-monitor` | Dashboard health overview |
| `GET` | `/api/publishing-overview` | Publishing status summary |
| `GET` | `/api/bot-commands` | List available commands |
| `GET` | `/api/help-docs` | Help documentation |
| `POST` | `/api/media/upload` | Upload media file (max 50 MB) |
| `POST` | `/api/queue-items/{id}/attach-media` | Attach media to waiting item |
| `POST` | `/api/process` | Trigger AI processing on new queue items |
| `POST` | `/api/queue-items/{id}/action` | Approve/cancel/rethink queue item |
| `POST` | `/api/publish-now` | Manually publish due items |
| `POST` | `/api/queue-items/{id}/publish-jobs/{target}/retry` | Retry failed publish |

## Troubleshooting

- **App won't start** — check that `GEMINI_API_KEY` is set. The app exits immediately without it.
- **Publishing shows 0 published / 0 failed** — verify approved items have a past `publish_at` timestamp and webhook URLs are configured.
- **Media processing fails with 503** — the Gemini API may be rate-limiting; the app retries 3 times with exponential backoff automatically.
- **File upload rejected with 413** — the file exceeds the 50 MB upload limit.

## Verification

Syntax check:

```bash
python3 -m py_compile app/*.py
```
