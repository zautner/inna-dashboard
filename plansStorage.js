import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { applyDerivedScheduleToPlan } from './scheduleUtils.js';

const PLAN_ITEM_PROCESSING_STATUS = 'approved';
const UPLOAD_ROUTE_PREFIX = '/uploads/';
const DEFAULT_INNA_CONTEXT = {
  name: 'Inna',
  specialty: 'Shiatsu & Chinese Medicine',
  location: 'Tel Aviv, Gush Dan (Givatayim, Ramat Gan, Holon, Bat Yam)',
  philosophy: "Shiatsu is about touch and Qi flow. It's not just physical tissue; it's about helping the body heal itself by smoothing the flow of energy.",
  voice: {
    tone: 'Warm, human, expert but accessible, no corporate jargon, first-person.',
    forbiddenWords: ['my dear', 'sweetie', 'listen to me', 'I know best', 'final decision'],
    style: 'Short, to the point, leaving room for discussion.',
  },
  targetAudience: 'Women 40+, often with orthopedic issues (back, neck, shoulder pain), general fatigue, or lack of sleep.',
  quotes: [
    'Shiatsu is about Qi flow. If there is smooth flow, the person feels good. If there is stagnation, we feel pain.',
    'The treatment is who you are. The difference between masters is the quality of touch.',
    "I don't believe in just massage. Only the brain can release the muscle. In Shiatsu, we create a connection with the brain.",
    "It's a dialogue between practitioner and patient.",
  ],
};

export function resolveStoragePaths(rootDir) {
  return {
    plansFile: process.env.PLANS_FILE || path.join(rootDir, 'plans.json'),
    botQueueFile: process.env.BOT_QUEUE_FILE || path.join(rootDir, 'bot', 'media_queue.json'),
    botActivityFile: process.env.BOT_ACTIVITY_FILE || path.join(rootDir, 'bot', 'bot_activity.json'),
    uploadsDir: process.env.UPLOADS_DIR || path.join(rootDir, 'uploads'),
    innaContextFile: process.env.INNA_CONTEXT_FILE || path.join(rootDir, 'inna-context.json'),
  };
}

export function ensureStorage({ plansFile, botQueueFile, botActivityFile, uploadsDir, innaContextFile }) {
  fs.mkdirSync(path.dirname(plansFile), { recursive: true });
  fs.mkdirSync(path.dirname(botQueueFile), { recursive: true });
  if (botActivityFile) {
    fs.mkdirSync(path.dirname(botActivityFile), { recursive: true });
  }
  fs.mkdirSync(uploadsDir, { recursive: true });
  if (innaContextFile) {
    fs.mkdirSync(path.dirname(innaContextFile), { recursive: true });
    if (!fs.existsSync(innaContextFile)) {
      fs.writeFileSync(innaContextFile, JSON.stringify(DEFAULT_INNA_CONTEXT, null, 2), 'utf-8');
    }
  }
}

export function readInnaContext(innaContextFile) {
  const parsed = readJsonObjectFile(innaContextFile);
  return normalizeInnaContext(parsed);
}

export function writeInnaContext(innaContextFile, context) {
  const normalizedContext = normalizeInnaContext(context);
  fs.mkdirSync(path.dirname(innaContextFile), { recursive: true });
  fs.writeFileSync(innaContextFile, JSON.stringify(normalizedContext, null, 2), 'utf-8');
  return normalizedContext;
}

export function createMediaUploadMiddleware(uploadsDir) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
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
}

export function readPlans(plansFile) {
  return readJsonFile(plansFile);
}

export function readQueueStats(botQueueFile) {
  const queue = readJsonFile(botQueueFile);
  return {
    inQueue: queue.filter(item => ['new', 'waiting_media'].includes(item.status)).length,
    draftsPending: queue.filter(item => ['draft', 'rethinking'].includes(item.status)).length,
    approved: queue.filter(item => item.status === 'approved').length,
  };
}

