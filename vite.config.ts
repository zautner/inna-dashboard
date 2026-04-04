import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { readHelpDocs } from './helpDocs.js';
import {
  createMediaUploadMiddleware,
  ensureStorage,
  persistPlans,
  readBotMonitor,
  readInnaContext,
  readPublishingOverview,
  readPlans,
  readQueueStats,
  resolveStoragePaths,
  writeInnaContext,
} from './plansStorage.js';

function plansApiPlugin() {
  const {
    plansFile: PLANS_FILE,
    botQueueFile: BOT_QUEUE_FILE,
    botActivityFile: BOT_ACTIVITY_FILE,
    uploadsDir: UPLOADS_DIR,
    innaContextFile: INNA_CONTEXT_FILE,
  } = resolveStoragePaths(process.cwd());

  ensureStorage({
    plansFile: PLANS_FILE,
    botQueueFile: BOT_QUEUE_FILE,
    botActivityFile: BOT_ACTIVITY_FILE,
    uploadsDir: UPLOADS_DIR,
    innaContextFile: INNA_CONTEXT_FILE,
  });

  const upload = createMediaUploadMiddleware(UPLOADS_DIR);

  return {
    name: 'plans-api',
    configureServer(server: any) {
      server.middlewares.use('/api/queue-stats', (_req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          res.end(JSON.stringify(readQueueStats(BOT_QUEUE_FILE)));
        } catch {
          res.end(JSON.stringify({ inQueue: 0, draftsPending: 0, approved: 0 }));
        }
      });

      server.middlewares.use('/api/bot-monitor', (_req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          res.end(JSON.stringify({
            ...readBotMonitor(BOT_ACTIVITY_FILE),
            publishing: readPublishingOverview(BOT_QUEUE_FILE),
          }));
        } catch {
          res.end(JSON.stringify({
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
          }));
        }
      });

      server.middlewares.use('/api/plans', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.method === 'GET') {
          res.end(JSON.stringify(readPlans(PLANS_FILE)));
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk; });
          req.on('end', () => {
            try {
              const plans = JSON.parse(body);
              persistPlans(plans, { plansFile: PLANS_FILE, botQueueFile: BOT_QUEUE_FILE, uploadsDir: UPLOADS_DIR });
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

      server.middlewares.use('/api/inna-context', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method === 'GET') {
          res.end(JSON.stringify(readInnaContext(INNA_CONTEXT_FILE)));
          return;
        }
        if (req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Body must be an object' }));
                return;
              }
              res.end(JSON.stringify(writeInnaContext(INNA_CONTEXT_FILE, payload)));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      server.middlewares.use('/api/help-docs', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        res.end(JSON.stringify({
          documents: readHelpDocs(process.cwd()),
        }));
      });

      server.middlewares.use('/api/media/upload', (req: any, res: any, _next: any) => {
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
