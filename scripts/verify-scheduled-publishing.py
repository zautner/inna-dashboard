import asyncio
import importlib
import json
import os
import sys
import tempfile
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

captured_requests = []


class PublishHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(content_length)
        captured_requests.append(json.loads(body.decode('utf-8')))
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"ok": true}')

    def log_message(self, format, *args):
        return


class FakeBot:
    async def send_message(self, *args, **kwargs):
        return None


class FakeApplication:
    def __init__(self):
        self.bot_data = {}
        self.bot = FakeBot()


def main():
    with tempfile.TemporaryDirectory(prefix='inna-scheduled-publish-') as temp_dir:
        temp_path = Path(temp_dir)
        plans_file = temp_path / 'plans.json'
        queue_file = temp_path / 'media_queue.json'
        activity_file = temp_path / 'bot_activity.json'
        uploads_dir = temp_path / 'uploads'
        uploads_dir.mkdir(parents=True, exist_ok=True)

        server = HTTPServer(('127.0.0.1', 0), PublishHandler)  # type: ignore[arg-type]
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        webhook_url = f'http://127.0.0.1:{server.server_port}/facebook-post'

        os.environ['PLANS_FILE'] = str(plans_file)
        os.environ['BOT_QUEUE_FILE'] = str(queue_file)
        os.environ['BOT_ACTIVITY_FILE'] = str(activity_file)
        os.environ['UPLOADS_DIR'] = str(uploads_dir)
        os.environ['APP_URL'] = 'https://example.test'
        os.environ['FACEBOOK_POST_WEBHOOK_URL'] = webhook_url
        os.environ['TELEGRAM_BOT_TOKEN'] = 'test-token'
        os.environ['GEMINI_API_KEY'] = 'test-gemini-key'
        os.environ['PUBLISH_POLL_INTERVAL_SECONDS'] = '1'

        repo_root = Path('/Users/vitaly.zautner/Projects/inna-dashboard')
        bot_dir = repo_root / 'bot'
        sys.path.insert(0, str(bot_dir))

        database = importlib.import_module('database')
        bot_main = importlib.import_module('main')

        publish_at = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()

        plans_file.write_text(json.dumps([
            {
                'id': 'plan-1',
                'name': 'Weekly Plan',
                'type': 'week',
                'status': 'open',
                'items': [
                    {
                        'id': 'item-1',
                        'day': 'Monday',
                        'publishAt': publish_at,
                        'mediaType': 'photo',
                        'uploadedMediaType': 'photo',
                        'contentTypes': ['Facebook Post'],
                        'status': 'approved',
                        'mediaUrl': '/uploads/demo.jpg',
                        'tags': [],
                    }
                ],
            }
        ], indent=2), encoding='utf-8')

        queue_file.write_text(json.dumps([
            {
                'id': 'queue-1',
                'plan_item_id': 'item-1',
                'plan_id': 'plan-1',
                'plan_name': 'Weekly Plan',
                'file_id': None,
                'file_type': 'photo',
                'caption': 'Plan: Weekly Plan | Monday | Facebook Post',
                'media_url': '/uploads/demo.jpg',
                'publish_at': publish_at,
                'publish_targets': ['Facebook Post'],
                'publish_jobs': [
                    {
                        'target': 'Facebook Post',
                        'status': 'scheduled',
                        'attempts': 0,
                        'last_error': None,
                        'published_at': None,
                    }
                ],
                'status': 'approved',
                'generated_text': 'Scheduled copy',
            }
        ], indent=2), encoding='utf-8')

        application = FakeApplication()
        asyncio.run(bot_main.publish_due_items(application))

        queue_data = json.loads(queue_file.read_text(encoding='utf-8'))
        plan_data = json.loads(plans_file.read_text(encoding='utf-8'))

        assert len(captured_requests) == 1, 'Expected one outgoing publishing webhook request.'
        assert captured_requests[0]['target'] == 'Facebook Post', 'Expected the Facebook publish target to be used.'
        assert captured_requests[0]['generated_text'] == 'Scheduled copy', 'Expected generated text in webhook payload.'
        assert queue_data[0]['status'] == 'posted', 'Expected queue item to be marked posted after successful publication.'
        assert queue_data[0]['publish_jobs'][0]['status'] == 'published', 'Expected publish job to be marked published.'
        assert plan_data[0]['items'][0]['status'] == 'posted', 'Expected the plan item to be marked posted in plans.json.'

        server.shutdown()
        server.server_close()
        print('Scheduled publishing verification passed')


if __name__ == '__main__':
    main()



