# Phase 2 Plan — Inna Dashboard & Bot

This document captures the next iteration of improvements after the v1.1.0 release.

---

## Things to Fix

### Dashboard

- [ ] **Tailwind deprecation warning** — Replace `bg-gradient-to-br` with `bg-linear-to-br` in `src/App.tsx` to silence the build warning.
- [ ] **Global palette darkening approach** — Current CSS overrides (`!important` rules in `index.css`) are fragile; consider CSS custom properties or a proper Tailwind theme extension.
- [ ] **No undo for destructive actions** — Deleting a plan or media is immediate; add a brief "undo" toast or confirmation modal.
- [ ] **Upload error UX** — Failed media uploads show a generic message; surface the actual server error for debugging.
- [ ] **`Instagram` / `Facebook` icons deprecated** — Lucide has deprecated these; swap for maintained alternatives or inline SVGs.

### Bot

- [ ] **Publish retry logic** — Failed publish jobs are marked `failed` but never retried automatically; add exponential backoff retries.
- [ ] **Rate-limit handling** — Telegram API and Gemini API rate limits are not gracefully handled; add backoff and user feedback.
- [ ] **Graceful shutdown** — `SIGTERM` in Docker does not wait for the publishing loop to finish its current cycle.
- [ ] **Activity log growth** — `bot_activity.json` grows unbounded; implement log rotation or TTL cleanup.

### API / Storage

- [ ] **No authentication** — All API endpoints are public; add basic auth or token middleware for production use.
- [ ] **Concurrent writes** — Multiple writers to `plans.json` or `media_queue.json` can corrupt data; add file-level locking or move to SQLite.

---

## Almost Mandatory to Add

### Dashboard

- [ ] **RTL / Hebrew support** — Target audience is Hebrew-speaking; ensure proper RTL layout and Hebrew typography in the dashboard.
- [ ] **Mobile-friendly plan editing** — Configuration page is cramped on small screens; improve touch targets and layout.
- [ ] **Publish preview** — Show a live preview of how the generated post will look on Instagram/Facebook before Inna approves.
- [ ] **Draft history** — Store previous generated drafts per item so Inna can compare revisions.
- [ ] **Inline media cropping** — Allow Inna to crop or resize images directly in the dashboard before upload.

### Bot

- [ ] **Multi-language support** — Currently all Telegram messages are in Hebrew; allow language configuration.
- [ ] **Webhook secret validation** — Publishing webhooks should verify a shared secret header for security.
- [ ] **Proactive reminders** — Notify Inna in Telegram when a scheduled publish is approaching or when drafts are waiting too long.
- [ ] **Analytics feedback** — After publishing, fetch engagement metrics from Meta/TikTok APIs and surface them in the dashboard.

### Infra / DevOps

- [ ] **Health check endpoints** — Add `/health` and `/ready` for Kubernetes or Cloud Run liveness/readiness probes.
- [ ] **Persistent volume backups** — Document or automate backup of the shared `/data` volume.
- [ ] **CI/CD pipeline** — Add GitHub Actions for lint, build, and verification scripts on every PR.
- [ ] **Environment validation** — Fail fast on startup if required env vars (e.g., `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`) are missing.

---

## Candies and Nice-to-Haves

### Dashboard

- [ ] **Dark mode toggle** — Allow switching between light and dark themes in the UI.
- [ ] **Calendar view** — Visualize planned posts on a calendar grid with drag-and-drop rescheduling.
- [ ] **Bulk upload** — Upload multiple media files at once and auto-create plan items for them.
- [ ] **Template library** — Save and reuse common post structures or caption templates.
- [ ] **Export plan as PDF** — Generate a printable content calendar for offline review.
- [ ] **Audio posts** — Support audio file uploads for podcast snippets or voice notes.

### Bot

- [ ] **Voice message support** — Let Inna record voice feedback instead of typing rethink notes.
- [ ] **Sticker reactions** — Respond with custom stickers on approve/cancel for a more playful UX.
- [ ] **Scheduled draft delivery** — Deliver drafts at a specific time of day instead of immediately after `/process`.
- [ ] **Multi-account support** — Manage multiple personas or business profiles from a single bot instance.

### AI / Content

- [ ] **A/B caption variants** — Generate multiple caption options per image and let Inna pick the best.
- [ ] **Hashtag suggestions** — Auto-suggest trending or niche hashtags based on image content.
- [ ] **Content calendar AI** — Auto-generate a weekly posting plan based on past engagement patterns.
- [ ] **Image enhancement** — Auto-adjust brightness/contrast before publishing using a lightweight ML model.

### Integtic Integration

- [ ] **Direct Instagram/Facebook posting** — Replace webhooks with native Meta Graph API integration.
- [ ] **TikTok direct upload** — Use TikTok Creator API for native video uploads.
- [ ] **Google Business Profile** — Post updates to Inna's Google Business listing automatically.
- [ ] **WhatsApp Business** — Send post previews to Inna via WhatsApp instead of Telegram.

---

_Last updated: 2026-04-04 — v1.1.0_

