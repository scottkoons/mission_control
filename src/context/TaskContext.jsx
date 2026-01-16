import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { generateRecurringInstances } from '../services/recurringService';
import { getDateStatus } from '../utils/dateUtils';
import {
  subscribeTasks,
  subscribeMonthlyNotes,
  saveTask,
  saveTasks,
  deleteTaskFromDB,
  saveMonthlyNote,
} from '../services/firebaseService';

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
  const { user } = useAuth();

  // Subscribe to real-time data when user is authenticated
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setMonthlyNotes({});
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to tasks
    const unsubscribeTasks = subscribeTasks(user.uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });

    // Subscribe to monthly notes
    const unsubscribeNotes = subscribeMonthlyNotes(user.uid, (fetchedNotes) => {
      setMonthlyNotes(fetchedNotes);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeNotes();
    };
  }, [user]);

  // Generate recurring instances based on current tasks
  const tasksWithRecurring = useMemo(() => {
    const regularTasks = tasks.filter((t) => !t.isRecurring);
    const existingInstances = tasks.filter((t) => t.isRecurring);
    const newInstances = generateRecurringInstances(regularTasks, existingInstances);
    return [...tasks, ...newInstances];
  }, [tasks]);

  // Create a new task
  const createTask = useCallback(async (taskData) => {
    if (!user) return null;

    const newTask = {
      id: taskData.id || uuidv4(),
      taskName: taskData.taskName || '',
      notes: taskData.notes || '',
      draftDue: taskData.draftDue || null,
      finalDue: taskData.finalDue || null,
      draftComplete: taskData.draftComplete || false,
      finalComplete: taskData.finalComplete || false,
      completedAt: taskData.completedAt || null,
      attachments: taskData.attachments || [],
      repeat: taskData.repeat || 'none',
      isRecurring: taskData.isRecurring || false,
      recurringParentId: taskData.recurringParentId || null,
      sortOrder: taskData.sortOrder || tasks.length + 1,
      createdAt: taskData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTask(user.uid, newTask);
    return newTask;
  }, [user, tasks]);

  // Update an existing task
  const updateTask = useCallback(async (taskId, updates) => {
    if (!user) return;

    const existsInStorage = tasks.find((t) => t.id === taskId);

    if (!existsInStorage) {
      const generatedTask = tasksWithRecurring.find((t) => t.id === taskId);
      if (generatedTask) {
        const materializedTask = {
          ...generatedTask,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        if (materializedTask.draftComplete && materializedTask.finalComplete && !generatedTask.completedAt) {
          materializedTask.completedAt = new Date().toISOString();
        }
        if ((!materializedTask.draftComplete || !materializedTask.finalComplete) && generatedTask.completedAt) {
          materializedTask.completedAt = null;
        }

        await saveTask(user.uid, materializedTask);
        return;
      }
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updatedTask.draftComplete && updatedTask.finalComplete && !task.completedAt) {
      updatedTask.completedAt = new Date().toISOString();
    }
    if ((!updatedTask.draftComplete || !updatedTask.finalComplete) && task.completedAt) {
      updatedTask.completedAt = null;
    }

    await saveTask(user.uid, updatedTask);
  }, [user, tasks, tasksWithRecurring]);

  // Delete a task with undo capability
  const deleteTask = useCallback(async (taskId) => {
    if (!user) return;

    let taskToDelete = tasks.find((t) => t.id === taskId);

    if (!taskToDelete) {
      const generatedTask = tasksWithRecurring.find((t) => t.id === taskId);
      if (generatedTask) {
        const materializedTask = {
          ...generatedTask,
          completedAt: new Date().toISOString(),
        };

        await saveTask(user.uid, materializedTask);

        showDeleteToast('Task deleted', async () => {
          await deleteTaskFromDB(user.uid, taskId);
        });
        return;
      }
      return;
    }

    let tasksToRemove = [taskId];
    if (taskToDelete.repeat && taskToDelete.repeat !== 'none') {
      const instances = tasks.filter((t) => t.recurringParentId === taskId);
      tasksToRemove = [...tasksToRemove, ...instances.map((t) => t.id)];
    }

    const deletedTasks = tasks.filter((t) => tasksToRemove.includes(t.id));

    for (const id of tasksToRemove) {
      await deleteTaskFromDB(user.uid, id);
    }

    showDeleteToast('Task deleted', async () => {
      for (const task of deletedTasks) {
        await saveTask(user.uid, task);
      }
    });
  }, [user, tasks, tasksWithRecurring, showDeleteToast]);

  // Duplicate a task
  const duplicateTask = useCallback(async (taskId) => {
    if (!user) return null;

    let taskToDuplicate = tasks.find((t) => t.id === taskId);
    if (!taskToDuplicate) {
      taskToDuplicate = tasksWithRecurring.find((t) => t.id === taskId);
    }
    if (!taskToDuplicate) return null;

    const newTask = {
      ...taskToDuplicate,
      id: uuidv4(),
      taskName: `${taskToDuplicate.taskName} (Copy)`,
      draftComplete: false,
      finalComplete: false,
      completedAt: null,
      isRecurring: false,
      recurringParentId: null,
      repeat: 'none',
      sortOrder: tasks.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTask(user.uid, newTask);
    return newTask;
  }, [user, tasks, tasksWithRecurring]);

  // Toggle draft completion
  const toggleDraftComplete = useCallback(async (taskId) => {
    const task = tasksWithRecurring.find((t) => t.id === taskId);
    if (task) {
      if (task.isRecurring && !tasks.find((t) => t.id === taskId)) {
        await saveTask(user.uid, { ...task, draftComplete: !task.draftComplete });
      } else {
        await updateTask(taskId, { draftComplete: !task.draftComplete });
      }
    }
  }, [user, tasks, tasksWithRecurring, updateTask]);

  // Toggle final completion
  const toggleFinalComplete = useCallback(async (taskId) => {
    const task = tasksWithRecurring.find((t) => t.id === taskId);
    if (task) {
      const newFinalComplete = !task.finalComplete;
      const updates = newFinalComplete
        ? { finalComplete: true, draftComplete: true }
        : { finalComplete: false };

      if (task.isRecurring && !tasks.find((t) => t.id === taskId)) {
        await saveTask(user.uid, { ...task, ...updates });
      } else {
        await updateTask(taskId, updates);
      }
    }
  }, [user, tasks, tasksWithRecurring, updateTask]);

  // Update sort order
  const updateSortOrder = useCallback(async (taskIds) => {
    if (!user) return;

    const tasksToUpdate = tasks.filter((task) => taskIds.includes(task.id));
    const updatedTasks = tasksToUpdate.map((task) => {
      const newIndex = taskIds.indexOf(task.id);
      return { ...task, sortOrder: newIndex + 1 };
    });

    await saveTasks(user.uid, updatedTasks);
  }, [user, tasks]);

  // Update monthly notes
  const updateMonthlyNotes = useCallback(async (monthKey, notes) => {
    if (!user) return;
    await saveMonthlyNote(user.uid, monthKey, notes);
  }, [user]);

  // Get active (incomplete) tasks including recurring
  const getActiveTasks = useCallback(() => {
    return tasksWithRecurring.filter((t) => !t.completedAt);
  }, [tasksWithRecurring]);

  // Get completed tasks
  const getCompletedTasks = useCallback(() => {
    return tasks.filter((t) => t.completedAt);
  }, [tasks]);

  // Get overdue dates count
  const getOverdueCount = useCallback(() => {
    let count = 0;
    tasksWithRecurring.forEach((task) => {
      if (task.completedAt) return;
      if (task.draftDue && getDateStatus(task.draftDue, task.draftComplete) === 'overdue') {
        count++;
      }
      if (task.finalDue && getDateStatus(task.finalDue, task.finalComplete) === 'overdue') {
        count++;
      }
    });
    return count;
  }, [tasksWithRecurring]);

  // Get due soon dates count
  const getDueSoonCount = useCallback(() => {
    let count = 0;
    tasksWithRecurring.forEach((task) => {
      if (task.completedAt) return;
      if (task.draftDue && getDateStatus(task.draftDue, task.draftComplete) === 'soon') {
        count++;
      }
      if (task.finalDue && getDateStatus(task.finalDue, task.finalComplete) === 'soon') {
        count++;
      }
    });
    return count;
  }, [tasksWithRecurring]);

  const value = {
    tasks: tasksWithRecurring,
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
    getDueSoonCount,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
