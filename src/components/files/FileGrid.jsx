import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import DraggableFileCard from './DraggableFileCard';
import DroppableFolderCard from './DroppableFolderCard';
import FileCard from './FileCard';

const FileGrid = ({
  folders = [],
  files,
  onPreview,
  onDownload,
  onDelete,
  onDetails,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFile,
  selectedFileIds,
  onToggleSelect,
}) => {
  const [activeFile, setActiveFile] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === 'file') {
      setActiveFile(active.data.current.file);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveFile(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // File dropped on folder
    if (activeData?.type === 'file' && overData?.type === 'folder') {
      const file = activeData.file;
      const targetFolder = overData.folder;

      // Don't move if already in this folder
      if (file.folderId === targetFolder.id) return;

      // Move the file (and any selected files if this file is selected)
      if (selectedFileIds?.has(file.id) && selectedFileIds.size > 1) {
        // Move all selected files
        onMoveFile?.([...selectedFileIds], targetFolder.id);
      } else {
        // Move just this file
        onMoveFile?.([file.id], targetFolder.id);
      }
    }
  };

  const hasContent = folders.length > 0 || files.length > 0;

  if (!hasContent) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-text-secondary">No files in this folder</p>
        <p className="text-sm text-text-muted mt-2">
          Upload files or create folders to get started
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {/* Folders first - droppable targets */}
        {folders.map((folder) => (
          <DroppableFolderCard
            key={folder.id}
            folder={folder}
            onOpen={onOpenFolder}
            onRename={onRenameFolder}
            onDelete={onDeleteFolder}
          />
        ))}

        {/* Then files - draggable items */}
        {files.map((file) => (
          <DraggableFileCard
            key={file.id}
            file={file}
            onPreview={onPreview}
            onDownload={onDownload}
            onDelete={onDelete}
            onDetails={onDetails}
            isSelected={selectedFileIds?.has(file.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      {/* Drag overlay - shows what's being dragged */}
      <DragOverlay>
        {activeFile ? (
          <div className="opacity-80 rotate-3 scale-105">
            <FileCard
              file={activeFile}
              onPreview={() => {}}
              onDownload={() => {}}
              onDelete={() => {}}
            />
            {selectedFileIds?.has(activeFile.id) && selectedFileIds.size > 1 && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {selectedFileIds.size}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default FileGrid;
