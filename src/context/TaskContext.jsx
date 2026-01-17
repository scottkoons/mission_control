import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { generateRecurringInstances } from '../services/recurringService';
import { getDateStatus } from '../utils/dateUtils';
import {
  subscribeTasks,
  subscribeMonthlyNotes,
  subscribeCompanyNotes,
  subscribeCategoryNotes,
  subscribeGeneralNotes,
  saveTask,
  saveTasks,
  deleteTaskFromDB,
  saveMonthlyNote,
  saveCompanyNote,
  saveCategoryNote,
  saveGeneralNote,
  uploadAttachment,
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
  const [companyNotes, setCompanyNotes] = useState({});
  const [categoryNotes, setCategoryNotes] = useState({});
  const [generalNotes, setGeneralNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const { showDeleteToast } = useToast();
  const { user } = useAuth();

  // Subscribe to real-time data when user is authenticated
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setMonthlyNotes({});
      setCompanyNotes({});
      setCategoryNotes({});
      setGeneralNotes({});
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
    const unsubscribeMonthly = subscribeMonthlyNotes(user.uid, (fetchedNotes) => {
      setMonthlyNotes(fetchedNotes);
    });

    // Subscribe to company notes
    const unsubscribeCompany = subscribeCompanyNotes(user.uid, (fetchedNotes) => {
      setCompanyNotes(fetchedNotes);
    });

    // Subscribe to category notes
    const unsubscribeCategory = subscribeCategoryNotes(user.uid, (fetchedNotes) => {
      setCategoryNotes(fetchedNotes);
    });

    // Subscribe to general notes (for flat view)
    const unsubscribeGeneral = subscribeGeneralNotes(user.uid, (fetchedNotes) => {
      setGeneralNotes(fetchedNotes);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeMonthly();
      unsubscribeCompany();
      unsubscribeCategory();
      unsubscribeGeneral();
    };
  }, [user]);

  // Generate recurring instances based on current tasks
  const tasksWithRecurring = useMemo(() => {
    const regularTasks = tasks.filter((t) => !t.isRecurring);
    const existingInstances = tasks.filter((t) => t.isRecurring);
    const newInstances = generateRecurringInstances(regularTasks, existingInstances);
    return [...tasks, ...newInstances];
  }, [tasks]);

  // Helper to process attachments - upload to Storage and return metadata
  const processAttachments = async (taskId, attachments) => {
    const processedAttachments = [];
    for (const attachment of attachments) {
      // If attachment already has storageURL, it's already uploaded
      if (attachment.storageURL) {
        processedAttachments.push(attachment);
      } else if (attachment.data) {
        // New attachment with base64 data - upload to Storage
        try {
          const uploaded = await uploadAttachment(user.uid, taskId, attachment);
          processedAttachments.push(uploaded);
        } catch (error) {
          console.error('Error uploading attachment:', error);
          // Keep the attachment without uploading if it fails
          processedAttachments.push({
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
            uploadedAt: attachment.uploadedAt,
            error: 'Failed to upload',
          });
        }
      }
    }
    return processedAttachments;
  };

  // Create a new task
  const createTask = useCallback(async (taskData) => {
    if (!user) {
      console.error('Cannot create task: No user logged in');
      return null;
    }

    const taskId = taskData.id || uuidv4();

    // Process attachments - upload to Firebase Storage
    const processedAttachments = taskData.attachments?.length > 0
      ? await processAttachments(taskId, taskData.attachments)
      : [];

    const newTask = {
      id: taskId,
      taskName: taskData.taskName || '',
      notes: taskData.notes || '',
      draftDue: taskData.draftDue || null,
      finalDue: taskData.finalDue || null,
      draftComplete: taskData.draftComplete || false,
      finalComplete: taskData.finalComplete || false,
      completedAt: taskData.completedAt || null,
      attachments: processedAttachments,
      repeat: taskData.repeat || 'none',
      isRecurring: taskData.isRecurring || false,
      recurringParentId: taskData.recurringParentId || null,
      sortOrder: taskData.sortOrder || tasks.length + 1,
      createdAt: taskData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveTask(user.uid, newTask);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, [user, tasks]);

  // Update an existing task
  const updateTask = useCallback(async (taskId, updates) => {
    if (!user) return;

    // Process attachments if they're being updated
    let processedUpdates = { ...updates };
    if (updates.attachments?.length > 0) {
      processedUpdates.attachments = await processAttachments(taskId, updates.attachments);
    }

    const existsInStorage = tasks.find((t) => t.id === taskId);

    if (!existsInStorage) {
      const generatedTask = tasksWithRecurring.find((t) => t.id === taskId);
      if (generatedTask) {
        const materializedTask = {
          ...generatedTask,
          ...processedUpdates,
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
      ...processedUpdates,
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

  // Complete task directly (for unscheduled tasks)
  const completeTask = useCallback(async (taskId) => {
    const task = tasksWithRecurring.find((t) => t.id === taskId);
    if (task) {
      const updates = {
        completedAt: task.completedAt ? null : new Date().toISOString(),
        draftComplete: !task.completedAt,
        finalComplete: !task.completedAt,
      };

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

  // Update company notes
  const updateCompanyNotes = useCallback(async (companyId, notes) => {
    if (!user) return;
    await saveCompanyNote(user.uid, companyId, notes);
  }, [user]);

  // Update category notes
  const updateCategoryNotes = useCallback(async (categoryId, notes) => {
    if (!user) return;
    await saveCategoryNote(user.uid, categoryId, notes);
  }, [user]);

  // Update general notes (for flat view)
  const updateGeneralNotes = useCallback(async (noteKey, notes) => {
    if (!user) return;
    await saveGeneralNote(user.uid, noteKey, notes);
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
    companyNotes,
    categoryNotes,
    generalNotes,
    loading,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleDraftComplete,
    toggleFinalComplete,
    completeTask,
    updateSortOrder,
    updateMonthlyNotes,
    updateCompanyNotes,
    updateCategoryNotes,
    updateGeneralNotes,
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
