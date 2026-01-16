import { useState, useMemo } from 'react';
import { X, Folder, FolderInput, ChevronRight, Home } from 'lucide-react';

const FileMoveModal = ({ isOpen, onClose, onMove, folders, currentFolderId, fileCount }) => {
  const [selectedFolderId, setSelectedFolderId] = useState(null); // null = root

  // Build folder tree structure
  const folderTree = useMemo(() => {
    const buildTree = (parentId = null) => {
      return folders
        .filter(f => (f.parentId || null) === parentId)
        .map(folder => ({
          ...folder,
          children: buildTree(folder.id),
        }));
    };
    return buildTree();
  }, [folders]);

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  const renderFolderItem = (folder, depth = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const isCurrent = currentFolderId === folder.id;

    return (
      <div key={folder.id}>
        <button
          onClick={() => !isCurrent && setSelectedFolderId(folder.id)}
          disabled={isCurrent}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors ${
            isSelected
              ? 'bg-primary/10 text-primary'
              : isCurrent
              ? 'bg-surface-hover text-text-muted cursor-not-allowed'
              : 'hover:bg-surface-hover text-text-primary'
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          {folder.children?.length > 0 && (
            <ChevronRight size={14} className="text-text-muted" />
          )}
          <Folder size={18} className={isSelected ? 'text-primary' : 'text-text-muted'} />
          <span className="truncate">{folder.name}</span>
          {isCurrent && (
            <span className="text-xs text-text-muted ml-auto">(current)</span>
          )}
        </button>
        {folder.children?.map(child => renderFolderItem(child, depth + 1))}
      </div>
    );
  };

  if (!isOpen) return null;

  const isRootSelected = selectedFolderId === null;
  const isRootCurrent = currentFolderId === null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md border border-border max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FolderInput size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Move Files</h2>
              <p className="text-sm text-text-muted">
                {fileCount} file{fileCount > 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-text-secondary mb-3">Select destination folder:</p>

          {/* Root option */}
          <button
            onClick={() => !isRootCurrent && setSelectedFolderId(null)}
            disabled={isRootCurrent}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors mb-1 ${
              isRootSelected
                ? 'bg-primary/10 text-primary'
                : isRootCurrent
                ? 'bg-surface-hover text-text-muted cursor-not-allowed'
                : 'hover:bg-surface-hover text-text-primary'
            }`}
          >
            <Home size={18} className={isRootSelected ? 'text-primary' : 'text-text-muted'} />
            <span>All Files (Root)</span>
            {isRootCurrent && (
              <span className="text-xs text-text-muted ml-auto">(current)</span>
            )}
          </button>

          {/* Folder tree */}
          {folderTree.map(folder => renderFolderItem(folder))}

          {folders.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              No folders yet. Create a folder first.
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
            onClick={handleMove}
            disabled={selectedFolderId === currentFolderId}
            className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileMoveModal;
