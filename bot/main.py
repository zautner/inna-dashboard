import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes

from config import TELEGRAM_BOT_TOKEN, BATCH_SIZE, INNA_CHAT_ID
from database import add_media, get_items_by_status, update_item, get_item, get_pending_plan_items
from gemini_service import generate_post

# Configure logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Welcomes Inna and explains the new media-first workflow."""
    # Store Inna's chat ID in bot_data for proactive notifications
    context.application.bot_data['inna_chat_id'] = update.effective_chat.id

    await update.message.reply_text(
        "שלום אינה! 👋\n"
        "אני מוכן. פשוט שלחי לי תמונות או סרטונים לשבוע/חודש הקרוב.\n"
        "(את יכולה גם להוסיף טקסט/הקשר לכל תמונה כשאת מעלה אותה).\n\n"
        "כשתסיימי להעלות, שלחי /process ואני אתחיל לכתוב עבורך פוסטים במנות קטנות."
    )

async def handle_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
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

async def process_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Processes a batch of 'new' media items and sends drafts to Inna."""
    new_items = get_items_by_status("new", limit=BATCH_SIZE)

    if not new_items:
        await update.message.reply_text("אין מדיה חדשה בתור. שלחי לי תמונות או סרטונים תחילה.")
        return

    await update.message.reply_text(f"מתחיל לעבד {len(new_items)} פריטים... ⏳")

    for item in new_items:
        if item.get("file_id"):
            await process_single_item(item, context, update.effective_chat.id)
        else:
            # Plan item without media yet — ask Inna to send the media
            await request_media_for_plan_item(item, context, update.effective_chat.id)

async def request_media_for_plan_item(item: dict, context: ContextTypes.DEFAULT_TYPE, chat_id: int):
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

async def process_single_item(item: dict, context: ContextTypes.DEFAULT_TYPE, chat_id: int, feedback: str = None):
    """Downloads media, calls Gemini, and sends the draft to Inna with action buttons."""
    try:
        # 1. Download file from Telegram
        file = await context.bot.get_file(item["file_id"])
        media_bytes = await file.download_as_bytearray()

        mime_type = "image/jpeg" if item["file_type"] == "photo" else "video/mp4"

        # 2. Generate text with Gemini
        generated_text = generate_post(
            media_bytes=bytes(media_bytes),
            mime_type=mime_type,
            original_caption=item.get("caption"),
            previous_draft=item.get("generated_text") if feedback else None,
            feedback=feedback
        )

        # 3. Update DB
        update_item(item["id"], {"status": "draft", "generated_text": generated_text})

        # 4. Send media back to Inna for context
        if item["file_type"] == "photo":
            await context.bot.send_photo(chat_id=chat_id, photo=item["file_id"])
        else:
            await context.bot.send_video(chat_id=chat_id, video=item["file_id"])

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
        await context.bot.send_message(chat_id=chat_id, text="❌ אירעה שגיאה בעיבוד התמונה/וידאו הזה.")

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
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
        await query.edit_message_text(text=f"✅ **אושר!**\n\n{item['generated_text']}")
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

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
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

async def check_queue_replenishment(context: ContextTypes.DEFAULT_TYPE, chat_id: int):
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
            if item.get("file_id"):
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
            return

    if not chat_id:
        return

    pending = get_pending_plan_items()
    if pending:
        await application.bot.send_message(
            chat_id=chat_id,
            text=(
                f"📋 יש {len(pending)} פריטים מהתוכנית שממתינים לעיבוד.\n"
                "שלחי /process כדי שאבקש ממך את התמונות/סרטונים הדרושים."
            ),
        )

if __name__ == '__main__':
    if not TELEGRAM_BOT_TOKEN:
        print("CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing. Please set it in your .env file.")
        exit(1)

    application = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).post_init(post_init).build()

    # Command handlers
    application.add_handler(CommandHandler('start', start_command))
    application.add_handler(CommandHandler('process', process_command))

    # Message handlers for media and text feedback
    application.add_handler(MessageHandler(filters.PHOTO | filters.VIDEO, handle_media))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    # Callback query handler for inline buttons
    application.add_handler(CallbackQueryHandler(button_callback))

    print("🤖 Inna's Media-First AI Bot is running... Press Ctrl+C to stop.")
    application.run_polling()
