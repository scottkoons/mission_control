import { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { v4 as uuidv4 } from 'uuid';

const FileUploader = ({ isOpen, onClose, onUpload }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

  // Prevent browser default drag behavior when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const preventDefaults = (e) => {
      e.preventDefault();
    };

    // Prevent default drag behaviors on the entire document
    // This allows drops to work instead of browser trying to open the file
    document.addEventListener('dragenter', preventDefaults);
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('drop', preventDefaults);

    return () => {
      document.removeEventListener('dragenter', preventDefaults);
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, [isOpen]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles) => {
    const validFiles = [];

    for (const file of newFiles) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`File type "${file.type}" is not supported. Please use SVG, PNG, JPG, or PDF.`);
        continue;
      }

      // Check for duplicates
      if (files.find((f) => f.name === file.name)) {
        continue;
      }

      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (fileName) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleUpload = async () => {
    setUploading(true);

    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = async (event) => {
          const fileData = {
            id: uuidv4(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result,
            uploadedAt: new Date().toISOString(),
          };
          await onUpload(fileData);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setUploading(false);
    setFiles([]);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Files" size="md">
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".svg,.png,.jpg,.jpeg,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-secondary">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-text-muted mt-1">
            SVG, PNG, JPG or PDF (MAX. 10MB)
          </p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              {files.length} file(s) selected
            </p>
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between bg-surface-hover px-3 py-2 rounded-lg"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(file.name)}
                  className="text-text-muted hover:text-danger"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FileUploader;
