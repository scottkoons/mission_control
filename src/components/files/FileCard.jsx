import { useState } from 'react';
import { FileText, Image, File, Maximize2, Download, Trash2, Info, CheckSquare, Square } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const FileCard = ({ file, onPreview, onDownload, onDelete, onDetails, isSelected, onToggleSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();
  const showSelection = onToggleSelect !== undefined;

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return Image;
    }
    if (file.type === 'application/pdf') {
      return FileText;
    }
    return File;
  };

  const Icon = getFileIcon();

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = file.type.startsWith('image/');

  const handleClick = (e) => {
    // If clicking checkbox area, toggle selection
    if (e.target.closest('.selection-checkbox')) {
      onToggleSelect?.(file.id);
      return;
    }
    // Otherwise open preview
    if (!e.target.closest('button')) {
      onPreview(file);
    }
  };

  return (
    <div
      className={`relative bg-surface border rounded-xl overflow-hidden transition-all cursor-pointer ${
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {showSelection && (isHovered || isSelected) && (
        <div className="selection-checkbox absolute top-2 left-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(file.id);
            }}
            className="p-1 bg-surface/90 rounded transition-colors"
          >
            {isSelected ? (
              <CheckSquare size={20} className="text-primary" />
            ) : (
              <Square size={20} className="text-text-muted hover:text-primary" />
            )}
          </button>
        </div>
      )}

      {/* Thumbnail area */}
      <div className="aspect-square flex items-center justify-center bg-surface-hover p-4">
        {isImage && (file.storageURL || file.data) ? (
          <img
            src={file.storageURL || file.data}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <Icon size={48} className="text-text-muted" />
        )}
      </div>

      {/* Hover overlay with actions */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(file);
            }}
            className="p-2.5 bg-surface rounded-full text-text-primary hover:bg-primary hover:text-white transition-colors"
            title="Preview"
          >
            <Maximize2 size={16} />
          </button>
          {onDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDetails(file);
              }}
              className="p-2.5 bg-surface rounded-full text-text-primary hover:bg-secondary hover:text-white transition-colors"
              title="Details"
            >
              <Info size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="p-2.5 bg-surface rounded-full text-text-primary hover:bg-secondary hover:text-white transition-colors"
            title="Download"
          >
            <Download size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file);
            }}
            className="p-2.5 bg-surface rounded-full text-text-primary hover:bg-danger hover:text-white transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* File name */}
      <div className="p-3 border-t border-border">
        <p className="text-sm text-text-primary truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {formatFileSize(file.size)}
        </p>
      </div>
    </div>
  );
};

export default FileCard;
