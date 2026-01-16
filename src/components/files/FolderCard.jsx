import { useState } from 'react';
import { Folder, Edit2, Trash2 } from 'lucide-react';

const FolderCard = ({ folder, onOpen, onRename, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    // Don't navigate if clicking action buttons
    if (e.target.closest('button')) return;
    onOpen(folder);
  };

  return (
    <div
      className="relative bg-surface border border-border rounded-xl overflow-hidden transition-all hover:border-primary/50 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Folder icon area */}
      <div className="aspect-square flex items-center justify-center bg-surface-hover p-4">
        <Folder size={48} className="text-primary" fill="currentColor" />
      </div>

      {/* Hover overlay with actions */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename(folder);
            }}
            className="p-3 bg-surface rounded-full text-text-primary hover:bg-primary hover:text-white transition-colors"
            title="Rename"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder);
            }}
            className="p-3 bg-surface rounded-full text-text-primary hover:bg-danger hover:text-white transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      {/* Folder name */}
      <div className="p-3 border-t border-border">
        <p className="text-sm text-text-primary truncate" title={folder.name}>
          {folder.name}
        </p>
        <p className="text-xs text-text-muted mt-0.5">Folder</p>
      </div>
    </div>
  );
};

export default FolderCard;