export function readPublishingOverview(botQueueFile) {
  const queue = readJsonFile(botQueueFile);
  const overview = {
    waitingForApproval: 0,
    waitingForSchedule: 0,
    scheduledTargets: 0,
    publishedTargets: 0,
    failedTargets: 0,
    nextPublishAt: null,
    upcoming: [],
  };

  for (const item of queue) {
    const publishJobs = Array.isArray(item.publish_jobs) ? item.publish_jobs : [];
    if (item.status === 'draft' || item.status === 'rethinking') {
      overview.waitingForApproval += 1;
    }
    if (item.status === 'approved' && !item.publish_at) {
      overview.waitingForSchedule += 1;
    }

    if (item.status === 'approved' || item.status === 'posted') {
      for (const job of publishJobs) {
        if (job.status === 'scheduled') {
          overview.scheduledTargets += 1;
        } else if (job.status === 'published') {
          overview.publishedTargets += 1;
        } else if (job.status === 'failed') {
          overview.failedTargets += 1;
        }
      }
    }

    if (item.status === 'approved' && item.publish_at && publishJobs.some(job => job.status === 'scheduled')) {
      if (!overview.nextPublishAt || String(item.publish_at) < String(overview.nextPublishAt)) {
        overview.nextPublishAt = item.publish_at;
      }
      overview.upcoming.push({
        id: item.id,
        planName: item.plan_name ?? '',
        caption: item.caption ?? '',
        publishAt: item.publish_at,
        targets: publishJobs.filter(job => job.status === 'scheduled').map(job => job.target),
      });
    }
  }

  overview.upcoming.sort((left, right) => String(left.publishAt).localeCompare(String(right.publishAt)));
  overview.upcoming = overview.upcoming.slice(0, 5);
  return overview;
}

export function readBotMonitor(botActivityFile, { commandLimit = 20, errorLimit = 10 } = {}) {
  const activity = readJsonFile(botActivityFile)
    .filter(entry => entry && typeof entry === 'object')
    .sort((left, right) => String(right.timestamp ?? '').localeCompare(String(left.timestamp ?? '')));

  return {
    commands: activity
      .filter(entry => entry.kind === 'command')
      .slice(0, commandLimit),
    severeErrors: activity
      .filter(entry => entry.kind === 'error')
      .slice(0, errorLimit),
    lastUpdatedAt: activity[0]?.timestamp ?? null,
  };
}

export function buildPlanItemCaption(planName, item) {
  const tags = item.tags && item.tags.length ? ` | Tags: ${item.tags.join(', ')}` : '';
  const publishAt = item.publishAt ? ` | Publish: ${item.publishAt}` : '';
  return `Plan: ${planName} | ${item.day} | ${item.contentTypes.join(', ')}${tags}${publishAt}`;
}

export function persistPlans(plans, { plansFile, botQueueFile, uploadsDir }) {
  ensureStorage({ plansFile, botQueueFile, uploadsDir });

  const normalizedPlans = Array.isArray(plans)
    ? plans.map(plan => applyDerivedScheduleToPlan(plan))
    : [];
  const previousPlans = readPlans(plansFile);
  fs.writeFileSync(plansFile, JSON.stringify(normalizedPlans, null, 2), 'utf-8');

  syncBotQueue(normalizedPlans, botQueueFile);
  deleteRemovedUploads(previousPlans, normalizedPlans, uploadsDir);
}

function syncBotQueue(plans, botQueueFile) {
  const existingQueue = readJsonFile(botQueueFile);
  const desiredPlanItems = new Map();

  for (const plan of plans) {
    for (const item of plan.items ?? []) {
      const mediaUrl = normalizeUploadUrl(item.mediaUrl);
      if (item.status !== PLAN_ITEM_PROCESSING_STATUS || !mediaUrl) continue;

      const publishTargets = Array.isArray(item.contentTypes) ? [...new Set(item.contentTypes)] : [];
      const existingQueueItem = existingQueue.find(queueItem => queueItem.plan_item_id === item.id);

      desiredPlanItems.set(item.id, {
        plan_item_id: item.id,
        plan_id: plan.id,
        plan_name: plan.name,
        file_id: null,
        file_type: item.uploadedMediaType ?? inferFileTypeFromMediaUrl(mediaUrl) ?? (item.mediaType === 'any' ? 'photo' : item.mediaType),
        caption: buildPlanItemCaption(plan.name, item),
        media_url: mediaUrl,
        publish_at: item.publishAt ?? null,
        publish_targets: publishTargets,
        publish_jobs: mergePublishJobs(existingQueueItem?.publish_jobs, publishTargets),
        status: 'new',
        generated_text: '',
      });
    }
  }

  const nextQueue = [];
  const remainingDesiredIds = new Set(desiredPlanItems.keys());

  for (const queueItem of existingQueue) {
    if (!queueItem.plan_item_id) {
      nextQueue.push(queueItem);
      continue;
    }

    const desired = desiredPlanItems.get(queueItem.plan_item_id);
    if (!desired) continue;

    nextQueue.push({
      ...queueItem,
      ...desired,
      id: queueItem.id || `pi-${String(queueItem.plan_item_id).slice(-8)}`,
      status: queueItem.status ?? desired.status,
      generated_text: queueItem.generated_text ?? desired.generated_text,
      file_id: queueItem.file_id ?? desired.file_id,
    });
    remainingDesiredIds.delete(queueItem.plan_item_id);
  }

  for (const planItemId of remainingDesiredIds) {
    const desired = desiredPlanItems.get(planItemId);
    nextQueue.push({
      id: `pi-${String(planItemId).slice(-8)}`,
      ...desired,
    });
  }

  fs.writeFileSync(botQueueFile, JSON.stringify(nextQueue, null, 2), 'utf-8');
}

