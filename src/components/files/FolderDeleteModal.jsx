import { X, AlertTriangle, Folder, FileText, Image, File } from 'lucide-react';

const FolderDeleteModal = ({ isOpen, onClose, onConfirm, folder, files, subfolders }) => {
  if (!isOpen || !folder) return null;

  const hasContents = files.length > 0 || subfolders.length > 0;
  const totalItems = files.length + subfolders.length;

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return Image;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md border border-border max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              hasContents ? 'bg-warning/10' : 'bg-danger/10'
            }`}>
              {hasContents ? (
                <AlertTriangle size={20} className="text-warning" />
              ) : (
                <Folder size={20} className="text-danger" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Delete Folder</h2>
              <p className="text-sm text-text-muted">{folder.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {hasContents ? (
            <>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-text-primary">
                  This folder contains <strong>{totalItems} item{totalItems !== 1 ? 's' : ''}</strong> that will be moved to the parent folder when deleted.
                </p>
              </div>

              {/* Subfolders list */}
              {subfolders.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-text-secondary mb-2">
                    Subfolders ({subfolders.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {subfolders.map((subfolder) => (
                      <div
                        key={subfolder.id}
                        className="flex items-center gap-2 px-3 py-2 bg-surface-hover rounded-lg"
                      >
                        <Folder size={16} className="text-primary flex-shrink-0" />
                        <span className="text-sm text-text-primary truncate">
                          {subfolder.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files list */}
              {files.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-2">
                    Files ({files.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {files.map((file) => {
                      const Icon = getFileIcon(file);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 px-3 py-2 bg-surface-hover rounded-lg"
                        >
                          <Icon size={16} className="text-text-muted flex-shrink-0" />
                          <span className="text-sm text-text-primary truncate">
                            {file.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-text-secondary text-center">
              Are you sure you want to delete this empty folder?
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-text-secondary bg-surface-hover border border-border rounded-lg hover:bg-surface-hover/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(folder);
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors"
          >
            Delete Folder
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderDeleteModal;
