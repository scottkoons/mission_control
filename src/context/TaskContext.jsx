import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService';
import { useToast } from './ToastContext';

const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [monthlyNotes, setMonthlyNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const { showDeleteToast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadedTasks = storageService.getTasks();
    const loadedNotes = storageService.getMonthlyNotes();
    setTasks(loadedTasks);
    setMonthlyNotes(loadedNotes);
    setLoading(false);
  }, []);

  // Create a new task
  const createTask = useCallback((taskData) => {
    const newTask = {
      id: uuidv4(),
      taskName: taskData.taskName || '',
      notes: taskData.notes || '',
      draftDue: taskData.draftDue || null,
      finalDue: taskData.finalDue || null,
      draftComplete: false,
      finalComplete: false,
      completedAt: null,
      attachments: taskData.attachments || [],
      repeat: taskData.repeat || 'none',
      isRecurring: false,
      recurringParentId: null,
      sortOrder: tasks.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    storageService.saveTasks(updatedTasks);
    return newTask;
  }, [tasks]);

  // Update an existing task
  const updateTask = useCallback((taskId, updates) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const updatedTask = {
          ...task,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Check if task is now fully complete
        if (updatedTask.draftComplete && updatedTask.finalComplete && !task.completedAt) {
          updatedTask.completedAt = new Date().toISOString();
        }

        // Check if task was un-completed
        if ((!updatedTask.draftComplete || !updatedTask.finalComplete) && task.completedAt) {
          updatedTask.completedAt = null;
        }

        return updatedTask;
      }
      return task;
    });

    setTasks(updatedTasks);
    storageService.saveTasks(updatedTasks);
  }, [tasks]);

  // Delete a task with undo capability
  const deleteTask = useCallback((taskId) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    storageService.saveTasks(updatedTasks);

    // Show undo toast
    showDeleteToast('Task deleted', () => {
      // Undo function - restore the task
      const restoredTasks = [...updatedTasks, taskToDelete];
      setTasks(restoredTasks);
      storageService.saveTasks(restoredTasks);
    });
  }, [tasks, showDeleteToast]);

  // Duplicate a task
  const duplicateTask = useCallback((taskId) => {
    const taskToDuplicate = tasks.find((t) => t.id === taskId);
    if (!taskToDuplicate) return null;

    const newTask = {
      ...taskToDuplicate,
      id: uuidv4(),
      taskName: `${taskToDuplicate.taskName} (Copy)`,
      draftComplete: false,
      finalComplete: false,
      completedAt: null,
      sortOrder: tasks.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    storageService.saveTasks(updatedTasks);
    return newTask;
  }, [tasks]);

  // Toggle draft completion
  const toggleDraftComplete = useCallback((taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      updateTask(taskId, { draftComplete: !task.draftComplete });
    }
  }, [tasks, updateTask]);

  // Toggle final completion
  const toggleFinalComplete = useCallback((taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      updateTask(taskId, { finalComplete: !task.finalComplete });
    }
  }, [tasks, updateTask]);

  // Update sort order
  const updateSortOrder = useCallback((taskIds) => {
    const updatedTasks = tasks.map((task) => {
      const newIndex = taskIds.indexOf(task.id);
      if (newIndex >= 0) {
        return { ...task, sortOrder: newIndex + 1 };
      }
      return task;
    });

    setTasks(updatedTasks);
    storageService.saveTasks(updatedTasks);
  }, [tasks]);

  // Update monthly notes
  const updateMonthlyNotes = useCallback((monthKey, notes) => {
    const updatedNotes = { ...monthlyNotes, [monthKey]: notes };
    setMonthlyNotes(updatedNotes);
    storageService.saveMonthlyNotes(monthKey, notes);
  }, [monthlyNotes]);

  // Get active (incomplete) tasks
  const getActiveTasks = useCallback(() => {
    return tasks.filter((t) => !t.completedAt);
  }, [tasks]);

  // Get completed tasks
  const getCompletedTasks = useCallback(() => {
    return tasks.filter((t) => t.completedAt);
  }, [tasks]);

  // Get overdue tasks count
  const getOverdueCount = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (task.completedAt) return false;

      const checkDate = (dateStr, isComplete) => {
        if (!dateStr || isComplete) return false;
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date < today;
      };

      return checkDate(task.draftDue, task.draftComplete) || checkDate(task.finalDue, task.finalComplete);
    }).length;
  }, [tasks]);

  const value = {
    tasks,
    monthlyNotes,
    loading,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleDraftComplete,
    toggleFinalComplete,
    updateSortOrder,
    updateMonthlyNotes,
    getActiveTasks,
    getCompletedTasks,
    getOverdueCount,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
