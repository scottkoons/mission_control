import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Header from '../components/layout/Header';
import { storageService } from '../services/storageService';

const FileCabinet = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    const loadedFiles = await storageService.getFiles();
    setFiles(loadedFiles);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">File Cabinet</h1>
          <button
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
        ) : files.length === 0 ? (
          <div className="text-text-secondary text-center py-12">
            <p className="text-lg">No files uploaded yet</p>
            <p className="text-sm mt-2">Phase 5 will implement the file upload and display</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* File grid will be implemented in Phase 5 */}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileCabinet;
