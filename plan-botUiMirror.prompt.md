# Plan: Expose Every Telegram Bot Function in the Dashboard UI

## Summary

The Telegram bot (`bot/main.py`) currently exposes **7 commands**, **3 message handlers**, and **1 callback handler** that are only accessible through Telegram chat. This plan describes how to mirror every one of those capabilities inside the React dashboard so the entire bot workflow can be operated from the browser—without opening Telegram at all.

Each feature is assigned to one of **5 parallel agents** that can work simultaneously. The agents share a thin new REST layer (`server.js` + `plansStorage.js`) but touch completely independent UI components.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  React Dashboard (src/)                                     │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Agent A  │ │ Agent B  │ │ Agent C  │ │   Agent D     │  │
│  │ Queue &  │ │ Process &│ │ Publish &│ │   Media       │  │
│  │ Status   │ │ Draft    │ │ Schedule │ │   Upload      │  │
│  │ Panel    │ │ Review   │ │ Panel    │ │   Panel       │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       │            │            │               │           │
│  ┌────┴────────────┴────────────┴───────────────┴────────┐  │
│  │              Agent E: API Layer                        │  │
│  │   New endpoints in server.js + plansStorage.js         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                          │
   ┌─────┴──────┐          ┌───────┴────────┐
   │ /data/     │          │ Bot (Python)   │
   │ JSON files │          │ Reads same     │
   │ (shared)   │          │ JSON files     │
   └────────────┘          └────────────────┘
