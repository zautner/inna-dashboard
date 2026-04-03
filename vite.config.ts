import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function plansApiPlugin() {
  const PLANS_FILE = path.join(process.cwd(), 'plans.json');
  const BOT_QUEUE_FILE = path.join(process.cwd(), 'bot', 'media_queue.json');
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed'));
      }
    },
  });

  function buildPlanItemCaption(planName: string, item: any): string {
    const tags = item.tags && item.tags.length ? ` | Tags: ${(item.tags as string[]).join(', ')}` : '';
    return `Plan: ${planName} | ${item.day} | ${(item.contentTypes as string[]).join(', ')}${tags}`;
  }

  function queueApprovedItemsForBot(plans: any[]) {
    let botQueue: any[] = [];
    if (fs.existsSync(BOT_QUEUE_FILE)) {
      try { botQueue = JSON.parse(fs.readFileSync(BOT_QUEUE_FILE, 'utf-8')); } catch { /* ignore */ }
    }
    const existingPlanItemIds = new Set(botQueue.filter(i => i.plan_item_id).map(i => i.plan_item_id));
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

  return {
    name: 'plans-api',
    configureServer(server: any) {
      server.middlewares.use('/api/queue-stats', (_req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          const queue: any[] = fs.existsSync(BOT_QUEUE_FILE)
            ? JSON.parse(fs.readFileSync(BOT_QUEUE_FILE, 'utf-8'))
            : [];
          const inQueue = queue.filter(i => ['new', 'waiting_media'].includes(i.status)).length;
          const draftsPending = queue.filter(i => ['draft', 'rethinking'].includes(i.status)).length;
          const approved = queue.filter(i => i.status === 'approved').length;
          res.end(JSON.stringify({ inQueue, draftsPending, approved }));
        } catch {
          res.end(JSON.stringify({ inQueue: 0, draftsPending: 0, approved: 0 }));
        }
      });

      server.middlewares.use('/api/plans', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.method === 'GET') {
          const data = fs.existsSync(PLANS_FILE)
            ? JSON.parse(fs.readFileSync(PLANS_FILE, 'utf-8'))
            : [];
          res.end(JSON.stringify(data));
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk; });
          req.on('end', () => {
            try {
              const plans = JSON.parse(body);
              fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2), 'utf-8');
              queueApprovedItemsForBot(plans);
              res.end(JSON.stringify({ success: true }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      server.middlewares.use('/api/media/upload', (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        upload.single('file')(req, res, (err: any) => {
          res.setHeader('Content-Type', 'application/json');
          if (err || !req.file) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: err?.message ?? 'No file received' }));
            return;
          }
          res.end(JSON.stringify({ url: `/uploads/${req.file.filename}` }));
        });
      });

      // Serve uploaded files with path-traversal protection
      server.middlewares.use('/uploads', (req: any, res: any, next: any) => {
        const relativePath = path.normalize(decodeURIComponent(req.url ?? '')).split('?')[0];
        // Reject absolute paths and any traversal attempts
        if (path.isAbsolute(relativePath) || relativePath.includes('..')) {
          res.statusCode = 400;
          res.end('Bad request');
          return;
        }
        const filePath = path.join(UPLOADS_DIR, relativePath);
        // Ensure the resolved path stays inside UPLOADS_DIR
        if (!filePath.startsWith(UPLOADS_DIR + path.sep) && filePath !== UPLOADS_DIR) {
          res.statusCode = 400;
          res.end('Bad request');
          return;
        }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
            '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
            '.mkv': 'video/x-matroska', '.webm': 'video/webm',
          };
          res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), plansApiPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.TELEGRAM_BOT_USERNAME': JSON.stringify(env.TELEGRAM_BOT_USERNAME ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
