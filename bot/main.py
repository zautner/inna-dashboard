import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable
from urllib import error as urllib_error
from urllib import request as urllib_request
from urllib.parse import urljoin

try:
    from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
    from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
except ImportError:  # pragma: no cover - fallback for editor/static analysis without bot deps installed
    Update = Any
    InlineKeyboardButton = Any
    InlineKeyboardMarkup = Any
    ApplicationBuilder = Any
    CommandHandler = Any
    MessageHandler = Any
    CallbackQueryHandler = Any

    class _FallbackFilter:
        def __or__(self, other):
            return self

        def __and__(self, other):
            return self

        def __invert__(self):
            return self

    class _FallbackFilters:
        PHOTO = _FallbackFilter()
        VIDEO = _FallbackFilter()
        TEXT = _FallbackFilter()
        COMMAND = _FallbackFilter()

    class _FallbackContextTypes:
        DEFAULT_TYPE = Any

    filters = _FallbackFilters()
    ContextTypes = _FallbackContextTypes()

from config import (
    TELEGRAM_BOT_TOKEN,
    BATCH_SIZE,
    INNA_CHAT_ID,
    UPLOADS_DIR,
    APP_URL,
    PUBLISH_POLL_INTERVAL_SECONDS,
    INSTAGRAM_FEED_WEBHOOK_URL,
    INSTAGRAM_STORY_WEBHOOK_URL,
    INSTAGRAM_REEL_WEBHOOK_URL,
    FACEBOOK_POST_WEBHOOK_URL,
    TIKTOK_VIDEO_WEBHOOK_URL,
)
from database import (
    add_media,
    get_items_by_status,
    update_item,
    get_item,
    get_pending_plan_items,
    get_status_counts,
    get_publication_counts,
    get_publication_preview,
    get_queue_preview,
    get_items_ready_for_publish,
    update_publish_job,
    mark_plan_item_posted,
    parse_iso_datetime,
    get_recent_severe_errors,
    log_command,
    log_severe_error,
)
from gemini_service import generate_post

# Configure logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.DEBUG)

CHANNEL_WEBHOOKS = {
    "Instagram Feed": INSTAGRAM_FEED_WEBHOOK_URL,
    "Instagram Story": INSTAGRAM_STORY_WEBHOOK_URL,
    "Instagram Reel": INSTAGRAM_REEL_WEBHOOK_URL,
    "Facebook Post": FACEBOOK_POST_WEBHOOK_URL,
    "TikTok Video": TIKTOK_VIDEO_WEBHOOK_URL,
}


async def run_logged_command(update: Update, context: Any, command_name: str, action: Callable[[], Awaitable[dict[str, Any]]]):
    """Executes a bot command and persists its outcome for dashboard monitoring."""
    chat_id = update.effective_chat.id if update.effective_chat else None
    try:
        result = await action()
        log_command(
            command=command_name,
            outcome=result.get("outcome", "success"),
            summary=result.get("summary", f"/{command_name} completed"),
            details=result.get("details", ""),
            severity=result.get("severity", "info"),
            chat_id=chat_id,
            metadata=result.get("metadata", {}),
        )
    except Exception as exc:
        logging.exception("Command /%s failed", command_name)
        log_command(
            command=command_name,
            outcome="error",
            summary=f"/{command_name} failed",
            details=str(exc),
            severity="error",
            chat_id=chat_id,
        )
        log_severe_error(
            source="command_handler",
            command=command_name,
            summary=f"Command /{command_name} failed",
            details=str(exc),
            severity="error",
            chat_id=chat_id,
        )
        await safe_reply(update, context, "❌ קרתה שגיאה בזמן ביצוע הפקודה. אפשר לנסות שוב בעוד רגע.")


async def safe_reply(update: Update, context: Any, text: str, **kwargs):
    """Replies via the effective Telegram message when available, with a chat-level fallback."""
    message = getattr(update, "effective_message", None)
    if message:
        await message.reply_text(text, **kwargs)
        return

    if update.effective_chat:
        await context.bot.send_message(chat_id=update.effective_chat.id, text=text, **kwargs)


