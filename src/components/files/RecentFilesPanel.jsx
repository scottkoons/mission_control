import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, FileText, Image, File } from 'lucide-react';

const RecentFilesPanel = ({ recentFiles, onFileClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (recentFiles.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-hover hover:bg-surface-hover/80 transition-colors"
      >
        <div className="flex items-center gap-2 text-text-secondary">
          <Clock size={16} />
          <span className="text-sm font-medium">Recent Files</span>
          <span className="text-xs text-text-muted">({recentFiles.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-text-muted" />
        ) : (
          <ChevronDown size={18} className="text-text-muted" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {recentFiles.map((file) => {
              const Icon = getFileIcon(file);
              const isImage = file.type.startsWith('image/');

              return (
                <button
                  key={file.id}
                  onClick={() => onFileClick(file)}
                  className="flex-shrink-0 w-24 group"
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-20 bg-surface-hover rounded-lg overflow-hidden flex items-center justify-center group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                    {isImage && (file.storageURL || file.data) ? (
                      <img
                        src={file.storageURL || file.data}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon size={24} className="text-text-muted" />
                    )}
                  </div>

                  {/* File info */}
                  <p className="text-xs text-text-primary truncate mt-1.5 group-hover:text-primary transition-colors" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatTimeAgo(file.lastViewedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentFilesPanel;