function mergePublishJobs(existingPublishJobs, publishTargets) {
  const existingByTarget = new Map(
    Array.isArray(existingPublishJobs)
      ? existingPublishJobs
          .filter(job => job && typeof job.target === 'string')
          .map(job => [job.target, job])
      : []
  );

  return publishTargets.map(target => {
    const existingJob = existingByTarget.get(target);
    return existingJob
      ? { ...existingJob, target }
      : { target, status: 'scheduled', attempts: 0, last_error: null, published_at: null };
  });
}

function deleteRemovedUploads(previousPlans, nextPlans, uploadsDir) {
  const previousUrls = collectUploadUrls(previousPlans);
  const nextUrls = collectUploadUrls(nextPlans);

  for (const mediaUrl of previousUrls) {
    if (nextUrls.has(mediaUrl)) continue;
    const filePath = getUploadFilePath(mediaUrl, uploadsDir);
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    }
  }
}

function collectUploadUrls(plans) {
  const urls = new Set();
  for (const plan of plans) {
    for (const item of plan.items ?? []) {
      const mediaUrl = normalizeUploadUrl(item.mediaUrl);
      if (mediaUrl) urls.add(mediaUrl);
    }
  }
  return urls;
}

function getUploadFilePath(mediaUrl, uploadsDir) {
  const normalized = normalizeUploadUrl(mediaUrl);
  if (!normalized) return null;
  return path.join(uploadsDir, path.basename(normalized));
}

function normalizeUploadUrl(mediaUrl) {
  if (typeof mediaUrl !== 'string' || !mediaUrl.startsWith(UPLOAD_ROUTE_PREFIX)) {
    return null;
  }

  const fileName = path.basename(mediaUrl);
  if (!fileName || fileName === '.' || fileName === '..') {
    return null;
  }

  return `${UPLOAD_ROUTE_PREFIX}${fileName}`;
}

function inferFileTypeFromMediaUrl(mediaUrl) {
  const ext = path.extname(mediaUrl).toLowerCase();
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) return 'video';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(ext)) return 'photo';
  return null;
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readJsonObjectFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeInnaContext(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const defaultVoice = DEFAULT_INNA_CONTEXT.voice;
  const sourceVoice = source.voice && typeof source.voice === 'object' && !Array.isArray(source.voice) ? source.voice : {};

  return {
    name: sanitizeString(source.name, DEFAULT_INNA_CONTEXT.name),
    specialty: sanitizeString(source.specialty, DEFAULT_INNA_CONTEXT.specialty),
    location: sanitizeString(source.location, DEFAULT_INNA_CONTEXT.location),
    philosophy: sanitizeString(source.philosophy, DEFAULT_INNA_CONTEXT.philosophy),
    voice: {
      tone: sanitizeString(sourceVoice.tone, defaultVoice.tone),
      forbiddenWords: sanitizeStringList(sourceVoice.forbiddenWords, defaultVoice.forbiddenWords),
      style: sanitizeString(sourceVoice.style, defaultVoice.style),
    },
    targetAudience: sanitizeString(source.targetAudience, DEFAULT_INNA_CONTEXT.targetAudience),
    quotes: sanitizeStringList(source.quotes, DEFAULT_INNA_CONTEXT.quotes),
  };
}

function sanitizeString(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function sanitizeStringList(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  const normalized = value
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return normalized.length ? normalized : [...fallback];
}