def format_queue_counts() -> tuple[str, dict]:
    """Formats queue counts for status/reporting commands."""
    counts = get_status_counts()
    text = (
        f"חדש: {counts['new']}\n"
        f"ממתין למדיה: {counts['waiting_media']}\n"
        f"טיוטות: {counts['draft']}\n"
        f"לתיקון: {counts['rethinking']}\n"
        f"אושרו: {counts['approved']}\n"
        f"בוטלו: {counts['canceled']}\n"
        f"סה״כ: {counts['total']}"
    )
    return text, counts


def describe_queue_item(item: dict) -> str:
    """Formats a short human-readable queue item line."""
    label = item.get("plan_name") or item.get("caption") or item.get("id")
    if item.get("plan_name") and item.get("caption"):
        label = f"{item['plan_name']} · {item['caption']}"
    return f"• {label} — {item.get('status', 'unknown')}"


def format_datetime(value: str | None) -> str:
    """Formats an ISO timestamp for human-readable Telegram replies."""
    parsed = parse_iso_datetime(value)
    if not parsed:
        return "not scheduled"
    return parsed.astimezone().strftime("%Y-%m-%d %H:%M")


def describe_publication_item(item: dict) -> str:
    """Formats a queue item that is scheduled for publication."""
    pending_targets = [job.get("target") for job in item.get("publish_jobs", []) if job.get("status") == "scheduled"]
    label = item.get("plan_name") or item.get("caption") or item.get("id")
    return f"• {label} — {format_datetime(item.get('publish_at'))} — {', '.join(pending_targets) if pending_targets else 'no targets'}"


def format_publication_counts() -> tuple[str, dict]:
    """Formats publication scheduler counts for status/reporting commands."""
    counts = get_publication_counts()
    text = (
        f"ממתינים לפרסום: {counts['scheduled']}\n"
        f"פורסמו: {counts['published']}\n"
        f"נכשלו: {counts['failed']}\n"
        f"פריטים מאושרים: {counts['approved_items']}\n"
        f"מחכים לשעת פרסום: {counts['waiting_for_schedule']}"
    )
    return text, counts


def build_publish_targets(item: dict) -> list[str]:
    """Returns the list of content targets configured for the queue item."""
    targets = item.get("publish_targets") or []
    return [target for target in targets if isinstance(target, str)]


def get_notification_chat_id(application) -> int | None:
    """Returns the chat id used for proactive bot notifications."""
    chat_id = application.bot_data.get('inna_chat_id')
    if chat_id:
        return chat_id
    if INNA_CHAT_ID:
        try:
            return int(INNA_CHAT_ID)
        except ValueError:
            return None
    return None


def build_public_media_url(item: dict) -> str | None:
    """Builds an absolute media URL when APP_URL is configured."""
    media_url = item.get("media_url")
    if not isinstance(media_url, str) or not media_url:
        return None
    if media_url.startswith("http://") or media_url.startswith("https://"):
        return media_url
    if APP_URL and media_url.startswith("/"):
        return f"{APP_URL}{media_url}"
    return media_url


def resolve_media_source_url(item: dict) -> str | None:
    """Returns an absolute URL for dashboard-uploaded media when available."""
    media_url = item.get("media_url")
    if not isinstance(media_url, str) or not media_url:
        return None
    if media_url.startswith("http://") or media_url.startswith("https://"):
        return media_url
    if APP_URL and media_url.startswith("/"):
        return urljoin(f"{APP_URL}/", media_url.lstrip("/"))
    return None


def publish_via_webhook(target: str, item: dict) -> dict:
    """Routes a scheduled post to the configured media-specific webhook."""
    webhook_url = CHANNEL_WEBHOOKS.get(target, "")
    if not webhook_url:
        raise RuntimeError(f"No publishing webhook configured for {target}")

    payload = {
        "queue_item_id": item.get("id"),
        "plan_item_id": item.get("plan_item_id"),
        "plan_id": item.get("plan_id"),
        "plan_name": item.get("plan_name"),
        "target": target,
        "publish_at": item.get("publish_at"),
        "caption": item.get("caption"),
        "generated_text": item.get("generated_text"),
        "media_url": build_public_media_url(item),
        "file_type": item.get("file_type"),
        "tags": item.get("tags", []),
    }

    request = urllib_request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib_request.urlopen(request, timeout=30) as response:
        body = response.read().decode("utf-8", errors="ignore")
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"Webhook returned status {response.status}: {body}")
        return {
            "status": response.status,
            "body": body[:500],
        }


