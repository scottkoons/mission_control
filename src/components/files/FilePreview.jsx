import { X, Download } from 'lucide-react';
import { useEffect } from 'react';

const FilePreview = ({ file, onClose, onDownload }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <h3 className="text-white text-lg font-medium truncate max-w-md">
          {file.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="max-w-4xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage && (
          <img
            src={file.storageURL || file.data}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}

        {isPDF && (
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-gray-600 mb-4">PDF Preview</p>
            <iframe
              src={file.storageURL || file.data}
              title={file.name}
              className="w-[800px] h-[600px] border-0"
            />
          </div>
        )}

        {!isImage && !isPDF && (
          <div className="bg-surface rounded-lg p-8 text-center">
            <p className="text-text-secondary">
              Preview not available for this file type
            </p>
            <button
              onClick={() => onDownload(file)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreview;
