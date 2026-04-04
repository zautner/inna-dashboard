import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForServer(url, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Keep polling until timeout.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function readContext(baseUrl) {
  const res = await fetch(`${baseUrl}/api/inna-context`);
  assert(res.ok, `GET /api/inna-context failed: ${res.status}`);
  return res.json();
}

async function writeContext(baseUrl, payload) {
  const res = await fetch(`${baseUrl}/api/inna-context`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert(res.ok, `PUT /api/inna-context failed: ${res.status}`);
  return res.json();
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'inna-context-api-'));
const contextFile = path.join(tempRoot, 'inna-context.json');
const plansFile = path.join(tempRoot, 'plans.json');
const queueFile = path.join(tempRoot, 'media_queue.json');
const activityFile = path.join(tempRoot, 'bot_activity.json');
const uploadsDir = path.join(tempRoot, 'uploads');
const port = 39000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const server = spawn('node', ['server.js'], {
  cwd: path.resolve(scriptDir, '..'),
  env: {
    ...process.env,
    API_ONLY: 'true',
    API_PORT: String(port),
    INNA_CONTEXT_FILE: contextFile,
    PLANS_FILE: plansFile,
    BOT_QUEUE_FILE: queueFile,
    BOT_ACTIVITY_FILE: activityFile,
    UPLOADS_DIR: uploadsDir,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stderr = '';
server.stderr.on('data', chunk => {
  stderr += chunk.toString();
});

try {
  await waitForServer(`${baseUrl}/api/inna-context`);

  const initial = await readContext(baseUrl);
  assert(typeof initial.name === 'string' && initial.name.length > 0, 'Expected initial context payload with a non-empty name.');

  const updatedPayload = {
    ...initial,
    name: 'Inna QA',
    philosophy: 'Updated from integration test.',
    voice: {
      ...initial.voice,
      tone: 'Warm and practical.',
      forbiddenWords: ['test-forbidden-word'],
    },
    quotes: ['Integration quote 1', 'Integration quote 2'],
  };

  const writeResponse = await writeContext(baseUrl, updatedPayload);
  assert(writeResponse.name === 'Inna QA', 'Expected PUT response to include updated name.');

  const afterWrite = await readContext(baseUrl);
  assert(afterWrite.name === 'Inna QA', 'Expected GET after PUT to return updated name.');
  assert(afterWrite.voice?.tone === 'Warm and practical.', 'Expected updated voice tone to persist.');
  assert(Array.isArray(afterWrite.quotes) && afterWrite.quotes.length === 2, 'Expected updated quotes to persist.');

  const persistedOnDisk = JSON.parse(fs.readFileSync(contextFile, 'utf-8'));
  assert(persistedOnDisk.name === 'Inna QA', 'Expected context file on disk to include updated name.');

  console.log(`Inna context API verification passed on ${baseUrl}`);
} finally {
  server.kill('SIGTERM');
}


