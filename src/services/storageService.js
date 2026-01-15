// Storage Service Abstraction Layer
// All data operations go through this file to enable easy Firebase migration later

import { openDB } from 'idb';

const DB_NAME = 'mission-control-db';
const DB_VERSION = 1;
const TASKS_STORE = 'tasks';
const FILES_STORE = 'files';

// Initialize IndexedDB for file storage
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      }
    },
  });
};

// LocalStorage keys
const STORAGE_KEYS = {
  TASKS: 'mission-control-tasks',
  MONTHLY_NOTES: 'mission-control-monthly-notes',
  SETTINGS: 'mission-control-settings',
  FILES_META: 'mission-control-files-meta',
};

// Helper to safely parse JSON from localStorage
const safeJSONParse = (value, defaultValue) => {
  try {
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const storageService = {
  // Tasks
  getTasks: () => {
    const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    return safeJSONParse(tasks, []);
  },

  saveTask: (task) => {
    const tasks = storageService.getTasks();
    const existingIndex = tasks.findIndex((t) => t.id === task.id);

    if (existingIndex >= 0) {
      tasks[existingIndex] = { ...task, updatedAt: new Date().toISOString() };
    } else {
      tasks.push({ ...task, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return task;
  },

  saveTasks: (tasks) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return tasks;
  },

  deleteTask: (id) => {
    const tasks = storageService.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    return id;
  },

  // Monthly Notes
  getMonthlyNotes: () => {
    const notes = localStorage.getItem(STORAGE_KEYS.MONTHLY_NOTES);
    return safeJSONParse(notes, {});
  },

  saveMonthlyNotes: (monthKey, notes) => {
    const allNotes = storageService.getMonthlyNotes();
    allNotes[monthKey] = notes;
    localStorage.setItem(STORAGE_KEYS.MONTHLY_NOTES, JSON.stringify(allNotes));
    return allNotes;
  },

  // Files (using IndexedDB for large file data)
  getFiles: async () => {
    try {
      const db = await initDB();
      return await db.getAll(FILES_STORE);
    } catch (error) {
      console.error('Error getting files from IndexedDB:', error);
      return [];
    }
  },

  saveFile: async (file) => {
    try {
      const db = await initDB();
      await db.put(FILES_STORE, file);
      return file;
    } catch (error) {
      console.error('Error saving file to IndexedDB:', error);
      throw error;
    }
  },

  deleteFile: async (id) => {
    try {
      const db = await initDB();
      await db.delete(FILES_STORE, id);
      return id;
    } catch (error) {
      console.error('Error deleting file from IndexedDB:', error);
      throw error;
    }
  },

  getFileById: async (id) => {
    try {
      const db = await initDB();
      return await db.get(FILES_STORE, id);
    } catch (error) {
      console.error('Error getting file from IndexedDB:', error);
      return null;
    }
  },

  // Settings
  getSettings: () => {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return safeJSONParse(settings, {
      theme: 'space-program',
      sidebarCollapsed: false,
      defaultView: 'grouped',
      groupedDateMode: 'draft',
      calendarDateMode: 'all',
    });
  },

  saveSettings: (settings) => {
    const currentSettings = storageService.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    return newSettings;
  },

  // Utility: Clear all data (for testing/reset)
  clearAll: async () => {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.MONTHLY_NOTES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.FILES_META);

    try {
      const db = await initDB();
      const tx = db.transaction([FILES_STORE], 'readwrite');
      await tx.objectStore(FILES_STORE).clear();
      await tx.done;
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  },

  // Export all data (for backup)
  exportAllData: async () => {
    const tasks = storageService.getTasks();
    const monthlyNotes = storageService.getMonthlyNotes();
    const settings = storageService.getSettings();
    const files = await storageService.getFiles();

    return {
      tasks,
      monthlyNotes,
      settings,
      files,
      exportedAt: new Date().toISOString(),
    };
  },

  // Import data (for restore)
  importData: async (data) => {
    if (data.tasks) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
    }
    if (data.monthlyNotes) {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_NOTES, JSON.stringify(data.monthlyNotes));
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    if (data.files && Array.isArray(data.files)) {
      const db = await initDB();
      const tx = db.transaction([FILES_STORE], 'readwrite');
      for (const file of data.files) {
        await tx.objectStore(FILES_STORE).put(file);
      }
      await tx.done;
    }
  },
};
