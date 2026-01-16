import { useState } from 'react';
import { Upload } from 'lucide-react';
import FileGrid from '../components/files/FileGrid';
import FileUploader from '../components/files/FileUploader';
import FilePreview from '../components/files/FilePreview';
import { useFiles } from '../context/FileContext';

const FileCabinet = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const { files, loading, uploadFile, deleteFile, downloadFile } = useFiles();

  const handleUpload = async (fileData) => {
    await uploadFile(fileData);
  };

  const handleDelete = async (file) => {
    await deleteFile(file);
  };

  const handleDownload = (file) => {
    downloadFile(file);
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
