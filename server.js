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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PLANS_FILE = path.join(__dirname, 'plans.json');
const BOT_QUEUE_FILE = path.join(__dirname, 'bot', 'media_queue.json');
const PORT = parseInt(process.env.API_PORT || process.env.PORT || '3000', 10);
const SERVE_STATIC = process.env.API_ONLY !== 'true';

const app = express();
app.use(express.json());

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

// GET /api/queue-stats — return per-status counts from the bot queue
app.get('/api/queue-stats', (_req, res) => {
  try {
    const queue = fs.existsSync(BOT_QUEUE_FILE)
      ? JSON.parse(fs.readFileSync(BOT_QUEUE_FILE, 'utf-8'))
      : [];
    const inQueue = queue.filter(i => ['new', 'waiting_media'].includes(i.status)).length;
    const draftsPending = queue.filter(i => ['draft', 'rethinking'].includes(i.status)).length;
    const approved = queue.filter(i => i.status === 'approved').length;
    res.json({ inQueue, draftsPending, approved });
  } catch {
    res.json({ inQueue: 0, draftsPending: 0, approved: 0 });
  }
});

// GET /api/plans — load all saved plans
app.get('/api/plans', (_req, res) => {
  try {
    const data = fs.existsSync(PLANS_FILE)
      ? JSON.parse(fs.readFileSync(PLANS_FILE, 'utf-8'))
      : [];
    res.json(data);
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
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2), 'utf-8');
    queueApprovedItemsForBot(plans);
    res.json({ success: true });
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

/**
 * Builds a human-readable caption for a plan item used as context by the bot.
 */
function buildPlanItemCaption(planName, item) {
  const tags = item.tags && item.tags.length ? ` | Tags: ${item.tags.join(', ')}` : '';
  return `Plan: ${planName} | ${item.day} | ${item.contentTypes.join(', ')}${tags}`;
}

/**
 * Adds approved plan items that are not yet in the bot queue to media_queue.json.
 * The bot detects items with file_id === null (plan items) and requests media from Inna.
 */
function queueApprovedItemsForBot(plans) {
  let botQueue = [];
  if (fs.existsSync(BOT_QUEUE_FILE)) {
    try { botQueue = JSON.parse(fs.readFileSync(BOT_QUEUE_FILE, 'utf-8')); } catch { /* ignore */ }
  }

  const existingPlanItemIds = new Set(
    botQueue.filter(i => i.plan_item_id).map(i => i.plan_item_id)
  );

  let changed = false;
  for (const plan of plans) {
    for (const item of plan.items) {
      if (item.status === 'approved' && !existingPlanItemIds.has(item.id)) {
        const shortId = String(item.id).slice(-8);
        botQueue.push({
          id: `pi-${shortId}`,
          plan_item_id: item.id,
          plan_id: plan.id,
          plan_name: plan.name,
          file_id: null,
          file_type: item.mediaType === 'any' ? 'photo' : item.mediaType,
          caption: buildPlanItemCaption(plan.name, item),
          status: 'new',
          generated_text: '',
        });
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(BOT_QUEUE_FILE, JSON.stringify(botQueue, null, 2), 'utf-8');
  }
}

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
