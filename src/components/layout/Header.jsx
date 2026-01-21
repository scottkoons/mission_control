import { forwardRef } from 'react';
import { Search, Plus } from 'lucide-react';

const Header = forwardRef(({
  title,
  showDateToggle,
  dateMode,
  onDateModeChange,
  showSortToggle,
  sortMode,
  onSortModeChange,
  showSearch,
  searchValue,
  onSearchChange,
  onAddTask,
  children,
}, ref) => {
  return (
    <header className="bg-surface border-b border-border px-4 md:px-6 py-4">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Title - hidden on mobile */}
        <h1 className="hidden md:block text-xl font-bold text-text-primary flex-shrink-0">{title}</h1>

        {/* Controls */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 md:flex-none justify-end">
          {/* Date Mode Toggle */}
          {showDateToggle && (
            <select
              value={dateMode}
              onChange={(e) => onDateModeChange(e.target.value)}
              className="bg-surface-hover border border-border rounded-lg px-2 md:px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
          )}

          {/* Sort Mode Toggle */}
          {showSortToggle && (
            <select
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value)}
              className="bg-surface-hover border border-border rounded-lg px-2 md:px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Sort by Date</option>
              <option value="manual">Manual Order</option>
            </select>
          )}

          {/* Custom children (e.g., calendar controls) */}
          {children}

          {/* Search Bar */}
          {showSearch && (
            <div className="relative flex-1 md:flex-none">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"
              />
              <input
                ref={ref}
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-surface-hover border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
              />
            </div>
          )}

          {/* Add Task Button */}
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              title="Add New Task (Cmd+N)"
            >
              <Plus size={18} />
              <span className="hidden md:inline">Add New Task</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
