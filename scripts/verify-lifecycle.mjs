import fs from 'fs';
import os from 'os';
import path from 'path';
import { persistPlans, readPlans, readQueueStats } from '../plansStorage.js';
import { resolveItemSchedule } from '../scheduleUtils.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createPlanWithItem({ mediaUrl, uploadedMediaType, status = 'approved' }) {
  return [{
    id: 'plan-1',
    name: 'Weekly Plan',
    type: 'week',
    status: 'open',
    startDate: '2026-04-06',
    items: [{
      id: 'item-1',
      day: 'Monday',
      mediaType: 'any',
      uploadedMediaType,
      contentTypes: ['Instagram Feed'],
      status,
      mediaUrl,
      tags: ['shiatsu'],
    }],
  }];
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'inna-dashboard-lifecycle-'));
const plansFile = path.join(tempRoot, 'plans.json');
const botQueueFile = path.join(tempRoot, 'media_queue.json');
const uploadsDir = path.join(tempRoot, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const oldFile = path.join(uploadsDir, 'old.jpg');
const newFile = path.join(uploadsDir, 'new.mp4');
fs.writeFileSync(oldFile, 'old-media');
fs.writeFileSync(newFile, 'new-media');

// 1. Save a new plan with one processing item and verify persistence + queue creation.
const initialPlans = createPlanWithItem({ mediaUrl: '/uploads/old.jpg', uploadedMediaType: 'photo' });
const expectedPublishAt = resolveItemSchedule('2026-04-06', 'Monday').publishAt;
persistPlans(initialPlans, { plansFile, botQueueFile, uploadsDir });

const initialQueue = JSON.parse(fs.readFileSync(botQueueFile, 'utf8'));
assert(initialQueue.length === 1, 'Expected one queue item after initial save.');
assert(initialQueue[0].plan_item_id === 'item-1', 'Expected queue item to reference the plan item.');
assert(initialQueue[0].media_url === '/uploads/old.jpg', 'Expected queue item to point at the uploaded photo.');
assert(initialQueue[0].file_type === 'photo', 'Expected queue item to preserve the uploaded media type.');
assert(initialQueue[0].publish_at === expectedPublishAt, 'Expected queue item publish_at to be derived from plan start date and item day.');
assert(readPlans(plansFile)[0].status === 'open', 'Expected the saved plan to remain open.');
assert(readPlans(plansFile)[0].items[0].publishAt === expectedPublishAt, 'Expected the saved plan item publishAt to be derived automatically.');
assert(readQueueStats(botQueueFile).inQueue === 1, 'Expected queue stats to report one queued item.');

// 2. Replace the media and verify queue update + server-file cleanup.
const replacedPlans = createPlanWithItem({ mediaUrl: '/uploads/new.mp4', uploadedMediaType: 'video' });
persistPlans(replacedPlans, { plansFile, botQueueFile, uploadsDir });

const replacedQueue = JSON.parse(fs.readFileSync(botQueueFile, 'utf8'));
assert(replacedQueue.length === 1, 'Expected the queue entry to be updated, not duplicated.');
assert(replacedQueue[0].media_url === '/uploads/new.mp4', 'Expected queue item to point at the replacement media.');
assert(replacedQueue[0].file_type === 'video', 'Expected replacement media type to be reflected in the queue.');
assert(!fs.existsSync(oldFile), 'Expected old uploaded media to be deleted after replacement.');
assert(fs.existsSync(newFile), 'Expected replacement uploaded media to remain on disk.');

// 3. Delete the media from the item and verify queue cleanup + file deletion.
const mediaDeletedPlans = createPlanWithItem({ mediaUrl: undefined, uploadedMediaType: undefined, status: 'preparing' });
persistPlans(mediaDeletedPlans, { plansFile, botQueueFile, uploadsDir });

const queueAfterMediaDelete = JSON.parse(fs.readFileSync(botQueueFile, 'utf8'));
assert(queueAfterMediaDelete.length === 0, 'Expected queue item to be removed after deleting the item media.');
assert(!fs.existsSync(newFile), 'Expected replacement uploaded media to be deleted after removing it from the plan item.');

// 4. Close the plan and verify the state is persisted.
const closedPlans = [{ ...mediaDeletedPlans[0], status: 'closed' }];
persistPlans(closedPlans, { plansFile, botQueueFile, uploadsDir });
assert(readPlans(plansFile)[0].status === 'closed', 'Expected the plan closed state to be persisted.');

// 5. Delete the plan and verify cleanup.
persistPlans([], { plansFile, botQueueFile, uploadsDir });
assert(readPlans(plansFile).length === 0, 'Expected no plans after deleting the plan.');
assert(readQueueStats(botQueueFile).inQueue === 0, 'Expected an empty queue after deleting the plan.');

console.log(`Lifecycle verification passed in temporary workspace: ${tempRoot}`);

