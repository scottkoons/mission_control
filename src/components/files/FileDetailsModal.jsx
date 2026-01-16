import { useState, useEffect } from 'react';
import { X, FileText, Image, File, Folder, Calendar, HardDrive, Eye } from 'lucide-react';

const FileDetailsModal = ({ isOpen, onClose, file, folder, onUpdateDescription }) => {
  const [description, setDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      setDescription(file.description || '');
      setHasChanges(false);
    }
  }, [isOpen, file]);

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    setHasChanges(e.target.value !== (file?.description || ''));
  };

  const handleSave = () => {
    onUpdateDescription(file.id, description);
    setHasChanges(false);
  };

  const getFileIcon = () => {
    if (!file) return File;
    if (file.type.startsWith('image/')) return Image;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen || !file) return null;

  const Icon = getFileIcon();
  const isImage = file.type.startsWith('image/');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary truncate" title={file.name}>
                {file.name}
              </h2>
              <p className="text-sm text-text-muted">{file.type || 'Unknown type'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preview thumbnail */}
          {isImage && (file.storageURL || file.data) && (
            <div className="w-full h-40 bg-surface-hover rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={file.storageURL || file.data}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <HardDrive size={16} className="text-text-muted flex-shrink-0" />
              <span className="text-text-secondary">Size:</span>
              <span className="text-text-primary">{formatFileSize(file.size)}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-text-muted flex-shrink-0" />
              <span className="text-text-secondary">Uploaded:</span>
              <span className="text-text-primary">{formatDate(file.uploadedAt)}</span>
            </div>

            {file.lastViewedAt && (
              <div className="flex items-center gap-3 text-sm">
                <Eye size={16} className="text-text-muted flex-shrink-0" />
                <span className="text-text-secondary">Last viewed:</span>
                <span className="text-text-primary">{formatDate(file.lastViewedAt)}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <Folder size={16} className="text-text-muted flex-shrink-0" />
              <span className="text-text-secondary">Location:</span>
              <span className="text-text-primary">{folder?.name || 'All Files (Root)'}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Add notes about this file..."
              rows={4}
              className="w-full px-4 py-3 bg-surface-hover border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-text-secondary bg-surface-hover border border-border rounded-lg hover:bg-surface-hover/80 transition-colors"
          >
            {hasChanges ? 'Cancel' : 'Close'}
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDetailsModal;
