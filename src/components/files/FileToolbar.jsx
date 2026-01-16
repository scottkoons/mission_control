import { useState, useEffect } from 'react';
import { Search, FolderPlus, Trash2, FolderInput, X, CheckSquare, Square } from 'lucide-react';

const FileToolbar = ({
  searchQuery,
  onSearch,
  onClearSearch,
  onNewFolder,
  selectedCount,
  totalFiles,
  onSelectAll,
  onClearSelection,
  onMoveSelected,
  onDeleteSelected,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearch(value);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onClearSearch();
  };

  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={localSearch}
          onChange={handleSearchChange}
          placeholder="Search files..."
          className="w-full pl-10 pr-10 py-2.5 bg-surface-hover border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {localSearch && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Selection toggle */}
        {totalFiles > 0 && (
          <button
            onClick={hasSelection ? onClearSelection : onSelectAll}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary bg-surface-hover border border-border rounded-lg hover:bg-surface-hover/80 transition-colors"
            title={hasSelection ? 'Clear selection' : 'Select all'}
          >
            {hasSelection ? (
              <>
                <CheckSquare size={18} className="text-primary" />
                <span>{selectedCount} selected</span>
              </>
            ) : (
              <>
                <Square size={18} />
                <span className="hidden sm:inline">Select</span>
              </>
            )}
          </button>
        )}

        {/* Bulk actions - only show when files are selected */}
        {hasSelection && (
          <>
            <button
              onClick={onMoveSelected}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary bg-surface-hover border border-border rounded-lg hover:bg-surface-hover/80 hover:text-primary transition-colors"
              title="Move selected"
            >
              <FolderInput size={18} />
              <span className="hidden sm:inline">Move</span>
            </button>
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary bg-surface-hover border border-border rounded-lg hover:bg-surface-hover/80 hover:text-danger transition-colors"
              title="Delete selected"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </>
        )}

        {/* New folder button - always visible */}
        <button
          onClick={onNewFolder}
          className="flex items-center gap-2 px-3 py-2.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <FolderPlus size={18} />
          <span className="hidden sm:inline">New Folder</span>
        </button>
      </div>
    </div>
  );
};

export default FileToolbar;
