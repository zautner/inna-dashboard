from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

from google import genai
from google.genai import types

from .config import settings
from .storage import build_public_media_url, infer_file_type, read_inna_context

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 2  # seconds


def generate_post_from_server(
    media_bytes: bytes,
    mime_type: str,
    *,
    original_caption: str | None = None,
    previous_draft: str | None = None,
    feedback: str | None = None,
) -> str:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is missing.")

    context = read_inna_context()
    quote_lines = "\n".join(f'    - "{quote}"' for quote in context["quotes"])
    prompt = f"""
    You are an AI Social Media Agent for Inna, a Shiatsu practitioner in Tel Aviv.

    CONTEXT:
    - Name: {context['name']}
    - Specialty: {context['specialty']}
    - Target Audience: {context['targetAudience']}
    - Voice: {context['voice']['tone']}. {context['voice']['style']}
    - Forbidden Words: {', '.join(context['voice']['forbiddenWords'])}

    INNA'S DIRECT QUOTES FOR VOICE REFERENCE:
{quote_lines}
    """

    if previous_draft and feedback:
        prompt += f"\n\nPREVIOUS DRAFT:\n{previous_draft}\n"
        prompt += f"\nINNA'S FEEDBACK:\n{feedback}\n"
        prompt += "\nTASK: Rewrite the social media post for the attached image/video based on Inna's feedback. Keep it in Hebrew, natural, and warm. Include relevant hashtags."
    else:
        prompt += "\n\nTASK: Write a social media post (Instagram/Facebook) in Hebrew for the attached image/video."
        if original_caption:
            prompt += f"\nInna provided this context/caption with the upload: {original_caption}"
        prompt += "\nKeep it natural, warm, and in the first person. Include relevant hashtags."

    client = genai.Client(api_key=settings.gemini_api_key)
    last_exc: Exception | None = None

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            logger.info("Gemini generate_content attempt %d/%d (model=%s)", attempt, _MAX_RETRIES, settings.gemini_model)
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=[
                    types.Part.from_bytes(data=media_bytes, mime_type=mime_type),
                    prompt,
                ],
            )
            return response.text or ""
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if attempt < _MAX_RETRIES:
                delay = _RETRY_BASE_DELAY * (2 ** (attempt - 1))
                logger.warning("Gemini API error (attempt %d/%d), retrying in %ds: %s", attempt, _MAX_RETRIES, delay, exc)
                time.sleep(delay)
            else:
                logger.error("Gemini API failed after %d attempts: %s", _MAX_RETRIES, exc)

    raise RuntimeError(f"Gemini API failed after {_MAX_RETRIES} attempts: {last_exc}")


def load_media_bytes(item: dict[str, Any]) -> tuple[bytes, str, Path | None]:
    if item.get("file_id"):
        return _load_telegram_media(item)

    media_path = resolve_uploaded_media_path(item)
    if media_path and media_path.exists() and media_path.is_file():
        logger.info("Loading media from disk: %s", media_path)
        return media_path.read_bytes(), infer_mime_type(item, media_path), media_path

    media_url = build_public_media_url(item)
    if media_url and media_url.startswith(("http://", "https://")):
        logger.info("Loading media from URL: %s", media_url)
        with urllib_request.urlopen(media_url, timeout=30) as response:
            mime_type = response.headers.get_content_type() if hasattr(response.headers, "get_content_type") else response.headers.get("Content-Type", infer_mime_type(item, media_path))
            return response.read(), mime_type or infer_mime_type(item, media_path), None

    raise FileNotFoundError(f"No media found for queue item {item.get('id')}.")


def resolve_uploaded_media_path(item: dict[str, Any]) -> Path | None:
    media_url = item.get("media_url")
    if not media_url or not isinstance(media_url, str) or not media_url.startswith("/uploads/"):
        return None
    file_name = Path(media_url).name
    if not file_name:
        return None
    return settings.uploads_dir / file_name


def infer_mime_type(item: dict[str, Any], file_path: Path | None = None) -> str:
    if item.get("file_type") == "video":
        return "video/mp4"
    if file_path:
        inferred = infer_file_type(file_name=file_path.name)
        if inferred == "video":
            return "video/mp4"
        if file_path.suffix.lower() == ".png":
            return "image/png"
        if file_path.suffix.lower() == ".webp":
            return "image/webp"
        if file_path.suffix.lower() == ".gif":
            return "image/gif"
        if file_path.suffix.lower() == ".avif":
            return "image/avif"
    return "image/jpeg"


def _load_telegram_media(item: dict[str, Any]) -> tuple[bytes, str, None]:
    if not settings.telegram_bot_token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is required to download Telegram-hosted media.")

    file_id = str(item["file_id"])
    metadata_url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/getFile?file_id={urllib_parse.quote(file_id)}"
    try:
        with urllib_request.urlopen(metadata_url, timeout=30) as response:
            payload = response.read().decode("utf-8")
    except (urllib_error.HTTPError, urllib_error.URLError) as exc:
        raise RuntimeError(f"Could not resolve Telegram file metadata: {exc}") from exc

    import json

    parsed = json.loads(payload)
    file_path = parsed.get("result", {}).get("file_path")
    if not file_path:
        raise RuntimeError("Telegram getFile did not return a file_path.")

    download_url = f"https://api.telegram.org/file/bot{settings.telegram_bot_token}/{file_path}"
    try:
        logger.info("Downloading Telegram media: file_id=%s", file_id)
        with urllib_request.urlopen(download_url, timeout=60) as response:
            mime_type = response.headers.get_content_type() if hasattr(response.headers, "get_content_type") else infer_mime_type(item)
            return response.read(), mime_type or infer_mime_type(item), None
    except (urllib_error.HTTPError, urllib_error.URLError) as exc:
        raise RuntimeError(f"Could not download Telegram media: {exc}") from exc
