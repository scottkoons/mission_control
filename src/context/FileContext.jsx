import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  subscribeFiles,
  saveFile as saveFileToFirebase,
  deleteFileFromDB,
} from '../services/firebaseService';

const FileContext = createContext();

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showDeleteToast, addToast } = useToast();

  // Subscribe to real-time file updates
  useEffect(() => {
    if (!user) {
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeFiles(user.uid, (fetchedFiles) => {
      // Sort by upload date (newest first)
      fetchedFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      setFiles(fetchedFiles);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const uploadFile = useCallback(async (fileData) => {
    if (!user) return null;

    try {
      const savedFile = await saveFileToFirebase(user.uid, fileData);
      addToast(`"${fileData.name}" uploaded successfully`, { type: 'success', duration: 3000 });
      return savedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      addToast('Error uploading file', { type: 'error' });
      throw error;
    }
  }, [user, addToast]);

  const deleteFile = useCallback(async (file) => {
    if (!user) return;

    try {
      await deleteFileFromDB(user.uid, file.id);

      showDeleteToast(`"${file.name}" deleted`, async () => {
        // Undo - restore the file
        await saveFileToFirebase(user.uid, file);
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      addToast('Error deleting file', { type: 'error' });
    }
  }, [user, showDeleteToast, addToast]);

  const downloadFile = useCallback((file) => {
    const link = document.createElement('a');
    // Use storageURL if available, otherwise use data
    link.href = file.storageURL || file.data;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const value = {
    files,
    loading,
    uploadFile,
    deleteFile,
    downloadFile,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export default FileContext;
