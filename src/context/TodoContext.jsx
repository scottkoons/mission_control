import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { subscribeTodos, saveTodo, deleteTodoFromDB, uploadTodoAttachment } from '../services/firebaseService';
import { v4 as uuidv4 } from 'uuid';

const TodoContext = createContext();

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTodos([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeTodos(user.uid, (todoList) => {
      // Sort by order field
      const sorted = todoList.sort((a, b) => (a.order || 0) - (b.order || 0));
      setTodos(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to process attachments - upload to Storage and return metadata
  const processAttachments = async (todoId, attachments) => {
    const processedAttachments = [];
    for (const attachment of attachments) {
      if (attachment.storageURL) {
        processedAttachments.push(attachment);
      } else if (attachment.data) {
        try {
          const uploaded = await uploadTodoAttachment(user.uid, todoId, attachment);
          processedAttachments.push(uploaded);
        } catch (error) {
          console.error('Error uploading attachment:', error);
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

  const createTodo = useCallback(async (text = '') => {
    if (!user) return null;

    const newTodo = {
      id: uuidv4(),
      text: text,
      notes: '',
      completed: false,
      attachments: [],
      order: todos.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveTodo(user.uid, newTodo);
      return newTodo;
    } catch (error) {
      console.error('Error creating todo:', error);
      addToast('Error creating item', { type: 'error' });
      return null;
    }
  }, [user, todos.length, addToast]);

  const updateTodo = useCallback(async (todoId, updates) => {
    if (!user) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    // Process attachments if they're being updated
    let processedUpdates = { ...updates };
    if (updates.attachments?.length > 0) {
      processedUpdates.attachments = await processAttachments(todoId, updates.attachments);
    }

    const updatedTodo = {
      ...todo,
      ...processedUpdates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveTodo(user.uid, updatedTodo);
    } catch (error) {
      console.error('Error updating todo:', error);
      addToast('Error updating item', { type: 'error' });
    }
  }, [user, todos, addToast]);

  const deleteTodo = useCallback(async (todoId) => {
    if (!user) return;

    try {
      await deleteTodoFromDB(user.uid, todoId);
      addToast('Item deleted', { type: 'success', duration: 2000 });
    } catch (error) {
      console.error('Error deleting todo:', error);
      addToast('Error deleting item', { type: 'error' });
    }
  }, [user, addToast]);

  const reorderTodos = useCallback(async (reorderedTodos) => {
    if (!user) return;

    // Update order for all todos
    const updates = reorderedTodos.map((todo, index) => ({
      ...todo,
      order: index,
      updatedAt: new Date().toISOString(),
    }));

    try {
      // Save all updates
      await Promise.all(updates.map(todo => saveTodo(user.uid, todo)));
    } catch (error) {
      console.error('Error reordering todos:', error);
      addToast('Error reordering items', { type: 'error' });
    }
  }, [user, addToast]);

  const toggleComplete = useCallback(async (todoId) => {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
      await updateTodo(todoId, { completed: !todo.completed });
    }
  }, [todos, updateTodo]);

  const value = {
    todos,
    loading,
    createTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
    toggleComplete,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
};

export default TodoContext;