async def publish_due_items(application: Any, force_chat_id: int | None = None):
    """Publishes approved items whose scheduled time has arrived."""
    due_items = get_items_ready_for_publish(datetime.now(timezone.utc))
    if not due_items:
        return

    chat_id = force_chat_id or get_notification_chat_id(application)

    for item in due_items:
        for target in build_publish_targets(item):
            matching_job = next((job for job in item.get("publish_jobs", []) if job.get("target") == target), None)
            if not matching_job or matching_job.get("status") != "scheduled":
                continue

            attempts = int(matching_job.get("attempts", 0)) + 1
            try:
                publish_result = publish_via_webhook(target, item)
                update_publish_job(item["id"], target, {
                    "status": "published",
                    "attempts": attempts,
                    "last_error": None,
                    "last_attempt_at": datetime.now(timezone.utc).isoformat(),
                    "published_at": datetime.now(timezone.utc).isoformat(),
                    "response": publish_result,
                })
                if chat_id:
                    await application.bot.send_message(
                        chat_id=chat_id,
                        text=f"✅ פורסם בהצלחה ל-{target}: {item.get('plan_name') or item.get('id')}"
                    )
            except (urllib_error.URLError, urllib_error.HTTPError, RuntimeError, ValueError) as exc:
                update_publish_job(item["id"], target, {
                    "status": "failed",
                    "attempts": attempts,
                    "last_error": str(exc),
                    "last_attempt_at": datetime.now(timezone.utc).isoformat(),
                })
                log_severe_error(
                    source="publish_due_items",
                    summary=f"Failed publishing to {target}",
                    details=str(exc),
                    severity="error",
                    item_id=item.get("id"),
                    metadata={
                        "target": target,
                        "plan_item_id": item.get("plan_item_id"),
                        "publish_at": item.get("publish_at"),
                    },
                )
                if chat_id:
                    await application.bot.send_message(
                        chat_id=chat_id,
                        text=f"❌ הפרסום ל-{target} נכשל עבור {item.get('plan_name') or item.get('id')}. בדקי את Bot Monitor."
                    )

        refreshed_item = get_item(item["id"])
        if refreshed_item and refreshed_item.get("publish_jobs"):
            if all(job.get("status") == "published" for job in refreshed_item.get("publish_jobs", [])):
                update_item(refreshed_item["id"], {
                    "status": "posted",
                    "published_at": datetime.now(timezone.utc).isoformat(),
                })
                if refreshed_item.get("plan_item_id"):
                    mark_plan_item_posted(refreshed_item["plan_item_id"])


async def publish_due_items_loop(application):
    """Background polling loop that publishes due items at their scheduled time."""
    while True:
        try:
            await publish_due_items(application)
        except Exception as exc:
            logging.exception("Scheduled publishing loop failed")
            log_severe_error(
                source="publish_due_items_loop",
                summary="Scheduled publishing loop failed",
                details=str(exc),
                severity="error",
            )
        await asyncio.sleep(PUBLISH_POLL_INTERVAL_SECONDS)

def resolve_uploaded_media_path(item: dict) -> Path | None:
    """Resolves a dashboard-uploaded media URL to the shared uploads directory."""
    media_url = item.get("media_url")
    if not media_url or not isinstance(media_url, str) or not media_url.startswith("/uploads/"):
        return None

    file_name = Path(media_url).name
    if not file_name:
        return None

    return Path(UPLOADS_DIR) / file_name


def infer_mime_type(item: dict, file_path: Path | None = None) -> str:
    """Returns a best-effort MIME type for either Telegram or shared-file media."""
    if item.get("file_type") == "video":
        return "video/mp4"

    if file_path:
        suffix = file_path.suffix.lower()
        if suffix == ".png":
            return "image/png"
        if suffix == ".webp":
            return "image/webp"
        if suffix == ".gif":
            return "image/gif"
        if suffix == ".avif":
            return "image/avif"

    return "image/jpeg"


