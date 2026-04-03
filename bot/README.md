# Shiatsu Inna - Telegram AI Agent (Media-First Workflow)

This folder contains the complete Python implementation of the Telegram Bot for Inna's Shiatsu practice. It uses the `python-telegram-bot` library to interact with Telegram and the `google-genai` library to generate authentic Hebrew content based on uploaded photos and videos.

## The Workflow

1. **Upload**: Inna uploads photos or videos to the bot (she can add captions/context to the media).
2. **Queue**: The bot saves these to a queue.
3. **Process**: Inna sends `/process`. The bot takes a small batch (e.g., 3 items), analyzes the media using Gemini 3.1 Flash, and generates a draft post.
4. **Review**: The bot sends the draft back to Inna with three buttons:
   - ✅ **Approve**: Marks the post as ready.
   - 🔄 **Rethink**: Prompts Inna to type feedback, then the AI rewrites the post.
   - ❌ **Cancel**: Discards the post.
5. **Continuous Flow**: As items are approved or canceled, the bot automatically pulls the next items from the queue until everything is processed.

## Setup Instructions

1. **Navigate to the bot directory:**
   ```bash
   cd bot
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `bot` directory and add your keys:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   BATCH_SIZE=3
   ```

4. **Run the bot:**
   ```bash
   python main.py
   ```
