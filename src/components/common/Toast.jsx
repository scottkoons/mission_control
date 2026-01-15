import { useEffect, useState } from 'react';
import { X, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ToastItem = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev - (100 / (toast.duration / 100));
          return next < 0 ? 0 : next;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration]);

  const icons = {
    delete: Trash2,
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const Icon = icons[toast.type] || Info;

  const bgColors = {
    delete: 'bg-surface border-danger/50',
    success: 'bg-surface border-success/50',
    error: 'bg-surface border-danger/50',
    info: 'bg-surface border-secondary/50',
  };

  const iconColors = {
    delete: 'text-danger',
    success: 'text-success',
    error: 'text-danger',
    info: 'text-secondary',
  };

  return (
    <div
      className={`${bgColors[toast.type]} border rounded-lg shadow-lg overflow-hidden min-w-[300px] max-w-md animate-in slide-in-from-bottom-5 duration-300`}
    >
      <div className="flex items-center gap-3 p-4">
        <Icon size={20} className={iconColors[toast.type]} />
        <span className="flex-1 text-sm text-text-primary">{toast.message}</span>
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo();
              onRemove(toast.id);
            }}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Undo
          </button>
        )}
        <button
          onClick={() => onRemove(toast.id)}
          className="text-text-muted hover:text-text-secondary"
        >
          <X size={16} />
        </button>
      </div>
      {toast.duration > 0 && (
        <div className="h-1 bg-surface-hover">
          <div
            className={`h-full transition-all duration-100 ${
              toast.type === 'delete' ? 'bg-danger' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
