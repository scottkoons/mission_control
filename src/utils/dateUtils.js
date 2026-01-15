import { format, parseISO, isValid, startOfMonth, endOfMonth, addDays, addWeeks, nextMonday, setDate } from 'date-fns';

// Format a date string for display
export const formatDate = (dateString, formatStr = 'MMM dd') => {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(date)) return '-';
  return format(date, formatStr);
};

// Format date for input fields (YYYY-MM-DD)
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
};

// Get month key from a date (e.g., "2026-01")
export const getMonthKey = (dateString) => {
  if (!dateString) return null;
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(date)) return null;
  return format(date, 'yyyy-MM');
};

// Get month display name (e.g., "January 2026")
export const getMonthDisplayName = (monthKey) => {
  if (!monthKey || monthKey === 'unscheduled') return 'Unscheduled';
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, 'MMMM yyyy');
};

// Get quick date shortcuts
export const getQuickDates = () => {
  const today = new Date();
  return {
    tomorrow: addDays(today, 1),
    nextMonday: nextMonday(today),
    endOfMonth: endOfMonth(today),
    plusOneWeek: addWeeks(today, 1),
  };
};

// Parse ISO date string to Date object
export const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return isValid(date) ? date : null;
};

// Check if date is overdue
export const isOverdue = (dateString, isComplete) => {
  if (isComplete || !dateString) return false;
  const date = parseDate(dateString);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

// Check if date is due within N days
export const isDueWithinDays = (dateString, days, isComplete) => {
  if (isComplete || !dateString) return false;
  const date = parseDate(dateString);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
};

// Get date badge status
export const getDateStatus = (dateString, isComplete) => {
  if (isComplete) return 'completed';
  if (!dateString) return 'none';
  if (isOverdue(dateString)) return 'overdue';
  if (isDueWithinDays(dateString, 3)) return 'soon';
  return 'future';
};

// Sort dates (null dates go last)
export const sortByDate = (a, b, field = 'draftDue') => {
  const dateA = a[field];
  const dateB = b[field];

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return new Date(dateA) - new Date(dateB);
};

// Group tasks by month
export const groupTasksByMonth = (tasks, dateField = 'draftDue') => {
  const groups = {};

  tasks.forEach((task) => {
    const monthKey = task[dateField] ? getMonthKey(task[dateField]) : 'unscheduled';
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(task);
  });

  // Sort keys (with unscheduled at the end)
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'unscheduled') return 1;
    if (b === 'unscheduled') return -1;
    return a.localeCompare(b);
  });

  return { groups, sortedKeys };
};

// Get all unique months from tasks (for calendar navigation)
export const getTaskMonths = (tasks, dateField = 'draftDue') => {
  const months = new Set();
  tasks.forEach((task) => {
    if (task[dateField]) {
      months.add(getMonthKey(task[dateField]));
    }
  });
  return Array.from(months).sort();
};

// Format date for CSV export (MM/DD/YYYY)
export const formatDateForCSV = (dateString) => {
  if (!dateString) return '';
  const date = parseDate(dateString);
  if (!date) return '';
  return format(date, 'MM/dd/yyyy');
};

// Parse date from CSV (MM/DD/YYYY)
export const parseDateFromCSV = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const [month, day, year] = parts;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isValid(date) ? format(date, 'yyyy-MM-dd') : null;
};