async def load_media_bytes(item: dict, context: ContextTypes.DEFAULT_TYPE):
    """Loads media bytes either from Telegram or from the shared uploads directory."""
    if item.get("file_id"):
        file = await context.bot.get_file(item["file_id"])
        media_bytes = await file.download_as_bytearray()
        return bytes(media_bytes), infer_mime_type(item), None

    media_path = resolve_uploaded_media_path(item)
    if media_path and media_path.exists() and media_path.is_file():
        return media_path.read_bytes(), infer_mime_type(item, media_path), media_path

    media_url = resolve_media_source_url(item)
    if media_url:
        with urllib_request.urlopen(media_url, timeout=30) as response:
            mime_type = response.headers.get_content_type() if hasattr(response.headers, "get_content_type") else response.headers.get("Content-Type", infer_mime_type(item))
            return response.read(), mime_type or infer_mime_type(item), None

    attempted_path = str(media_path) if media_path else "not-applicable"
    attempted_url = media_url or "not-configured"
    raise FileNotFoundError(
        f"No media found for queue item {item.get('id')} (path={attempted_path}, url={attempted_url}). "
        "If the bot is not sharing the dashboard uploads directory, configure APP_URL so it can download /uploads files over HTTP."
    )


async def send_media_preview(item: dict, context: ContextTypes.DEFAULT_TYPE, chat_id: int, media_path: Path | None):
    """Sends the media back to Inna before the generated text, using either Telegram or local files."""
    if item.get("file_type") == "video":
        if item.get("file_id"):
            await context.bot.send_video(chat_id=chat_id, video=item["file_id"])
        elif media_path:
            with media_path.open("rb") as video_file:
                await context.bot.send_video(chat_id=chat_id, video=video_file)
    else:
        if item.get("file_id"):
            await context.bot.send_photo(chat_id=chat_id, photo=item["file_id"])
        elif media_path:
            with media_path.open("rb") as photo_file:
                await context.bot.send_photo(chat_id=chat_id, photo=photo_file)

async def start_command(update: Update, context: Any):  # type: ignore[misc]
    """Welcomes Inna and explains the new media-first workflow."""
    async def action():
        # Store Inna's chat ID in bot_data for proactive notifications
        context.application.bot_data['inna_chat_id'] = update.effective_chat.id

        await safe_reply(
            update,
            context,
            "שלום אינה! 👋\n"
            "אני מוכן. פשוט שלחי לי תמונות או סרטונים לשבוע/חודש הקרוב.\n"
            "(את יכולה גם להוסיף טקסט/הקשר לכל תמונה כשאת מעלה אותה).\n\n"
            "כשתסיימי להעלות, שלחי /process ואני אתחיל לכתוב עבורך פוסטים במנות קטנות.\n"
            "אם תרצי עזרה, שלחי /help."
        )
        return {
            "summary": "Registered chat and sent welcome message",
            "details": "Stored Inna chat id for future proactive notifications.",
        }

    await run_logged_command(update, context, "start", action)  # type: ignore[arg-type]


async def help_command(update: Update, context: Any):  # type: ignore[misc]
    """Lists the commands that are most useful in the current workflow."""
    async def action():
        await safe_reply(
            update,
            context,
            "הפקודות הזמינות כרגע:\n\n"
            "/start – חיבור ראשוני והסבר קצר\n"
            "/process – התחלת עיבוד של פריטים חדשים\n"
            "/status – מצב התור לפי סטטוסים\n"
            "/queue – תצוגה קצרה של הפריטים הפעילים בתור\n"
            "/publishing – מצב הפרסום המתוזמן\n"
            "/errors – שגיאות קשות אחרונות\n"
            "/help – הצגת רשימת הפקודות"
        )
        return {
            "summary": "Sent command help",
            "details": "Returned the supported workflow commands.",
        }

    await run_logged_command(update, context, "help", action)  # type: ignore[arg-type]


async def status_command(update: Update, context: Any):  # type: ignore[misc]
    """Shows queue counts grouped by status."""
    async def action():
        counts_text, counts = format_queue_counts()
        await safe_reply(update, context, f"מצב התור כרגע:\n\n{counts_text}")
        return {
            "summary": "Reported queue status counts",
            "details": counts_text,
            "metadata": counts,
        }

    await run_logged_command(update, context, "status", action)  # type: ignore[arg-type]


