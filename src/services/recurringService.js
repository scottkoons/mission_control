import { v4 as uuidv4 } from 'uuid';
import {
  addDays,
  addWeeks,
  addMonths,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  setDate,
  isBefore,
  isAfter,
  isSameMonth,
} from 'date-fns';
import { getMonthKey } from '../utils/dateUtils';

// Get months that have non-recurring tasks
export const getMonthsWithNonRecurringTasks = (tasks) => {
  const months = new Set();

  tasks.forEach((task) => {
    if (task.isRecurring || task.completedAt) return;

    if (task.draftDue) {
      months.add(getMonthKey(task.draftDue));
    }
    if (task.finalDue) {
      months.add(getMonthKey(task.finalDue));
    }
  });

  return Array.from(months);
};

// Get recurring template tasks (tasks with repeat !== 'none')
export const getRecurringTemplates = (tasks) => {
  return tasks.filter(
    (task) => task.repeat && task.repeat !== 'none' && !task.isRecurring && !task.completedAt
  );
};

// Calculate next occurrence date based on repeat type
export const getNextOccurrence = (baseDate, repeatType, targetMonth) => {
  if (!baseDate) return null;

  const base = typeof baseDate === 'string' ? parseISO(baseDate) : baseDate;
  const [year, month] = targetMonth.split('-');
  const targetStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
  const targetEnd = endOfMonth(targetStart);

  let nextDate = new Date(base);

  switch (repeatType) {
    case 'daily':
      // For daily, use the first day of target month
      nextDate = targetStart;
      break;

    case 'weekly':
      // Get same day of week in target month
      const dayOfWeek = base.getDay();
      nextDate = targetStart;
      // Move to the same day of week
      while (nextDate.getDay() !== dayOfWeek) {
        nextDate = addDays(nextDate, 1);
      }
      break;

    case 'biweekly':
      // Similar to weekly but every other week
      const biweeklyDay = base.getDay();
      nextDate = targetStart;
      while (nextDate.getDay() !== biweeklyDay) {
        nextDate = addDays(nextDate, 1);
      }
      break;

    case 'monthly':
      // Same day of month
      const dayOfMonth = base.getDate();
      nextDate = setDate(targetStart, Math.min(dayOfMonth, targetEnd.getDate()));
      break;

    case 'monthly-15th':
      // Always the 15th
      nextDate = setDate(targetStart, 15);
      break;

    default:
      return null;
  }

  // Ensure the date is within the target month
  if (isBefore(nextDate, targetStart) || isAfter(nextDate, targetEnd)) {
    return null;
  }

  return format(nextDate, 'yyyy-MM-dd');
};

// Generate all occurrences within a month for daily/weekly/biweekly
const generateWithinMonthOccurrences = (template, existingKeys) => {
  const instances = [];
  if (!template.draftDue) return instances;

  const baseDate = parseISO(template.draftDue);
  const baseFinalDate = template.finalDue ? parseISO(template.finalDue) : null;
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);

  // Calculate the offset between draft and final due dates
  const dayOffset = baseFinalDate
    ? Math.round((baseFinalDate - baseDate) / (1000 * 60 * 60 * 24))
    : 0;

  let interval;
  switch (template.repeat) {
    case 'daily':
      interval = 1;
      break;
    case 'weekly':
      interval = 7;
      break;
    case 'biweekly':
      interval = 14;
      break;
    default:
      return instances;
  }

  // Start from the first occurrence after the original date
  let currentDate = addDays(baseDate, interval);

  while (currentDate <= monthEnd) {
    const draftDue = format(currentDate, 'yyyy-MM-dd');
    const finalDue = baseFinalDate
      ? format(addDays(currentDate, dayOffset), 'yyyy-MM-dd')
      : null;

    const instanceKey = `${template.id}-${draftDue}-${finalDue}`;
    if (!existingKeys.has(instanceKey)) {
      instances.push({
        id: uuidv4(),
        taskName: template.taskName,
        notes: template.notes,
        draftDue,
        finalDue,
        draftComplete: false,
        finalComplete: false,
        completedAt: null,
        attachments: [],
        repeat: 'none',
        isRecurring: true,
        recurringParentId: template.id,
        sortOrder: template.sortOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      existingKeys.add(instanceKey);
    }

    currentDate = addDays(currentDate, interval);
  }

  return instances;
};

// Generate recurring instances for visible months
export const generateRecurringInstances = (tasks, existingInstances = []) => {
  const monthsWithTasks = getMonthsWithNonRecurringTasks(tasks);
  const templates = getRecurringTemplates(tasks);
  const newInstances = [];

  // Track existing instance keys to avoid duplicates
  const existingKeys = new Set(
    existingInstances.map((t) => `${t.recurringParentId}-${t.draftDue}-${t.finalDue}`)
  );

  templates.forEach((template) => {
    const repeatType = template.repeat;

    // For daily/weekly/biweekly: generate occurrences within the same month only
    if (repeatType === 'daily' || repeatType === 'weekly' || repeatType === 'biweekly') {
      const withinMonthInstances = generateWithinMonthOccurrences(template, existingKeys);
      newInstances.push(...withinMonthInstances);
      return;
    }

    // For monthly/monthly-15th: generate for all months with tasks
    monthsWithTasks.forEach((monthKey) => {
      // Skip if the template's original month matches (the original is already there)
      const templateMonth = template.draftDue ? getMonthKey(template.draftDue) : null;
      if (templateMonth === monthKey) return;

      // Calculate next occurrence dates for this month
      const draftDue = template.draftDue
        ? getNextOccurrence(template.draftDue, template.repeat, monthKey)
        : null;
      const finalDue = template.finalDue
        ? getNextOccurrence(template.finalDue, template.repeat, monthKey)
        : null;

      // Skip if no dates generated
      if (!draftDue && !finalDue) return;

      // Check for duplicate
      const instanceKey = `${template.id}-${draftDue}-${finalDue}`;
      if (existingKeys.has(instanceKey)) return;

      // Create the recurring instance
      const instance = {
        id: uuidv4(),
        taskName: template.taskName,
        notes: template.notes,
        draftDue,
        finalDue,
        draftComplete: false,
        finalComplete: false,
        completedAt: null,
        attachments: [], // Don't copy attachments to instances
        repeat: 'none', // Instance doesn't repeat
        isRecurring: true,
        recurringParentId: template.id,
        sortOrder: template.sortOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newInstances.push(instance);
      existingKeys.add(instanceKey);
    });
  });

  return newInstances;
};

// Get all tasks including generated recurring instances
export const getTasksWithRecurring = (tasks) => {
  // Separate existing recurring instances
  const regularTasks = tasks.filter((t) => !t.isRecurring);
  const existingInstances = tasks.filter((t) => t.isRecurring);

  // Generate new instances
  const newInstances = generateRecurringInstances(regularTasks, existingInstances);

  // Combine all tasks
  return [...tasks, ...newInstances];
};
