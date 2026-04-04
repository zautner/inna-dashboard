import os
import json
from copy import deepcopy
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

# Telegram Bot Token obtained from BotFather
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Gemini API Key for generating content
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Configuration for how many posts to send to Inna for review at once
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "3"))

# Inna's Telegram chat ID — used to send proactive notifications about plan items.
# Set this after Inna sends /start once (the ID is printed to the bot log).
INNA_CHAT_ID = os.getenv("INNA_CHAT_ID", "")

# Shared uploads directory used by the dashboard and bot for plan-item media.
UPLOADS_DIR = os.getenv("UPLOADS_DIR", str(Path(__file__).resolve().parent.parent / "uploads"))

# Shared bot activity log used for recent command statuses and severe errors.
BOT_ACTIVITY_FILE = os.getenv("BOT_ACTIVITY_FILE", str(Path(__file__).with_name("bot_activity.json")))

# Shared plans file so the bot can mark plan items as posted after successful publication.
PLANS_FILE = os.getenv("PLANS_FILE", str(Path(__file__).resolve().parent.parent / "plans.json"))

# Public base URL of the dashboard/API used to turn relative /uploads paths into absolute URLs.
APP_URL = os.getenv("APP_URL", "").rstrip("/")

# Publishing worker settings.
PUBLISH_POLL_INTERVAL_SECONDS = int(os.getenv("PUBLISH_POLL_INTERVAL_SECONDS", "30"))

# Optional per-channel webhook endpoints. Each endpoint is expected to receive a JSON payload
# for the matching social media destination.
INSTAGRAM_FEED_WEBHOOK_URL = os.getenv("INSTAGRAM_FEED_WEBHOOK_URL", "")
INSTAGRAM_STORY_WEBHOOK_URL = os.getenv("INSTAGRAM_STORY_WEBHOOK_URL", "")
INSTAGRAM_REEL_WEBHOOK_URL = os.getenv("INSTAGRAM_REEL_WEBHOOK_URL", "")
FACEBOOK_POST_WEBHOOK_URL = os.getenv("FACEBOOK_POST_WEBHOOK_URL", "")
TIKTOK_VIDEO_WEBHOOK_URL = os.getenv("TIKTOK_VIDEO_WEBHOOK_URL", "")

# Shared context file for Inna's business persona.
INNA_CONTEXT_FILE = os.getenv("INNA_CONTEXT_FILE", str(Path(__file__).resolve().parent.parent / "inna-context.json"))

# Inna's business context and voice guidelines (fallback defaults).
DEFAULT_INNA_CONTEXT = {
    "name": "Inna",
    "specialty": "Shiatsu & Chinese Medicine",
    "location": "Tel Aviv, Gush Dan (Givatayim, Ramat Gan, Holon, Bat Yam)",
    "philosophy": "Shiatsu is about touch and Qi flow. It's not just physical tissue; it's about helping the body heal itself by smoothing the flow of energy.",
    "voice": {
        "tone": "Warm, human, expert but accessible, no corporate jargon, first-person.",
        "forbiddenWords": ["my dear", "sweetie", "listen to me", "I know best", "final decision"],
        "style": "Short, to the point, leaving room for discussion."
    },
    "targetAudience": "Women 40+, often with orthopedic issues (back, neck, shoulder pain), general fatigue, or lack of sleep.",
    "quotes": [
        "Shiatsu is about Qi flow. If there is smooth flow, the person feels good. If there is stagnation, we feel pain.",
        "The treatment is who you are. The difference between masters is the quality of touch.",
        "I don't believe in just massage. Only the brain can release the muscle. In Shiatsu, we create a connection with the brain.",
        "It's a dialogue between practitioner and patient."
    ]
}


def _normalize_inna_context(value):
    if not isinstance(value, dict):
        value = {}

    voice = value.get("voice") if isinstance(value.get("voice"), dict) else {}

    def as_string(raw, fallback):
        return raw.strip() if isinstance(raw, str) and raw.strip() else fallback

    def as_string_list(raw, fallback):
        if not isinstance(raw, list):
            return list(fallback)
        normalized = [item.strip() for item in raw if isinstance(item, str) and item.strip()]
        return normalized if normalized else list(fallback)

    return {
        "name": as_string(value.get("name"), DEFAULT_INNA_CONTEXT["name"]),
        "specialty": as_string(value.get("specialty"), DEFAULT_INNA_CONTEXT["specialty"]),
        "location": as_string(value.get("location"), DEFAULT_INNA_CONTEXT["location"]),
        "philosophy": as_string(value.get("philosophy"), DEFAULT_INNA_CONTEXT["philosophy"]),
        "voice": {
            "tone": as_string(voice.get("tone"), DEFAULT_INNA_CONTEXT["voice"]["tone"]),
            "forbiddenWords": as_string_list(voice.get("forbiddenWords"), DEFAULT_INNA_CONTEXT["voice"]["forbiddenWords"]),
            "style": as_string(voice.get("style"), DEFAULT_INNA_CONTEXT["voice"]["style"]),
        },
        "targetAudience": as_string(value.get("targetAudience"), DEFAULT_INNA_CONTEXT["targetAudience"]),
        "quotes": as_string_list(value.get("quotes"), DEFAULT_INNA_CONTEXT["quotes"]),
    }


def load_inna_context():
    try:
        with open(INNA_CONTEXT_FILE, "r", encoding="utf-8") as context_file:
            return _normalize_inna_context(json.load(context_file))
    except (OSError, json.JSONDecodeError):
        return deepcopy(DEFAULT_INNA_CONTEXT)


def get_inna_context():
    """Returns the latest context from shared storage so dashboard edits apply immediately."""
    return load_inna_context()


# Backward-compatible constant for older imports.
INNA_CONTEXT = load_inna_context()

