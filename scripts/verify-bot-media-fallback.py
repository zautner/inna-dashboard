import asyncio
import importlib
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


def main():
    repo_root = Path(__file__).resolve().parent.parent
    bot_dir = repo_root / 'bot'
    sys.path.insert(0, str(bot_dir))
    os.environ.setdefault('GEMINI_API_KEY', 'dummy-key')

    bot_main = importlib.import_module('main')

    class FakeMessage:
        def __init__(self):
            self.replies = []

        async def reply_text(self, text, **kwargs):
            self.replies.append((text, kwargs))

    class FakeBot:
        def __init__(self):
            self.sent = []

        async def send_message(self, **kwargs):
            self.sent.append(kwargs)

    class FakeContext:
        def __init__(self):
            self.bot = FakeBot()

    class FakeChat:
        def __init__(self, chat_id):
            self.id = chat_id

    class FakeUpdate:
        def __init__(self, message=None, chat_id=123):
            self.effective_message = message
            self.effective_chat = FakeChat(chat_id)

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            body = b'test-image-bytes'
            self.send_response(200)
            self.send_header('Content-Type', 'image/jpeg')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format, *args):
            return

    async def verify_safe_reply():
        context = FakeContext()
        message = FakeMessage()
        update = FakeUpdate(message=message)
        await bot_main.safe_reply(update, context, 'hello')
        assert message.replies == [('hello', {})], message.replies

        fallback_update = FakeUpdate(message=None, chat_id=456)
        await bot_main.safe_reply(fallback_update, context, 'fallback')
        assert context.bot.sent == [{'chat_id': 456, 'text': 'fallback'}], context.bot.sent

    async def verify_load_media_bytes_remote():
        server = HTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            bot_main.APP_URL = f'http://127.0.0.1:{server.server_port}'
            data, mime_type, media_path = await bot_main.load_media_bytes(
                {'id': 'pi-test', 'media_url': '/uploads/demo.jpg', 'file_type': 'photo'},
                FakeContext(),
            )
            assert data == b'test-image-bytes', data
            assert mime_type == 'image/jpeg', mime_type
            assert media_path is None, media_path
        finally:
            server.shutdown()
            server.server_close()

    asyncio.run(verify_safe_reply())
    asyncio.run(verify_load_media_bytes_remote())
    print('Bot reply/media fallback verification passed')


if __name__ == '__main__':
    main()

