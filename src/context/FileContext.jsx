import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  subscribeFiles,
  subscribeFolders,
  saveFile as saveFileToFirebase,
  saveFolder as saveFolderToFirebase,
  deleteFileFromDB,
  deleteFolderFromDB,
  updateFileMetadata,
  updateFilesMetadata,
  deleteFilesFromDB,
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
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
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

  // Subscribe to real-time folder updates
  useEffect(() => {
    if (!user) {
      setFolders([]);
      return;
    }

    const unsubscribe = subscribeFolders(user.uid, (fetchedFolders) => {
      setFolders(fetchedFolders);
    });

    return () => unsubscribe();
  }, [user]);

  // Get files for current folder (or search results)
  const displayedFiles = useMemo(() => {
    if (searchQuery.trim()) {
      // Search across all files
      const query = searchQuery.toLowerCase();
      return files.filter(f => f.name.toLowerCase().includes(query));
    }
    // Filter by current folder
    return files.filter(f => (f.folderId || null) === currentFolderId);
  }, [files, currentFolderId, searchQuery]);

  // Get folders in current directory
  const displayedFolders = useMemo(() => {
    if (searchQuery.trim()) {
      // Don't show folders during search
      return [];
    }
    return folders.filter(f => (f.parentId || null) === currentFolderId);
  }, [folders, currentFolderId, searchQuery]);

  // Build folder path for breadcrumbs
  const folderPath = useMemo(() => {
    const path = [];
    let folderId = currentFolderId;

    while (folderId) {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        path.unshift(folder);
        folderId = folder.parentId || null;
      } else {
        break;
      }
    }

    return path;
  }, [folders, currentFolderId]);

  // Get recent files (last 10 viewed)
  const recentFiles = useMemo(() => {
    return files
      .filter(f => f.lastViewedAt)
      .sort((a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt))
      .slice(0, 10);
  }, [files]);

  // Navigation
  const navigateToFolder = useCallback((folderId) => {
    setCurrentFolderId(folderId);
    setSelectedFileIds(new Set());
    setSearchQuery('');
  }, []);

  const navigateToRoot = useCallback(() => {
    setCurrentFolderId(null);
    setSelectedFileIds(new Set());
    setSearchQuery('');
  }, []);

  // Search
  const search = useCallback((query) => {
    setSearchQuery(query);
    setSelectedFileIds(new Set());
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Selection
  const selectFile = useCallback((fileId) => {
    setSelectedFileIds(prev => new Set([...prev, fileId]));
  }, []);

  const deselectFile = useCallback((fileId) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  const toggleFileSelection = useCallback((fileId) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const selectAllFiles = useCallback(() => {
    setSelectedFileIds(new Set(displayedFiles.map(f => f.id)));
  }, [displayedFiles]);

  const clearSelection = useCallback(() => {
    setSelectedFileIds(new Set());
  }, []);

  // File operations
  const uploadFile = useCallback(async (fileData) => {
    if (!user) return null;

    try {
      // Add current folder to file data
      const fileWithFolder = {
        ...fileData,
        folderId: currentFolderId,
      };
      const savedFile = await saveFileToFirebase(user.uid, fileWithFolder);
      addToast(`"${fileData.name}" uploaded successfully`, { type: 'success', duration: 3000 });
      return savedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      addToast('Error uploading file', { type: 'error' });
      throw error;
    }
  }, [user, addToast, currentFolderId]);

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

  const deleteSelectedFiles = useCallback(async () => {
    if (!user || selectedFileIds.size === 0) return;

    const filesToDelete = files.filter(f => selectedFileIds.has(f.id));
    const count = filesToDelete.length;

    try {
      await deleteFilesFromDB(user.uid, [...selectedFileIds]);
      setSelectedFileIds(new Set());

      showDeleteToast(`${count} file${count > 1 ? 's' : ''} deleted`, async () => {
        // Undo - restore all files
        for (const file of filesToDelete) {
          await saveFileToFirebase(user.uid, file);
        }
      });
    } catch (error) {
      console.error('Error deleting files:', error);
      addToast('Error deleting files', { type: 'error' });
    }
  }, [user, files, selectedFileIds, showDeleteToast, addToast]);

  const moveFiles = useCallback(async (fileIds, targetFolderId) => {
    if (!user) return;

    try {
      await updateFilesMetadata(user.uid, fileIds, { folderId: targetFolderId });
      setSelectedFileIds(new Set());
      addToast(`${fileIds.length} file${fileIds.length > 1 ? 's' : ''} moved`, { type: 'success', duration: 3000 });
    } catch (error) {
      console.error('Error moving files:', error);
      addToast('Error moving files', { type: 'error' });
    }
  }, [user, addToast]);

  const moveSelectedFiles = useCallback(async (targetFolderId) => {
    if (selectedFileIds.size === 0) return;
    await moveFiles([...selectedFileIds], targetFolderId);
  }, [selectedFileIds, moveFiles]);

  const updateFileDescription = useCallback(async (fileId, description) => {
    if (!user) return;

    try {
      await updateFileMetadata(user.uid, fileId, { description });
    } catch (error) {
      console.error('Error updating file description:', error);
      addToast('Error updating file', { type: 'error' });
    }
  }, [user, addToast]);

  const trackFileView = useCallback(async (fileId) => {
    if (!user) return;

    try {
      await updateFileMetadata(user.uid, fileId, { lastViewedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Error tracking file view:', error);
    }
  }, [user]);

  const downloadFile = useCallback(async (file) => {
    const url = file.storageURL || file.data;

    // For Firebase Storage URLs, fetch as blob to force download
    if (file.storageURL) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Download error:', error);
        // Fallback to opening in new tab
        window.open(url, '_blank');
      }
    } else {
      // For data URLs, direct download works
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Folder operations
  const createFolder = useCallback(async (name, parentId = null) => {
    if (!user) return null;

    try {
      const folder = {
        id: crypto.randomUUID(),
        name,
        parentId: parentId ?? currentFolderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveFolderToFirebase(user.uid, folder);
      addToast(`Folder "${name}" created`, { type: 'success', duration: 3000 });
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      addToast('Error creating folder', { type: 'error' });
      throw error;
    }
  }, [user, addToast, currentFolderId]);

  const renameFolder = useCallback(async (folderId, newName) => {
    if (!user) return;

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    try {
      await saveFolderToFirebase(user.uid, {
        ...folder,
        name: newName,
        updatedAt: new Date().toISOString(),
      });
      addToast(`Folder renamed to "${newName}"`, { type: 'success', duration: 3000 });
    } catch (error) {
      console.error('Error renaming folder:', error);
      addToast('Error renaming folder', { type: 'error' });
    }
  }, [user, folders, addToast]);

  const deleteFolder = useCallback(async (folderId) => {
    if (!user) return;

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    try {
      // Move all files in this folder to parent folder
      const filesInFolder = files.filter(f => f.folderId === folderId);
      if (filesInFolder.length > 0) {
        await updateFilesMetadata(
          user.uid,
          filesInFolder.map(f => f.id),
          { folderId: folder.parentId || null }
        );
      }

      // Move all subfolders to parent folder
      const subfolders = folders.filter(f => f.parentId === folderId);
      for (const subfolder of subfolders) {
        await saveFolderToFirebase(user.uid, {
          ...subfolder,
          parentId: folder.parentId || null,
          updatedAt: new Date().toISOString(),
        });
      }

      // Delete the folder
      await deleteFolderFromDB(user.uid, folderId);

      // Navigate to parent if we're inside the deleted folder
      if (currentFolderId === folderId) {
        setCurrentFolderId(folder.parentId || null);
      }

      showDeleteToast(`Folder "${folder.name}" deleted`, async () => {
        // Undo - restore the folder and move contents back
        await saveFolderToFirebase(user.uid, folder);

        // Move files back
        if (filesInFolder.length > 0) {
          await updateFilesMetadata(
            user.uid,
            filesInFolder.map(f => f.id),
            { folderId }
          );
        }

        // Move subfolders back
        for (const subfolder of subfolders) {
          await saveFolderToFirebase(user.uid, {
            ...subfolder,
            parentId: folderId,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      addToast('Error deleting folder', { type: 'error' });
    }
  }, [user, folders, files, currentFolderId, showDeleteToast, addToast]);

  // Get folder by ID
  const getFolderById = useCallback((folderId) => {
    return folders.find(f => f.id === folderId) || null;
  }, [folders]);

  const value = {
    // State
    files,
    folders,
    loading,
    currentFolderId,
    selectedFileIds,
    searchQuery,

    // Computed
    displayedFiles,
    displayedFolders,
    folderPath,
    recentFiles,

    // Navigation
    navigateToFolder,
    navigateToRoot,

    // Search
    search,
    clearSearch,

    // Selection
    selectFile,
    deselectFile,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,

    // File operations
    uploadFile,
    deleteFile,
    deleteSelectedFiles,
    moveFiles,
    moveSelectedFiles,
    updateFileDescription,
    trackFileView,
    downloadFile,

    // Folder operations
    createFolder,
    renameFolder,
    deleteFolder,
    getFolderById,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export default FileContext;
