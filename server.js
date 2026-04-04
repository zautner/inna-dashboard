/**
 * Production API server.
 * Serves the built React app and provides the /api/plans endpoint
 * that persists plans to plans.json and queues approved items for the bot.
 *
 * Usage:
 *   node server.js           (serves dist/ + API on port 3000)
 *   API_PORT=3001 node server.js  (API only, alongside Vite dev server)
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readHelpDocs } from './helpDocs.js';
import {
  createMediaUploadMiddleware,
  persistPlans,
  readBotMonitor,
  readInnaContext,
  readPublishingOverview,
  readPlans,
  readQueueStats,
  resolveStoragePaths,
  ensureStorage,
  writeInnaContext,
} from './plansStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  plansFile: PLANS_FILE,
  botQueueFile: BOT_QUEUE_FILE,
  botActivityFile: BOT_ACTIVITY_FILE,
  uploadsDir: UPLOADS_DIR,
  innaContextFile: INNA_CONTEXT_FILE,
} = resolveStoragePaths(__dirname);
const PORT = parseInt(process.env.API_PORT || process.env.PORT || '3000', 10);
const SERVE_STATIC = process.env.API_ONLY !== 'true';

ensureStorage({
  plansFile: PLANS_FILE,
  botQueueFile: BOT_QUEUE_FILE,
  botActivityFile: BOT_ACTIVITY_FILE,
  uploadsDir: UPLOADS_DIR,
  innaContextFile: INNA_CONTEXT_FILE,
});

const app = express();
app.use(express.json());

// Serve uploaded media files
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = createMediaUploadMiddleware(UPLOADS_DIR);

// Apply rate limiting to all API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // max 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Serve built React app in production
if (SERVE_STATIC) {
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
  }
}

// POST /api/media/upload — upload a media file and return its public URL
app.post('/api/media/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// GET /api/queue-stats — return per-status counts from the bot queue
app.get('/api/queue-stats', (_req, res) => {
  try {
    res.json(readQueueStats(BOT_QUEUE_FILE));
  } catch {
    res.json({ inQueue: 0, draftsPending: 0, approved: 0 });
  }
});

app.get('/api/bot-monitor', (_req, res) => {
  try {
    res.json({
      ...readBotMonitor(BOT_ACTIVITY_FILE),
      publishing: readPublishingOverview(BOT_QUEUE_FILE),
    });
  } catch {
    res.json({
      commands: [],
      severeErrors: [],
      lastUpdatedAt: null,
      publishing: {
        waitingForApproval: 0,
        waitingForSchedule: 0,
        scheduledTargets: 0,
        publishedTargets: 0,
        failedTargets: 0,
        nextPublishAt: null,
        upcoming: [],
      },
    });
  }
});

// GET /api/plans — load all saved plans
app.get('/api/plans', (_req, res) => {
  try {
    res.json(readPlans(PLANS_FILE));
  } catch {
    res.json([]);
  }
});

// POST /api/plans — save plans and queue approved items for the bot
app.post('/api/plans', (req, res) => {
  try {
    const plans = req.body;
    if (!Array.isArray(plans)) {
      return res.status(400).json({ error: 'Body must be an array of plans' });
    }
    persistPlans(plans, { plansFile: PLANS_FILE, botQueueFile: BOT_QUEUE_FILE, uploadsDir: UPLOADS_DIR });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/inna-context', (_req, res) => {
  try {
    res.json(readInnaContext(INNA_CONTEXT_FILE));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/inna-context', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ error: 'Body must be an object' });
    }
    const saved = writeInnaContext(INNA_CONTEXT_FILE, payload);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/help-docs', (_req, res) => {
  try {
    res.json({
      documents: readHelpDocs(__dirname),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// SPA fallback — serve index.html for all non-API routes
if (SERVE_STATIC) {
  app.get('*', (_req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not found — run npm run build first.');
    }
  });
}


app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