async def queue_command(update: Update, context: Any):  # type: ignore[misc]
    """Shows a compact preview of active queue items."""
    async def action():
        items = get_queue_preview(limit=5)
        if not items:
            await safe_reply(update, context, "אין כרגע פריטים פעילים בתור.")
            return {
                "outcome": "noop",
                "summary": "Queue preview requested but no active items were found",
                "details": "No active queue items.",
            }

        queue_text = "\n".join(describe_queue_item(item) for item in items)
        await safe_reply(update, context, f"הפריטים הפעילים הקרובים בתור:\n\n{queue_text}")
        return {
            "summary": f"Displayed {len(items)} active queue items",
            "details": queue_text,
            "metadata": {"displayed_items": len(items)},
        }

    await run_logged_command(update, context, "queue", action)  # type: ignore[arg-type]


async def publishing_command(update: Update, context: Any):  # type: ignore[misc]
    """Shows the current scheduled publishing state."""
    async def action():
        counts_text, counts = format_publication_counts()
        preview = get_publication_preview(limit=5)
        preview_text = "\n".join(describe_publication_item(item) for item in preview) if preview else "אין כרגע פרסומים עתידיים."
        await safe_reply(update, context, f"מצב הפרסום המתוזמן:\n\n{counts_text}\n\n{preview_text}")
        return {
            "summary": "Reported scheduled publishing status",
            "details": f"{counts_text} | preview_items={len(preview)}",
            "metadata": counts,
        }

    await run_logged_command(update, context, "publishing", action)  # type: ignore[arg-type]


async def errors_command(update: Update, context: Any):  # type: ignore[misc]
    """Shows the latest severe bot errors for quick operational visibility."""
    async def action():
        errors = get_recent_severe_errors(limit=5)
        if not errors:
            await safe_reply(update, context, "אין כרגע שגיאות קשות אחרונות. ✅")
            return {
                "outcome": "noop",
                "summary": "No severe errors were available",
                "details": "No severe bot errors found.",
            }

        error_lines = []
        for error in errors:
            source = error.get("source", "bot")
            timestamp = error.get("timestamp", "")[:19].replace("T", " ")
            summary = error.get("summary", "Unknown error")
            error_lines.append(f"• [{timestamp}] {source}: {summary}")

        await safe_reply(update, context, "שגיאות קשות אחרונות:\n\n" + "\n".join(error_lines))
        return {
            "summary": f"Displayed {len(errors)} severe errors",
            "details": " | ".join(error_lines),
            "severity": "warning",
            "metadata": {"displayed_errors": len(errors)},
        }

    await run_logged_command(update, context, "errors", action)  # type: ignore[arg-type]

async def handle_media(update: Update, context: Any):
    """Receives photos/videos from Inna and adds them to the queue."""
    caption = update.message.caption or ""

    if update.message.photo:
        file_id = update.message.photo[-1].file_id
        file_type = "photo"
    elif update.message.video:
        file_id = update.message.video.file_id
        file_type = "video"
    else:
        return

    # If the bot is waiting for media for a specific plan item, associate it
    waiting_for = context.user_data.get('waiting_media_for')
    if waiting_for:
        item = get_item(waiting_for)
        if item and item.get("status") == "waiting_media":
            update_item(waiting_for, {
                "file_id": file_id,
                "file_type": file_type,
                "caption": caption or item.get("caption", ""),
                "status": "new",
            })
            context.user_data.pop('waiting_media_for', None)
            await update.message.reply_text(
                "✅ המדיה קושרה לפריט מהתוכנית! מתחיל לכתוב פוסט... ⏳"
            )
            updated_item = get_item(waiting_for)
            await process_single_item(updated_item, context, update.effective_chat.id)
            return

    # Normal media handling
    add_media(file_id, file_type, caption)
    await update.message.reply_text("✅ המדיה התקבלה ונשמרה בתור. (שלחי /process כדי להתחיל)")

async def process_command(update: Update, context: Any):  # type: ignore[misc]
    """Processes a batch of 'new' media items and sends drafts to Inna."""
    async def action():
        new_items = get_items_by_status("new", limit=BATCH_SIZE)

        if not new_items:
            await update.message.reply_text("אין מדיה חדשה בתור. שלחי לי תמונות או סרטונים תחילה.")
            return {
                "outcome": "noop",
                "summary": "No new items were available for processing",
                "details": "Queue had no items with status=new.",
            }

        await update.message.reply_text(f"מתחיל לעבד {len(new_items)} פריטים... ⏳")

        ready_with_media = 0
        waiting_for_media = 0

        for item in new_items:
            if item.get("file_id") or item.get("media_url"):
                ready_with_media += 1
                await process_single_item(item, context, update.effective_chat.id)  # type: ignore[arg-type]
            else:
                waiting_for_media += 1
                # Plan item without media yet — ask Inna to send the media
                await request_media_for_plan_item(item, context, update.effective_chat.id)

        return {
            "summary": f"Started processing {len(new_items)} queue items",
            "details": f"with_media={ready_with_media}, waiting_for_media={waiting_for_media}",
            "metadata": {
                "processed_items": len(new_items),
                "with_media": ready_with_media,
                "waiting_for_media": waiting_for_media,
            },
        }

    await run_logged_command(update, context, "process", action)  # type: ignore[arg-type]

