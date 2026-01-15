import { formatDateForCSV, parseDateFromCSV } from './dateUtils';

// CSV Export
export const exportTasksToCSV = (tasks, monthlyNotes = {}) => {
  // Headers
  const headers = [
    'task_name',
    'notes',
    'draft_due',
    'final_due',
    'draft_complete',
    'final_complete',
    'repeat',
    'sort_order',
    'created_at',
  ];

  // Convert tasks to CSV rows
  const rows = tasks.map((task) => [
    escapeCSV(task.taskName || ''),
    escapeCSV(task.notes || ''),
    formatDateForCSV(task.draftDue),
    formatDateForCSV(task.finalDue),
    task.draftComplete ? 'TRUE' : 'FALSE',
    task.finalComplete ? 'TRUE' : 'FALSE',
    task.repeat || 'none',
    task.sortOrder || '',
    task.createdAt || '',
  ]);

  // Build CSV content
  let csv = headers.join(',') + '\n';
  csv += rows.map((row) => row.join(',')).join('\n');

  // Add monthly notes section
  if (Object.keys(monthlyNotes).length > 0) {
    csv += '\n\n# Monthly Notes\n';
    csv += 'month_key,notes\n';
    Object.entries(monthlyNotes).forEach(([key, value]) => {
      csv += `${key},${escapeCSV(value)}\n`;
    });
  }

  return csv;
};

// Helper to escape CSV values
const escapeCSV = (value) => {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Download CSV file
export const downloadCSV = (content, filename = 'tasks.csv') => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Generate blank CSV template
export const generateCSVTemplate = () => {
  const headers = [
    'task_name',
    'notes',
    'draft_due',
    'final_due',
    'draft_complete',
    'final_complete',
    'repeat',
    'sort_order',
    'created_at',
  ];

  const exampleRow = [
    'Example Task',
    'Task description here',
    '01/15/2026',
    '01/22/2026',
    'FALSE',
    'FALSE',
    'none',
    '1',
    '',
  ];

  return headers.join(',') + '\n' + exampleRow.join(',');
};

// Parse CSV content
export const parseCSV = (content) => {
  const lines = content.split('\n').filter((line) => line.trim() && !line.startsWith('#'));
  if (lines.length < 2) return { tasks: [], monthlyNotes: {} };

  const headers = parseCSVLine(lines[0]);
  const tasks = [];
  const monthlyNotes = {};

  let parsingTasks = true;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if we're in the monthly notes section
    if (line.toLowerCase() === 'month_key,notes') {
      parsingTasks = false;
      continue;
    }

    const values = parseCSVLine(line);

    if (parsingTasks) {
      // Parse task row
      const task = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header.toLowerCase()) {
          case 'task_name':
            task.taskName = value;
            break;
          case 'notes':
            task.notes = value;
            break;
          case 'draft_due':
            task.draftDue = parseDateFromCSV(value);
            break;
          case 'final_due':
            task.finalDue = parseDateFromCSV(value);
            break;
          case 'draft_complete':
            task.draftComplete = value.toUpperCase() === 'TRUE';
            break;
          case 'final_complete':
            task.finalComplete = value.toUpperCase() === 'TRUE';
            break;
          case 'repeat':
            task.repeat = value || 'none';
            break;
          case 'sort_order':
            task.sortOrder = parseInt(value) || 0;
            break;
          case 'created_at':
            task.createdAt = value || new Date().toISOString();
            break;
        }
      });

      if (task.taskName) {
        tasks.push(task);
      }
    } else {
      // Parse monthly notes row
      if (values.length >= 2) {
        monthlyNotes[values[0]] = values[1];
      }
    }
  }

  return { tasks, monthlyNotes };
};

// Parse a single CSV line handling quoted values
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
};
