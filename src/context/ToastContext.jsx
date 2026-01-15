import { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, options = {}) => {
    const id = uuidv4();
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 10000,
      onUndo: options.onUndo || null,
      ...options,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showDeleteToast = useCallback((message, onUndo) => {
    return addToast(message, {
      type: 'delete',
      duration: 10000,
      onUndo,
    });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    showDeleteToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
