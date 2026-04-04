# Inna Dashboard

This repository contains two connected parts:

- the React/Vite dashboard for managing content plans and uploaded media
- the Python Telegram bot that turns approved items into Gemini-generated post drafts

The dashboard and the bot now share the same persisted storage for:

- plans (`plans.json`)
- bot queue (`media_queue.json`)
- bot activity log (`bot_activity.json`)
- uploaded media files (`uploads/`)
- business context (`inna-context.json`)

## What the app does

The dashboard lets you create weekly, monthly, and quarterly plans. Each plan contains items that can move through a simple lifecycle:

1. item is created
2. media is uploaded
3. media can be deleted
4. media can be replaced, and the old uploaded file is deleted from server storage on save
5. processing is started
6. once processing has started, the item becomes non-editable in the dashboard

Plans themselves support:

- create
- edit
- close
- reopen
- delete

Closing a plan makes its items read-only in the dashboard. Reopening enables editing again for items that are not already locked by processing/posting state.

## Architecture

### Frontend

- `src/App.tsx` – main dashboard shell, queue metrics, and persona context editor
- `src/components/ConfigurationPage.tsx` – plan creation, editing, close/reopen actions, item media lifecycle
- `src/components/BotStatusPage.tsx` – bot command history, severe errors, and publishing schedule overview

### Shared persistence layer

- `plansStorage.js` – source of truth for:
  - plan persistence
  - bot queue synchronization
  - uploaded-file cleanup when media or plans are deleted
  - Inna context read/write with defaults and validation

This file is used by both development and production API entrypoints so behavior stays aligned.

### API entrypoints

- `vite.config.ts` – development middleware for `/api/plans`, `/api/queue-stats`, `/api/bot-monitor`, `/api/inna-context`, `/api/media/upload`, and `/uploads/*`
- `server.js` – production Express server serving both the built app and the API

### Bot

- `bot/main.py` – Telegram bot workflow and scheduled publishing worker
- `bot/database.py` – queue storage access and activity logging
- `bot/gemini_service.py` – Gemini content generation
- `bot/config.py` – environment configuration and persona context loading

The bot can now process:

- Telegram-uploaded media (`file_id` flow)
- dashboard-uploaded media (`media_url` flow via shared `uploads/` storage)

## Verified lifecycle behavior

The repository includes runnable verification scripts:

- `scripts/verify-lifecycle.mjs` – plan and queue lifecycle
- `scripts/verify-inna-context-api.mjs` – context API read/write
- `scripts/verify-scheduled-publishing.py` – publishing job state transitions

Run them with:

```bash
npm run verify:lifecycle
npm run verify:context
npm run verify:publishing
```

## Local development

### Prerequisites

- Node.js
- Python 3.12+ for the bot

### 1. Install dashboard dependencies

```bash
npm install
```

### 2. Create an environment file

You can copy from `.env.example` and fill in the values you need.

Common variables:

- `GEMINI_API_KEY`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_BOT_TOKEN`
- `INNA_CHAT_ID`
- `BATCH_SIZE`
- `INNA_CONTEXT_FILE` (optional, defaults to `inna-context.json` in repo root)

### 3. Start the dashboard in development mode

```bash
npm run dev
```

This runs the Vite app and development API together on port `3000`.

### 4. Start the bot

```bash
cd bot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

By default, the bot reads the shared queue file at `bot/media_queue.json` and shared uploads from `../uploads`.

## Production / API-only mode

Build the frontend and run the Express server:

```bash
npm run build
node server.js
```

Optional environment variables:

- `PORT` or `API_PORT`
- `API_ONLY=true` to run the API without serving static files
- `PLANS_FILE`
- `BOT_QUEUE_FILE`
- `BOT_ACTIVITY_FILE`
- `UPLOADS_DIR`
- `INNA_CONTEXT_FILE`

## Docker Compose

`docker-compose.yml` is wired so the dashboard service and bot service share the same named volume:

- `/data/plans.json`
- `/data/media_queue.json`
- `/data/bot_activity.json`
- `/data/uploads`
- `/data/inna-context.json`

That means:

- dashboard saves plans into shared storage
- dashboard uploads media into shared storage
- dashboard reads/writes business persona settings in shared storage
- bot reads the same queue file
- bot reads the same persona context file before each Gemini generation
- bot can process dashboard-uploaded media directly from shared storage

Start the stack with:

```bash
docker compose up --build
```

The dashboard is exposed on `http://localhost:8082`.

## Validation commands used for this repository

These are the main checks that pass against the current codebase:

```bash
npm run lint
npm run build
npm run verify:lifecycle
npm run verify:context
npm run verify:publishing
python3 -m py_compile bot/config.py bot/database.py bot/gemini_service.py bot/main.py
```

## Important lifecycle notes

- Items enter bot processing when their dashboard status becomes `approved`.
- In the UI, that action is presented as **Start Processing**.
- Once an item is in processing (`approved`) or already posted, dashboard editing is disabled for that item.
- If media is replaced and the plan is saved, the old server file is removed.
- If media is deleted and the plan is saved, the corresponding bot queue entry is removed.
- If a whole plan is deleted, its uploaded files and queue entries are removed on save.

## Bot wiring summary

The dashboard and bot are wired through the shared queue schema:

- dashboard writes plan items with `plan_item_id`, `plan_id`, `plan_name`, `caption`, `file_type`, and `media_url`
- bot reads those items from `media_queue.json`
- if `media_url` exists, the bot processes the uploaded file directly from shared storage
- if a plan item reaches the queue without media, the bot asks for media in Telegram and continues from there

For bot-specific usage details, see `bot/README.md`.
