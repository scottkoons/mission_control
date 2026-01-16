import { ChevronRight, Home, Search } from 'lucide-react';

const FolderBreadcrumbs = ({ folderPath, searchQuery, onNavigateToRoot, onNavigateToFolder, onClearSearch }) => {
  // If searching, show search breadcrumb
  if (searchQuery) {
    return (
      <nav className="flex items-center gap-1 text-sm">
        <button
          onClick={() => {
            onClearSearch();
            onNavigateToRoot();
          }}
          className="flex items-center gap-1 text-text-muted hover:text-primary transition-colors"
        >
          <Home size={16} />
          <span>All Files</span>
        </button>
        <ChevronRight size={16} className="text-text-muted" />
        <span className="flex items-center gap-1 text-text-primary">
          <Search size={14} />
          Search Results
        </span>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap">
      <button
        onClick={onNavigateToRoot}
        className={`flex items-center gap-1 transition-colors ${
          folderPath.length === 0
            ? 'text-text-primary font-medium'
            : 'text-text-muted hover:text-primary'
        }`}
      >
        <Home size={16} />
        <span>All Files</span>
      </button>

      {folderPath.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-1">
          <ChevronRight size={16} className="text-text-muted" />
          <button
            onClick={() => onNavigateToFolder(folder.id)}
            className={`transition-colors ${
              index === folderPath.length - 1
                ? 'text-text-primary font-medium'
                : 'text-text-muted hover:text-primary'
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  );
};

export default FolderBreadcrumbs;
