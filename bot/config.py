import os
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

# Inna's business context and voice guidelines
# This dictionary acts as the source of truth for the AI's persona
INNA_CONTEXT = {
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
