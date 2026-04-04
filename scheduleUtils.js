const WEEKDAY_ALIASES = new Map([
  ['sun', 0],
  ['sunday', 0],
  ['mon', 1],
  ['monday', 1],
  ['tue', 2],
  ['tues', 2],
  ['tuesday', 2],
  ['wed', 3],
  ['wednesday', 3],
  ['thu', 4],
  ['thur', 4],
  ['thurs', 4],
  ['thursday', 4],
  ['fri', 5],
  ['friday', 5],
  ['sat', 6],
  ['saturday', 6],
]);

const DEFAULT_PUBLISH_HOUR = 9;
const DEFAULT_PUBLISH_MINUTE = 0;
const START_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toLocalDateInputValue(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseStartDate(startDate) {
  const normalized = normalizePlanStartDate(startDate);
  if (!normalized) return null;

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getWeekdayIndex(label) {
  return WEEKDAY_ALIASES.get(label.trim().toLowerCase()) ?? null;
}

function getDayOffsetWithinWeek(startDate, weekdayIndex) {
  return (weekdayIndex - startDate.getDay() + 7) % 7;
}

function getTimeParts(existingPublishAt) {
  if (typeof existingPublishAt !== 'string' || !existingPublishAt) {
    return { hours: DEFAULT_PUBLISH_HOUR, minutes: DEFAULT_PUBLISH_MINUTE };
  }

  const parsed = new Date(existingPublishAt);
  if (Number.isNaN(parsed.getTime())) {
    return { hours: DEFAULT_PUBLISH_HOUR, minutes: DEFAULT_PUBLISH_MINUTE };
  }

  return {
    hours: parsed.getHours(),
    minutes: parsed.getMinutes(),
  };
}

function normalizeScheduleLabel(dayLabel) {
  return typeof dayLabel === 'string'
    ? dayLabel.trim().replace(/\s+/g, ' ')
    : '';
}

export function normalizePlanStartDate(startDate) {
  if (typeof startDate !== 'string' || !startDate.trim()) return undefined;
  const trimmed = startDate.trim();
  if (START_DATE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return toLocalDateInputValue(parsed);
}

export function resolveItemSchedule(startDate, dayLabel, existingPublishAt) {
  const start = parseStartDate(startDate);
  if (!start) {
    return {
      publishAt: undefined,
      offsetDays: undefined,
      error: 'Set a plan start date to derive this item\'s publish day.',
    };
  }

  const label = normalizeScheduleLabel(dayLabel);
  if (!label) {
    return {
      publishAt: undefined,
      offsetDays: undefined,
      error: 'Add a day label such as Monday, Week 2 - Thursday, or Day 5.',
    };
  }

  const normalizedLabel = label.toLowerCase();
  let offsetDays = null;

  const weekdayIndex = getWeekdayIndex(normalizedLabel);
  if (weekdayIndex !== null) {
    offsetDays = getDayOffsetWithinWeek(start, weekdayIndex);
  }

  if (offsetDays === null) {
    const dayMatch = normalizedLabel.match(/^day\s+(\d+)$/);
    if (dayMatch) {
      offsetDays = Math.max(0, Number(dayMatch[1]) - 1);
    }
  }

  if (offsetDays === null) {
    const weekAndDayMatch = normalizedLabel.match(/^week\s+(\d+)\s*[-,]\s*(.+)$/);
    if (weekAndDayMatch) {
      const weekIndex = Math.max(0, Number(weekAndDayMatch[1]) - 1);
      const nestedWeekdayIndex = getWeekdayIndex(weekAndDayMatch[2]);
      if (nestedWeekdayIndex !== null) {
        offsetDays = weekIndex * 7 + getDayOffsetWithinWeek(start, nestedWeekdayIndex);
      } else {
        const nestedDayMatch = weekAndDayMatch[2].match(/^day\s+(\d+)$/);
        if (nestedDayMatch) {
          offsetDays = weekIndex * 7 + Math.max(0, Number(nestedDayMatch[1]) - 1);
        }
      }
    }
  }

  if (offsetDays === null) {
    const monthWeekMatch = normalizedLabel.match(/^month\s+(\d+)\s*,?\s*week\s+(\d+)(?:\s*[-,]\s*(.+))?$/);
    if (monthWeekMatch) {
      const monthIndex = Math.max(0, Number(monthWeekMatch[1]) - 1);
      const weekIndex = Math.max(0, Number(monthWeekMatch[2]) - 1);
      const baseOffset = monthIndex * 28 + weekIndex * 7;
      const nestedLabel = monthWeekMatch[3]?.trim();
      if (!nestedLabel) {
        offsetDays = baseOffset;
      } else {
        const nestedWeekdayIndex = getWeekdayIndex(nestedLabel);
        if (nestedWeekdayIndex !== null) {
          offsetDays = baseOffset + getDayOffsetWithinWeek(start, nestedWeekdayIndex);
        } else {
          const nestedDayMatch = nestedLabel.match(/^day\s+(\d+)$/);
          if (nestedDayMatch) {
            offsetDays = baseOffset + Math.max(0, Number(nestedDayMatch[1]) - 1);
          }
        }
      }
    }
  }

  if (offsetDays === null) {
    const weekMatch = normalizedLabel.match(/^week\s+(\d+)$/);
    if (weekMatch) {
      offsetDays = Math.max(0, Number(weekMatch[1]) - 1) * 7;
    }
  }

  if (offsetDays === null) {
    return {
      publishAt: undefined,
      offsetDays: undefined,
      error: 'Use labels like Monday, Week 2 - Thursday, Month 2, Week 3, or Day 5.',
    };
  }

  const publishDate = new Date(start);
  publishDate.setDate(start.getDate() + offsetDays);
  const timeParts = getTimeParts(existingPublishAt);
  publishDate.setHours(timeParts.hours, timeParts.minutes, 0, 0);

  return {
    publishAt: publishDate.toISOString(),
    offsetDays,
    error: null,
  };
}

export function applyDerivedScheduleToPlan(plan, { preserveExistingPublishAtWithoutStartDate = true } = {}) {
  if (!plan || typeof plan !== 'object') return plan;

  const startDate = normalizePlanStartDate(plan.startDate);
  const items = Array.isArray(plan.items) ? plan.items : [];

  return {
    ...plan,
    startDate,
    items: items.map((item) => {
      if (!item || typeof item !== 'object') return item;

      if (!startDate) {
        return {
          ...item,
          publishAt: preserveExistingPublishAtWithoutStartDate ? item.publishAt : undefined,
        };
      }

      const schedule = resolveItemSchedule(startDate, item.day, item.publishAt);
      return {
        ...item,
        publishAt: schedule.publishAt,
      };
    }),
  };
}