```

The dashboard and bot share the same JSON files on the `/data` Docker volume. Every new API endpoint reads or writes those files directly—no Python RPC needed.

---

## Bot Function Inventory

| # | Bot Function | Type | Source Location | Equivalent UI Feature |
|---|---|---|---|---|
| 1 | `/start` | Command | `start_command` (L420) | Auto-handled; show welcome state in dashboard |
| 2 | `/help` | Command | `help_command` (L443) | Already exists as Help tab; extend with command reference |
| 3 | `/status` | Command | `status_command` (L466) | **Queue Status Panel** (per-status counts) |
| 4 | `/queue` | Command | `queue_command` (L480) | **Active Queue List** (compact item preview) |
| 5 | `/process` | Command | `process_command` (L584) | **Process Button** (trigger batch processing from UI) |
| 6 | `/publishing` | Command | `publishing_command` (L503) | **Publishing Schedule Panel** (already partially in BotStatusPage) |
| 7 | `/errors` | Command | `errors_command` (L519) | **Severe Errors Panel** (already partially in BotStatusPage) |
| 8 | Media upload | Message | `handle_media` (L548) | **Media Upload Widget** (upload photo/video → queue) |
| 9 | Text feedback | Message | `handle_text` (L726) | **Rethink Feedback Form** (inline text input on draft cards) |
| 10 | Approve / Rethink / Cancel | Callback | `button_callback` (L693) | **Draft Action Buttons** (approve/rethink/cancel per item) |
| 11 | Post-init notification | Lifecycle | `post_init` (L759) | **Pending Items Banner** (show plan items awaiting processing) |
| 12 | Scheduled publishing | Background | `publish_due_items_loop` (L333) | **Publish Now Button** + scheduling overview |

---

## Agent Assignments

### Agent A — Queue & Status Panel

**Scope:** Bot functions #3 (`/status`), #4 (`/queue`), #11 (post-init pending banner)

**What it builds:**

1. **New API endpoint `GET /api/queue-items`** in `server.js`
   - Reads `media_queue.json` via a new `readQueueItems()` function in `plansStorage.js`
   - Returns the full queue array (with optional `?status=` and `?limit=` query params)
   - Each item includes: `id`, `status`, `plan_name`, `caption`, `media_url`, `file_type`, `generated_text`, `publish_at`, `publish_targets`, `publish_jobs`, `tags`

2. **New API endpoint `GET /api/queue-counts`** in `server.js`
   - Returns the same per-status breakdown the bot's `get_status_counts()` produces:
     ```json
     { "new": 3, "waiting_media": 0, "draft": 1, "rethinking": 0, "approved": 2, "canceled": 0, "total": 6 }
     ```

3. **New React component `src/components/QueueStatusPanel.tsx`**
   - Top section: 6 colored metric cards (one per status) matching the bot's `/status` output exactly
   - Bottom section: scrollable list of active queue items (status ∈ `new`, `waiting_media`, `draft`, `rethinking`) with thumbnail (from `media_url`), plan name / caption, status badge, file type icon (photo vs video)
   - Auto-refresh every 10 seconds
   - "Pending plan items" banner at the top when items with `plan_item_id` exist in `new` or `waiting_media` status (mirrors `post_init` notification)

4. **Integrate into `src/App.tsx`**
   - Replace the existing 3-card stats row on the Command Center tab with `QueueStatusPanel`
   - Keep the existing `queueStats` fetch as a fallback but prefer the richer new data

**Files touched:** `plansStorage.js`, `server.js`, `src/components/QueueStatusPanel.tsx` (new), `src/App.tsx`

**Dependencies:** None. Can start immediately.

---

### Agent B — Process & Draft Review

**Scope:** Bot functions #5 (`/process`), #9 (text feedback / rethink), #10 (approve / rethink / cancel buttons)

**What it builds:**

1. **New API endpoint `POST /api/queue-items/:id/action`** in `server.js`
   - Body: `{ "action": "approve" | "cancel" | "rethink", "feedback"?: string }`
   - Reads `media_queue.json`, finds the item, updates its `status` field:
     - `approve` → set status to `"approved"`
     - `cancel` → set status to `"canceled"`
     - `rethink` → set status to `"rethinking"`, store the feedback text in a `rethink_feedback` field
   - Writes back to `media_queue.json`; returns the updated item

2. **New API endpoint `POST /api/process`** in `server.js`
   - Reads `media_queue.json`, finds items with `status === "new"` (up to `BATCH_SIZE`, default 3)
   - For each item that has media (`file_id` or `media_url`):
     - Loads the media bytes from the shared `/data/uploads` directory or via `APP_URL`
     - Calls the Gemini API (import `@google/genai` — already a dependency in `package.json`) to generate a post using the same prompt template as `bot/gemini_service.py`
     - Reads `inna-context.json` for the persona context
     - Updates item status to `"draft"` and stores `generated_text`
   - For items without media: sets status to `"waiting_media"`
   - Returns: `{ processed, withMedia, waitingForMedia, items }`

3. **New React component `src/components/DraftReviewPanel.tsx`**
   - Fetches items with `status ∈ ["draft", "rethinking"]` from `GET /api/queue-items?status=draft` (and `rethinking`)
   - Renders each draft as a card showing:
     - Media thumbnail (photo or video player)
     - Generated text in a readable block
     - Plan name, caption context, tags
     - Three action buttons matching the Telegram inline keyboard:
       - ✅ **Approve** → `POST /api/queue-items/:id/action` with `{ action: "approve" }`
       - 🔄 **Rethink** → expands an inline textarea for feedback, then `POST` with `{ action: "rethink", feedback: "..." }`
       - ❌ **Cancel** → `POST /api/queue-items/:id/action` with `{ action: "cancel" }` + confirmation dialog
   - **Process button** at the top: triggers `POST /api/process`, shows a progress spinner, then refreshes the draft list
   - After approve/cancel, auto-checks if drafts < BATCH_SIZE and offers to process more (mirrors `check_queue_replenishment`)

4. **Integrate into `src/App.tsx`** — add a new sidebar tab "Draft Review"

**Files touched:** `plansStorage.js`, `server.js`, `src/components/DraftReviewPanel.tsx` (new), `src/App.tsx`

**Dependencies:** Depends on **Agent E** completing `geminiService.js`. Can start the UI component and the action endpoint immediately; the `/api/process` endpoint can be wired once Agent E delivers the Gemini helper.

---

### Agent C — Publishing & Schedule Panel

**Scope:** Bot functions #6 (`/publishing`), #12 (scheduled publishing / publish-now)

**What it builds:**

1. **New API endpoint `POST /api/publish-now`** in `server.js`
   - Triggers the same logic as `publish_due_items()` in the bot:
     - Reads `media_queue.json` for approved items whose `publish_at` ≤ now
     - For each matching item with scheduled `publish_jobs`, calls the configured webhook URL
     - Updates job status to `"published"` or `"failed"`
     - If all jobs for an item succeed, marks the item as `"posted"` and updates `plans.json`
   - Returns: `{ published, failed, details }`

2. **New API endpoint `GET /api/publishing-overview`** in `server.js`
   - Returns the same data as the bot's `/publishing` command (reuses and extends `readPublishingOverview()` which already exists):
     ```json
     { "scheduled": 4, "published": 2, "failed": 0, "approved_items": 5,
       "waiting_for_schedule": 1,
       "upcoming": [{ "id": "...", "plan_name": "...", "publish_at": "...", "targets": [...] }] }
     ```

3. **Enhance existing `src/components/BotStatusPage.tsx`**
   - Add a "Publish Now" button next to the upcoming publications section, wired to `POST /api/publish-now`
   - Show real-time results (published count, failures) in a toast/banner
   - Add per-item publish status breakdown (each target shown as a chip: scheduled / published / failed)
   - Add a retry button for failed targets

4. **New component `src/components/PublishingTimeline.tsx`**
   - Visual timeline of upcoming and past publications
   - Each entry shows: plan name, media thumbnail, scheduled time, target channels, job status
   - Color-coded: green = published, blue = scheduled, red = failed, gray = waiting

**Files touched:** `plansStorage.js`, `server.js`, `src/components/BotStatusPage.tsx`, `src/components/PublishingTimeline.tsx` (new)

**Dependencies:** None. Can start immediately.

---

### Agent D — Media Upload Panel

**Scope:** Bot function #8 (media upload via Telegram `handle_media`)

**What it builds:**

1. **Enhance existing `POST /api/media/upload`** response in `server.js`
   - After uploading the file, also create a new queue entry in `media_queue.json` with: `id` (generated UUID), `file_id: null`, `file_type` (inferred from MIME), `caption` (from optional form field), `media_url: /uploads/<filename>`, `status: "new"`, `generated_text: ""`
   - Return both the URL and the new queue item ID

2. **New API endpoint `POST /api/queue-items/:id/attach-media`** in `server.js`
   - For items in `waiting_media` status (plan items without media)
   - Accepts a file upload + the target queue item ID
   - Updates the queue item with the uploaded file path and sets status to `"new"`
   - Mirrors the bot's `handle_media` logic when `waiting_media_for` is set

3. **New React component `src/components/MediaUploadPanel.tsx`**
   - Drag-and-drop zone for photo/video files
   - Optional caption text field
   - Upload button → calls `POST /api/media/upload`; shows upload progress bar
   - After upload: shows the new queue item with a thumbnail + "Process now" shortcut button
   - **Waiting-for-media list:** shows items in `waiting_media` status with an "Attach media" button that opens a file picker and calls `POST /api/queue-items/:id/attach-media`

4. **Integrate into `src/App.tsx`**
   - Add to the Command Center tab as a collapsible "Quick Upload" section above the queue stats
   - Also accessible as a floating action button (FAB) in the bottom-right corner

**Files touched:** `plansStorage.js`, `server.js`, `src/components/MediaUploadPanel.tsx` (new), `src/App.tsx`

**Dependencies:** None. Can start immediately.

---

### Agent E — Server-Side Gemini Helper & Shared API Utilities

**Scope:** Shared infrastructure that Agent B's `/api/process` depends on, plus the `/help` command reference.

**What it builds:**

1. **New server module `geminiService.js`**
   - Imports `@google/genai` (already in `package.json` as `"@google/genai": "^1.29.0"`)
   - Implements `generatePostFromServer(mediaBytes, mimeType, options)`:
     - Reads `inna-context.json` for persona context using `readInnaContext()`
     - Constructs the **exact same prompt template** as `bot/gemini_service.py`
     - Calls Gemini with multimodal input (image/video bytes + prompt text)
     - Supports `options.previousDraft` and `options.feedback` for rethinking flow
     - Uses `process.env.GEMINI_API_KEY` and `process.env.GEMINI_MODEL` (fallback `"gemini-1.5-flash"`)
   - Implements `loadMediaBytes(item, uploadsDir, appUrl)`:
     - Same resolution logic as the bot's `load_media_bytes()`: check local file in `uploadsDir`, fall back to HTTP fetch via `APP_URL`
     - Returns `{ data: Buffer, mimeType: string }`

2. **Extend help reference in `src/components/HelpPage.tsx`**
   - Add a "Bot Commands" section listing all 7 commands with descriptions (mirrors `/help` output)
   - Optionally served via a new `GET /api/bot-commands` endpoint

3. **Shared queue mutation helpers in `plansStorage.js`**
   - `readQueueItems(botQueueFile, filters)` — read + filter queue items
   - `readQueueCounts(botQueueFile)` — per-status counts
   - `updateQueueItem(botQueueFile, itemId, updates)` — atomic read-modify-write
   - `addQueueItem(botQueueFile, item)` — append a new item
   - These are consumed by Agents A, B, C, and D

**Files touched:** `geminiService.js` (new), `plansStorage.js`, `server.js`, `src/components/HelpPage.tsx`

**Dependencies:** None for the helpers. Agent B depends on `geminiService.js` being available before `/api/process` can fully work.

---

## Execution Order & Parallelism

```
Time ──────────────────────────────────────────────────►

