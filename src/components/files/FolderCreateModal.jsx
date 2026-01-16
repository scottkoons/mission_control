import { useState, useEffect } from 'react';
import { X, Folder } from 'lucide-react';

const FolderCreateModal = ({ isOpen, onClose, onSubmit, folder = null }) => {
  const [name, setName] = useState('');
  const isEditing = !!folder;

  useEffect(() => {
    if (isOpen) {
      setName(folder?.name || '');
    }
  }, [isOpen, folder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Folder size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {isEditing ? 'Rename Folder' : 'New Folder'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Folder Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter folder name"
            className="w-full px-4 py-3 bg-surface-hover border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            autoFocus
          />

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-text-secondary bg-surface-hover border border-border rounded-lg hover:bg-surface-hover/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Rename' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderCreateModal;
