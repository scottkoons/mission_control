import { useEffect, useCallback } from 'react';

// Keyboard shortcuts hook
// Cmd/Ctrl + N: Open Add New Task modal
// Cmd/Ctrl + K: Focus search bar
// Escape: Close modal

export const useKeyboardShortcuts = ({
  onAddTask,
  onFocusSearch,
  onEscape,
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ignore if typing in an input or textarea
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        document.activeElement?.tagName
      );

      // Cmd/Ctrl + N: Add new task
      if (modifier && e.key === 'n') {
        e.preventDefault();
        onAddTask?.();
        return;
      }

      // Cmd/Ctrl + K: Focus search
      if (modifier && e.key === 'k') {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Escape: Close modal or blur active element
      if (e.key === 'Escape') {
        if (isTyping) {
          document.activeElement?.blur();
        }
        onEscape?.();
        return;
      }
    },
    [onAddTask, onFocusSearch, onEscape]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
