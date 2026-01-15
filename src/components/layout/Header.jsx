import { forwardRef } from 'react';
import { Search, Plus } from 'lucide-react';

const Header = forwardRef(({
  title,
  showDateToggle,
  dateMode,
  onDateModeChange,
  showSearch,
  searchValue,
  onSearchChange,
  onAddTask,
  children,
}, ref) => {
  return (
    <header className="bg-surface border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>

        {/* Right Side Controls */}
        <div className="flex items-center gap-4">
          {/* Date Mode Toggle */}
          {showDateToggle && (
            <select
              value={dateMode}
              onChange={(e) => onDateModeChange(e.target.value)}
              className="bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="draft">Draft Date</option>
              <option value="final">Final Date</option>
            </select>
          )}

          {/* Custom children (e.g., calendar controls) */}
          {children}

          {/* Search Bar */}
          {showSearch && (
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"
              />
              <input
                ref={ref}
                type="text"
                placeholder="Search... (Cmd+K)"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-surface-hover border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary w-64"
              />
            </div>
          )}

          {/* Add Task Button */}
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Add New Task (Cmd+N)"
            >
              <Plus size={18} />
              <span>Add New Task</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
