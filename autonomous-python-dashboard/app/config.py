from __future__ import annotations

import logging
import os
import sys
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


APP_DIR = Path(__file__).resolve().parent
AUTONOMOUS_ROOT = APP_DIR.parent
PROJECT_ROOT = AUTONOMOUS_ROOT.parent
_DEFAULT_DATA_DIR = AUTONOMOUS_ROOT / "data"

load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(AUTONOMOUS_ROOT / ".env", override=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

_LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, _LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
    stream=sys.stderr,
)


@dataclass(frozen=True)
class Settings:
    project_root: Path
    autonomous_root: Path
    data_dir: Path
    plans_file: Path
    bot_queue_file: Path
    bot_activity_file: Path
    uploads_dir: Path
    inna_context_file: Path
    app_url: str
    gemini_api_key: str
    gemini_model: str
    telegram_bot_token: str
    batch_size: int
    publish_poll_interval_seconds: int
    instagram_feed_webhook_url: str
    instagram_story_webhook_url: str
    instagram_reel_webhook_url: str
    facebook_post_webhook_url: str
    tiktok_video_webhook_url: str


def build_settings() -> Settings:
    data_dir = Path(os.getenv("DASHBOARD_DATA_DIR", _DEFAULT_DATA_DIR))
    return Settings(
        project_root=PROJECT_ROOT,
        autonomous_root=AUTONOMOUS_ROOT,
        data_dir=data_dir,
        plans_file=Path(os.getenv("PLANS_FILE", data_dir / "plans.json")),
        bot_queue_file=Path(os.getenv("BOT_QUEUE_FILE", data_dir / "media_queue.json")),
        bot_activity_file=Path(os.getenv("BOT_ACTIVITY_FILE", data_dir / "activity.json")),
        uploads_dir=Path(os.getenv("UPLOADS_DIR", data_dir / "uploads")),
        inna_context_file=Path(os.getenv("INNA_CONTEXT_FILE", data_dir / "inna-context.json")),
        app_url=os.getenv("APP_URL", "").rstrip("/"),
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"),
        telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN", ""),
        batch_size=int(os.getenv("BATCH_SIZE", "3")),
        publish_poll_interval_seconds=int(os.getenv("PUBLISH_POLL_INTERVAL_SECONDS", "30")),
        instagram_feed_webhook_url=os.getenv("INSTAGRAM_FEED_WEBHOOK_URL", ""),
        instagram_story_webhook_url=os.getenv("INSTAGRAM_STORY_WEBHOOK_URL", ""),
        instagram_reel_webhook_url=os.getenv("INSTAGRAM_REEL_WEBHOOK_URL", ""),
        facebook_post_webhook_url=os.getenv("FACEBOOK_POST_WEBHOOK_URL", ""),
        tiktok_video_webhook_url=os.getenv("TIKTOK_VIDEO_WEBHOOK_URL", ""),
    )


settings = build_settings()


# ---------------------------------------------------------------------------
# Startup validation
# ---------------------------------------------------------------------------

def validate_settings(s: Settings) -> None:
    if not s.gemini_api_key:
        sys.exit("FATAL: GEMINI_API_KEY is not set. Cannot start without it.")
    if not s.telegram_bot_token:
        sys.stderr.write("WARNING: TELEGRAM_BOT_TOKEN is not set. Telegram media downloads will fail.\n")
    webhook_urls = [
        s.instagram_feed_webhook_url,
        s.instagram_story_webhook_url,
        s.instagram_reel_webhook_url,
        s.facebook_post_webhook_url,
        s.tiktok_video_webhook_url,
    ]
    if not any(webhook_urls):
        sys.stderr.write("WARNING: No webhook URLs configured. Publishing will fail for all targets.\n")


validate_settings(settings)
