import { useState, useMemo } from 'react';
import { Upload } from 'lucide-react';
import FileGrid from '../components/files/FileGrid';
import FileUploader from '../components/files/FileUploader';
import FilePreview from '../components/files/FilePreview';
import FileToolbar from '../components/files/FileToolbar';
import FolderBreadcrumbs from '../components/files/FolderBreadcrumbs';
import FolderCreateModal from '../components/files/FolderCreateModal';
import FileMoveModal from '../components/files/FileMoveModal';
import FileDetailsModal from '../components/files/FileDetailsModal';
import FolderDeleteModal from '../components/files/FolderDeleteModal';
import RecentFilesPanel from '../components/files/RecentFilesPanel';
import { useFiles } from '../context/FileContext';

const FileCabinet = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [detailsFile, setDetailsFile] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  const {
    loading,
    files,
    displayedFiles,
    displayedFolders,
    folders,
    recentFiles,
    currentFolderId,
    folderPath,
    selectedFileIds,
    searchQuery,
    // Actions
    uploadFile,
    deleteFile,
    deleteSelectedFiles,
    moveSelectedFiles,
    moveFiles,
    downloadFile,
    updateFileDescription,
    trackFileView,
    // Folder actions
    createFolder,
    renameFolder,
    deleteFolder,
    navigateToFolder,
    navigateToRoot,
    getFolderById,
    // Selection
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    // Search
    search,
    clearSearch,
  } = useFiles();

  // Get files and subfolders in a folder
  const getFolderContents = (folderId) => {
    const folderFiles = files.filter(f => f.folderId === folderId);
    const subfolders = folders.filter(f => f.parentId === folderId);
    return { files: folderFiles, subfolders };
  };

  // Contents of folder being deleted
  const deleteFolderContents = useMemo(() => {
    if (!folderToDelete) return { files: [], subfolders: [] };
    return getFolderContents(folderToDelete.id);
  }, [folderToDelete, files, folders]);

  const handleUpload = async (fileData) => {
    await uploadFile(fileData);
  };

  const handleDelete = async (file) => {
    await deleteFile(file);
  };

  const handleDownload = (file) => {
    downloadFile(file);
  };

  const handlePreview = async (file) => {
    setPreviewFile(file);
    await trackFileView(file.id);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  const handleDetails = (file) => {
    setDetailsFile(file);
  };

  const handleCloseDetails = () => {
    setDetailsFile(null);
  };

  const handleUpdateDescription = async (fileId, description) => {
    await updateFileDescription(fileId, description);
  };

  // Folder handlers
  const handleNewFolder = () => {
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleRenameFolder = (folder) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleFolderSubmit = async (name) => {
    if (editingFolder) {
      await renameFolder(editingFolder.id, name);
    } else {
      await createFolder(name);
    }
  };

  const handleDeleteFolder = (folder) => {
    // Show confirmation modal
    setFolderToDelete(folder);
  };

  const confirmDeleteFolder = async (folder) => {
    await deleteFolder(folder.id);
  };

  const handleOpenFolder = (folder) => {
    navigateToFolder(folder.id);
  };

  // Recent file click
  const handleRecentFileClick = async (file) => {
    // Navigate to file's folder and open preview
    if (file.folderId !== currentFolderId) {
      navigateToFolder(file.folderId);
    }
    handlePreview(file);
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

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Breadcrumbs */}
        <FolderBreadcrumbs
          folderPath={folderPath}
          searchQuery={searchQuery}
          onNavigateToRoot={navigateToRoot}
          onNavigateToFolder={navigateToFolder}
          onClearSearch={clearSearch}
        />

        {/* Toolbar */}
        <FileToolbar
          searchQuery={searchQuery}
          onSearch={search}
          onClearSearch={clearSearch}
          onNewFolder={handleNewFolder}
          selectedCount={selectedFileIds.size}
          totalFiles={displayedFiles.length}
          onSelectAll={selectAllFiles}
          onClearSelection={clearSelection}
          onMoveSelected={() => setShowMoveModal(true)}
          onDeleteSelected={deleteSelectedFiles}
        />

        {/* Recent Files */}
        {!searchQuery && currentFolderId === null && (
          <RecentFilesPanel
            recentFiles={recentFiles}
            onFileClick={handleRecentFileClick}
          />
        )}

        {/* File Grid */}
        {loading ? (
          <div className="text-text-secondary text-center py-12">
            <p>Loading files...</p>
          </div>
        ) : (
          <FileGrid
            folders={displayedFolders}
            files={displayedFiles}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onDetails={handleDetails}
            onOpenFolder={handleOpenFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveFile={moveFiles}
            selectedFileIds={selectedFileIds}
            onToggleSelect={toggleFileSelection}
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

      {/* File Details Modal */}
      <FileDetailsModal
        isOpen={!!detailsFile}
        onClose={handleCloseDetails}
        file={detailsFile}
        folder={detailsFile ? getFolderById(detailsFile.folderId) : null}
        onUpdateDescription={handleUpdateDescription}
      />

      {/* Folder Create/Rename Modal */}
      <FolderCreateModal
        isOpen={showFolderModal}
        onClose={() => {
          setShowFolderModal(false);
          setEditingFolder(null);
        }}
        onSubmit={handleFolderSubmit}
        folder={editingFolder}
      />

      {/* File Move Modal */}
      <FileMoveModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMove={moveSelectedFiles}
        folders={folders}
        currentFolderId={currentFolderId}
        fileCount={selectedFileIds.size}
      />

      {/* Folder Delete Confirmation Modal */}
      <FolderDeleteModal
        isOpen={!!folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onConfirm={confirmDeleteFolder}
        folder={folderToDelete}
        files={deleteFolderContents.files}
        subfolders={deleteFolderContents.subfolders}
      />
    </div>
  );
};

export default FileCabinet;
