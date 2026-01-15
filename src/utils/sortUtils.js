// Sorting utilities for tasks

// Sort direction constants
export const SORT_ASC = 'asc';
export const SORT_DESC = 'desc';

// Sort by task name
export const sortByTaskName = (a, b, direction = SORT_ASC) => {
  const nameA = (a.taskName || '').toLowerCase();
  const nameB = (b.taskName || '').toLowerCase();
  const result = nameA.localeCompare(nameB);
  return direction === SORT_DESC ? -result : result;
};

// Sort by notes
export const sortByNotes = (a, b, direction = SORT_ASC) => {
  const notesA = (a.notes || '').toLowerCase();
  const notesB = (b.notes || '').toLowerCase();
  const result = notesA.localeCompare(notesB);
  return direction === SORT_DESC ? -result : result;
};

// Sort by date (null values go last)
export const sortByDateField = (a, b, field, direction = SORT_ASC) => {
  const dateA = a[field];
  const dateB = b[field];

  // Handle null values - always put them at the end
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  const result = new Date(dateA) - new Date(dateB);
  return direction === SORT_DESC ? -result : result;
};

// Sort by draft due date
export const sortByDraftDue = (a, b, direction = SORT_ASC) => {
  return sortByDateField(a, b, 'draftDue', direction);
};

// Sort by final due date
export const sortByFinalDue = (a, b, direction = SORT_ASC) => {
  return sortByDateField(a, b, 'finalDue', direction);
};

// Sort by sort order
export const sortBySortOrder = (a, b) => {
  return (a.sortOrder || 0) - (b.sortOrder || 0);
};

// Sort by completion date
export const sortByCompletedAt = (a, b, direction = SORT_DESC) => {
  return sortByDateField(a, b, 'completedAt', direction);
};

// Sort by created date
export const sortByCreatedAt = (a, b, direction = SORT_DESC) => {
  return sortByDateField(a, b, 'createdAt', direction);
};

// Multi-level sort
export const multiSort = (tasks, sortConfigs) => {
  return [...tasks].sort((a, b) => {
    for (const config of sortConfigs) {
      let result = 0;

      switch (config.field) {
        case 'taskName':
          result = sortByTaskName(a, b, config.direction);
          break;
        case 'notes':
          result = sortByNotes(a, b, config.direction);
          break;
        case 'draftDue':
          result = sortByDraftDue(a, b, config.direction);
          break;
        case 'finalDue':
          result = sortByFinalDue(a, b, config.direction);
          break;
        case 'sortOrder':
          result = sortBySortOrder(a, b);
          break;
        case 'completedAt':
          result = sortByCompletedAt(a, b, config.direction);
          break;
        case 'createdAt':
          result = sortByCreatedAt(a, b, config.direction);
          break;
        default:
          result = 0;
      }

      if (result !== 0) return result;
    }
    return 0;
  });
};

// Default sort: by sortOrder, then by draftDue
export const defaultTaskSort = (tasks) => {
  return multiSort(tasks, [
    { field: 'sortOrder', direction: SORT_ASC },
    { field: 'draftDue', direction: SORT_ASC },
  ]);
};

// Toggle sort direction
export const toggleDirection = (currentDirection) => {
  return currentDirection === SORT_ASC ? SORT_DESC : SORT_ASC;
};
