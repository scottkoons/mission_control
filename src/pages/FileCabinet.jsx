import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import FileGrid from '../components/files/FileGrid';
import FileUploader from '../components/files/FileUploader';
import FilePreview from '../components/files/FilePreview';
import { storageService } from '../services/storageService';
import { useToast } from '../context/ToastContext';

const FileCabinet = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const { showDeleteToast, addToast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const loadedFiles = await storageService.getFiles();
      // Sort by upload date (newest first)
      loadedFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      setFiles(loadedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      addToast('Error loading files', { type: 'error' });
    }
    setLoading(false);
  };

  const handleUpload = async (fileData) => {
    try {
      await storageService.saveFile(fileData);
      setFiles((prev) => [fileData, ...prev]);
      addToast(`"${fileData.name}" uploaded successfully`, { type: 'success', duration: 3000 });
    } catch (error) {
      console.error('Error uploading file:', error);
      addToast('Error uploading file', { type: 'error' });
    }
  };

  const handleDelete = async (file) => {
    try {
      await storageService.deleteFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));

      showDeleteToast(`"${file.name}" deleted`, async () => {
        // Undo - restore the file
        await storageService.saveFile(file);
        setFiles((prev) => [file, ...prev.filter((f) => f.id !== file.id)]);
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      addToast('Error deleting file', { type: 'error' });
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">File Cabinet</h1>
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={18} />
            <span>Upload Files</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-text-secondary text-center py-12">
            <p>Loading files...</p>
          </div>
        ) : (
          <FileGrid
            files={files}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* File Uploader Modal */}
      <FileUploader
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        onUpload={handleUpload}
      />

      {/* File Preview */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={handleClosePreview}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default FileCabinet;