async def request_media_for_plan_item(item: dict, context: Any, chat_id: int):
    """Asks Inna to send media for a plan item that has no file yet."""
    update_item(item["id"], {"status": "waiting_media"})
    context.user_data['waiting_media_for'] = item["id"]

    plan_name = item.get("plan_name", "")
    caption = item.get("caption", "")

    await context.bot.send_message(
        chat_id=chat_id,
        text=(
            f"📋 *פריט מהתוכנית*\n"
            f"תוכנית: {plan_name}\n"
            f"{caption}\n\n"
            "אנא שלחי את התמונה או הסרטון המתאים לפריט זה:"
        ),
        parse_mode="Markdown",
    )

async def process_single_item(item: dict, context: Any, chat_id: int, feedback: str = None):
    """Downloads media, calls Gemini, and sends the draft to Inna with action buttons."""
    try:
        # 1. Load media either from Telegram or from shared dashboard storage
        media_bytes, mime_type, media_path = await load_media_bytes(item, context)

        # 2. Generate text with Gemini
        generated_text = generate_post(
            media_bytes=media_bytes,
            mime_type=mime_type,
            original_caption=item.get("caption"),
            previous_draft=item.get("generated_text") if feedback else None,
            feedback=feedback
        )
        if isinstance(generated_text, str) and generated_text.strip().startswith("❌"):
            raise RuntimeError(generated_text)

        # 3. Update DB
        update_item(item["id"], {"status": "draft", "generated_text": generated_text})

        # 4. Send media back to Inna for context
        await send_media_preview(item, context, chat_id, media_path)

        # 5. Send generated text with action buttons
        keyboard = [
            [InlineKeyboardButton("✅ אישור", callback_data=f"approve_{item['id']}"),
             InlineKeyboardButton("🔄 שינוי/הערות", callback_data=f"rethink_{item['id']}")],
            [InlineKeyboardButton("❌ ביטול", callback_data=f"cancel_{item['id']}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await context.bot.send_message(chat_id=chat_id, text=generated_text, reply_markup=reply_markup)

    except Exception as e:
        logging.error(f"Error processing item {item['id']}: {e}")
        log_severe_error(
            source="process_single_item",
            command="process",
            item_id=item.get("id"),
            summary=f"Failed to process queue item {item.get('id')}",
            details=str(e),
            severity="error",
            chat_id=chat_id,
            metadata={
                "plan_item_id": item.get("plan_item_id"),
                "plan_name": item.get("plan_name"),
                "status": item.get("status"),
            },
        )
        await context.bot.send_message(chat_id=chat_id, text="❌ אירעה שגיאה בעיבוד התמונה/וידאו הזה.")

async def button_callback(update: Update, context: Any):
    """Handles Approve, Rethink, and Cancel button clicks."""
    query = update.callback_query
    await query.answer()

    action, item_id = query.data.split("_")
    item = get_item(item_id)

    if not item:
        await query.edit_message_text(text="❌ שגיאה: הפריט לא נמצא.")
        return

    if action == "approve":
        update_item(item_id, {"status": "approved"})
        publish_at_text = format_datetime(item.get("publish_at"))
        targets = ", ".join(build_publish_targets(item)) or "no targets configured"
        await query.edit_message_text(text=f"✅ **אושר!**\n\n{item['generated_text']}\n\nפרסום מתוזמן: {publish_at_text}\nיעדים: {targets}")
        await publish_due_items(context.application, force_chat_id=query.message.chat_id)
        await check_queue_replenishment(context, query.message.chat_id)

    elif action == "cancel":
        update_item(item_id, {"status": "canceled"})
        await query.edit_message_text(text="❌ **בוטל.**")
        await check_queue_replenishment(context, query.message.chat_id)

    elif action == "rethink":
        update_item(item_id, {"status": "rethinking"})
        context.user_data['rethinking_id'] = item_id
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text="🔄 אנא הקלידי את ההערות שלך לתיקון הפוסט הזה (מה לשנות, להוסיף או להוריד):"
        )

async def handle_text(update: Update, context: Any):
    """Handles text messages, specifically for capturing rethinking feedback."""
    rethinking_id = context.user_data.get('rethinking_id')

    if rethinking_id:
        feedback = update.message.text
        item = get_item(rethinking_id)

        if item and item["status"] == "rethinking":
            await update.message.reply_text("מתקן את הפוסט לפי ההערות שלך... ⏳")
            await process_single_item(item, context, update.effective_chat.id, feedback=feedback)

        # Clear the rethinking state
        context.user_data.pop('rethinking_id', None)
    else:
        await update.message.reply_text("שלחי לי תמונות או סרטונים, או הקלידי /process כדי להתחיל לעבד את התור.")

async def check_queue_replenishment(context: Any, chat_id: int):
    """
    Checks if we should automatically process the next item in the queue
    to keep the batch size consistent.
    """
    drafts = get_items_by_status("draft")
    if len(drafts) < BATCH_SIZE:
        new_items = get_items_by_status("new", limit=1)
        if new_items:
            await context.bot.send_message(chat_id=chat_id, text="ממשיך לפריט הבא בתור... ⏳")
            item = new_items[0]
            if item.get("file_id") or item.get("media_url"):
                await process_single_item(item, context, chat_id)
            else:
                await request_media_for_plan_item(item, context, chat_id)

async def post_init(application):
    """Called after the bot starts. Notifies Inna about pending plan items."""
    # Determine the chat ID to use for the notification
    chat_id = application.bot_data.get('inna_chat_id')
    if not chat_id and INNA_CHAT_ID:
        try:
            chat_id = int(INNA_CHAT_ID)
        except ValueError:
            logging.warning("INNA_CHAT_ID is set but is not a valid integer; skipping startup notification.")
            log_severe_error(
                source="post_init",
                summary="INNA_CHAT_ID is invalid",
                details="The configured INNA_CHAT_ID could not be parsed as an integer.",
                severity="error",
            )
            return

    if not chat_id:
        return

    pending = get_pending_plan_items()
    if pending:
        await application.bot.send_message(
            chat_id=chat_id,
            text=(
                f"📋 יש {len(pending)} פריטים מהתוכנית שממתינים לעיבוד.\n"
                "שלחי /process כדי שאתחיל לעבד אותם. אם חסרה מדיה, אבקש אותה ישירות בצ'אט."
            ),
        )

    application.bot_data['publisher_task'] = asyncio.create_task(publish_due_items_loop(application))

if __name__ == '__main__':
    if not TELEGRAM_BOT_TOKEN:
        log_severe_error(
            source="startup",
            summary="TELEGRAM_BOT_TOKEN is missing",
            details="Bot startup aborted because TELEGRAM_BOT_TOKEN was not configured.",
            severity="critical",
        )
        print("CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing. Please set it in your .env file.")
        exit(1)

    application = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).post_init(post_init).build()

    # Command handlers
    application.add_handler(CommandHandler('start', start_command))
    application.add_handler(CommandHandler('help', help_command))
    application.add_handler(CommandHandler('process', process_command))
    application.add_handler(CommandHandler('status', status_command))
    application.add_handler(CommandHandler('queue', queue_command))
    application.add_handler(CommandHandler('publishing', publishing_command))
    application.add_handler(CommandHandler('errors', errors_command))

    # Message handlers for media and text feedback
    application.add_handler(MessageHandler(filters.PHOTO | filters.VIDEO, handle_media))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    # Callback query handler for inline buttons
    application.add_handler(CallbackQueryHandler(button_callback))

    print("🤖 Inna's Media-First AI Bot is running... Press Ctrl+C to stop.")
    try:
        application.run_polling()
    except Exception as exc:
        logging.exception("Bot polling crashed")
        log_severe_error(
            source="run_polling",
            summary="Bot polling crashed",
            details=str(exc),
            severity="critical",
        )
        raise
