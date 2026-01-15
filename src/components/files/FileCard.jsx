import { useState } from 'react';
import { FileText, Image, File, Maximize2, Download, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const FileCard = ({ file, onPreview, onDownload, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();

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

  return (
    <div
      className="relative bg-surface border border-border rounded-xl overflow-hidden transition-all hover:border-primary/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail area */}
      <div className="aspect-square flex items-center justify-center bg-surface-hover p-4">
        {isImage && file.data ? (
          <img
            src={file.data}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <Icon size={48} className="text-text-muted" />
        )}
      </div>

      {/* Hover overlay with actions */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3">
          <button
            onClick={() => onPreview(file)}
            className="p-3 bg-surface rounded-full text-text-primary hover:bg-primary hover:text-white transition-colors"
            title="Preview"
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={() => onDownload(file)}
            className="p-3 bg-surface rounded-full text-text-primary hover:bg-secondary hover:text-white transition-colors"
            title="Download"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => onDelete(file)}
            className="p-3 bg-surface rounded-full text-text-primary hover:bg-danger hover:text-white transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
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