Agent E: [shared helpers + geminiService.js ····]
Agent A: [queue API + QueueStatusPanel ·········]
Agent D: [media upload API + MediaUploadPanel ··]
Agent C: [publish API + timeline + BotStatusPage]
Agent B: [action API ···][wait for E][/api/process + DraftReviewPanel]
                              ▲
                              │
                     Agent E delivers geminiService.js
```

- **Agents A, C, D, E** can all start in parallel immediately
- **Agent B** can start building the UI and the action endpoint immediately, but must wait for Agent E to deliver `geminiService.js` before implementing `POST /api/process`

---

## New File Summary

| File | Agent | Type | Description |
|---|---|---|---|
| `geminiService.js` | E | Server module | Gemini API wrapper for Node.js (same prompt as Python bot) |
| `src/components/QueueStatusPanel.tsx` | A | React component | Per-status queue counts + active item list |
| `src/components/DraftReviewPanel.tsx` | B | React component | Draft cards with approve/rethink/cancel + process button |
| `src/components/PublishingTimeline.tsx` | C | React component | Visual publish schedule timeline |
| `src/components/MediaUploadPanel.tsx` | D | React component | Drag-and-drop upload + waiting-for-media list |

## Modified File Summary

| File | Agents | Changes |
|---|---|---|
| `server.js` | A, B, C, D, E | 6–8 new API routes |
| `plansStorage.js` | A, B, C, D, E | ~6 new shared queue helper functions |
| `src/App.tsx` | A, B, D | New tabs, new imports, FAB |
| `src/components/BotStatusPage.tsx` | C | Publish-now button, per-item breakdown |
| `src/components/HelpPage.tsx` | E | Bot command reference section |

## New API Endpoint Summary

| Method | Path | Agent | Mirrors Bot Function |
|---|---|---|---|
| `GET` | `/api/queue-items` | A | `/queue` |
| `GET` | `/api/queue-counts` | A | `/status` |
| `POST` | `/api/process` | B | `/process` |
| `POST` | `/api/queue-items/:id/action` | B | `button_callback` (approve/rethink/cancel) |
| `GET` | `/api/publishing-overview` | C | `/publishing` |
| `POST` | `/api/publish-now` | C | `publish_due_items()` |
| `POST` | `/api/queue-items/:id/attach-media` | D | `handle_media` (waiting_media flow) |
| `GET` | `/api/bot-commands` | E | `/help` |

---

## Testing Strategy

Each agent writes a verification script in `scripts/`:

- **Agent A:** `scripts/verify-queue-panel-api.mjs` — seed `media_queue.json`, assert `/api/queue-items` and `/api/queue-counts` return correct data
- **Agent B:** `scripts/verify-process-api.mjs` — seed a queue item with a test image, call `/api/process`, assert draft is generated, then test approve/cancel/rethink actions
- **Agent C:** `scripts/verify-publish-api.mjs` — seed an approved item with past `publish_at`, call `/api/publish-now`, assert webhook was attempted
- **Agent D:** `scripts/verify-upload-api.mjs` — upload a file via `/api/media/upload`, assert queue item was created, then test attach-media flow
- **Agent E:** `scripts/verify-gemini-service.mjs` — unit-test `generatePostFromServer()` with a mock or small test image

---

## Language Rewrite Requirement

The entire project must be rewritten in either **Python** or **Go**. The coding agent executing this plan chooses whichever language is the proper fit for this specific project based on the existing stack, runtime constraints, deployment model (Docker Compose on a single VPS), and the nature of the workload (JSON file I/O, REST API serving, Gemini SDK calls, static file hosting). The current Node.js + TypeScript frontend and Python bot should be consolidated into a single-language codebase. The agent must justify its choice before writing any code.

---

## Acceptance Criteria

The implementation is complete when:

1. Every bot command (`/start`, `/help`, `/status`, `/queue`, `/process`, `/publishing`, `/errors`) has an equivalent UI action in the dashboard
2. Media can be uploaded from the browser and enters the same queue the Telegram bot reads
3. Drafts can be reviewed, approved, rethought (with feedback), or canceled entirely from the dashboard
4. The "Process" button generates drafts using the same Gemini prompt template and Inna context as the Python bot
5. Scheduled publications can be triggered manually from the dashboard
6. All new endpoints read/write the same shared JSON files the bot uses—no separate data store
7. The existing Telegram bot continues to work exactly as before (the dashboard is additive, not a replacement)

