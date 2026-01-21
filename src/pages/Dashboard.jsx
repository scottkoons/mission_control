import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../components/layout/Header';
import MonthSection from '../components/tasks/MonthSection';
import FlatView from '../components/tasks/FlatView';
import CompanyView from '../components/tasks/CompanyView';
import CategoryView from '../components/tasks/CategoryView';
import CalendarView from '../components/calendar/CalendarView';
import TaskModal from '../components/tasks/TaskModal';
import { useTasks } from '../context/TaskContext';
import { storageService } from '../services/storageService';
import { groupTasksByMonth } from '../utils/dateUtils';
import { multiSort, SORT_ASC } from '../utils/sortUtils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const Dashboard = ({ currentView, onViewChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateMode, setDateMode] = useState('draft');
  const [sortMode, setSortMode] = useState('date'); // 'date' or 'manual'
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultMonth, setDefaultMonth] = useState(null);
  const [focusAttachments, setFocusAttachments] = useState(false);
  const { getActiveTasks } = useTasks();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const settings = storageService.getSettings();
    setDateMode(settings.groupedDateMode || 'draft');
    setSortMode(settings.sortMode || 'date');
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAddTask: () => handleAddTask(),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onEscape: () => {
      if (showTaskModal) {
        handleCloseModal();
      }
    },
  });

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    storageService.saveSettings({ groupedDateMode: mode });
  };

  const handleSortModeChange = (mode) => {
    setSortMode(mode);
    storageService.saveSettings({ sortMode: mode });
  };

  const getTitle = () => {
    switch (currentView) {
      case 'grouped':
        return 'Marketing Task List';
      case 'flat':
        return 'Marketing Task List (Flat)';
      case 'company':
        return 'Tasks by Company';
      case 'category':
        return 'Tasks by Category';
      case 'calendar':
        return 'Calendar View';
      default:
        return 'Marketing Task List';
    }
  };

  const activeTasks = getActiveTasks();

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return activeTasks;

    const query = searchQuery.toLowerCase();
    return activeTasks.filter(
      (task) =>
        task.taskName?.toLowerCase().includes(query) ||
        task.notes?.toLowerCase().includes(query)
    );
  }, [activeTasks, searchQuery]);

  // Group tasks by month
  const { groups: taskGroups, sortedKeys: monthKeys } = useMemo(() => {
    const dateField = dateMode === 'draft' ? 'draftDue' : 'finalDue';
    return groupTasksByMonth(filteredTasks, dateField);
  }, [filteredTasks, dateMode]);

  // Sort tasks within each group based on sortMode
  const sortedGroups = useMemo(() => {
    const result = {};
    for (const key of monthKeys) {
      if (sortMode === 'manual') {
        // Manual mode: sort by sortOrder first, then by date, then by createdAt for stability
        result[key] = multiSort(taskGroups[key], [
          { field: 'sortOrder', direction: SORT_ASC },
          { field: 'draftDue', direction: SORT_ASC },
          { field: 'createdAt', direction: SORT_ASC },
        ]);
      } else {
        // Date mode: sort by draft due date, then by sortOrder, then by createdAt
        result[key] = multiSort(taskGroups[key], [
          { field: 'draftDue', direction: SORT_ASC },
          { field: 'sortOrder', direction: SORT_ASC },
          { field: 'createdAt', direction: SORT_ASC },
        ]);
      }
    }
    return result;
  }, [taskGroups, monthKeys, sortMode]);

  const handleEditTask = (task, focusOnAttachments = false) => {
    setEditingTask(task);
    setFocusAttachments(focusOnAttachments);
    setShowTaskModal(true);
  };

  const handleAddTask = (monthKey = null) => {
    setEditingTask(null);
    setDefaultMonth(monthKey);
    setFocusAttachments(false);
    setShowTaskModal(true);
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setDefaultMonth(null);
    setFocusAttachments(false);
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {currentView !== 'calendar' && (
        <Header
          ref={searchInputRef}
          title={getTitle()}
          showDateToggle={currentView === 'grouped'}
          dateMode={dateMode}
          onDateModeChange={handleDateModeChange}
          showSortToggle={currentView === 'grouped' || currentView === 'flat'}
          sortMode={sortMode}
          onSortModeChange={handleSortModeChange}
          showSearch={true}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddTask={() => handleAddTask()}
        />
      )}

      <div className={`flex-1 overflow-y-auto p-6 ${currentView === 'calendar' ? 'flex flex-col' : ''}`}>
        {currentView === 'grouped' && (
          <>
            {monthKeys.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-text-secondary">
                  {searchQuery ? 'No tasks match your search' : 'No tasks yet'}
                </p>
                <p className="text-sm text-text-muted mt-2">
                  Click "Add New Task" or press Cmd+N to create your first task
                </p>
              </div>
            ) : (
              monthKeys.map((monthKey) => (
                <MonthSection
                  key={monthKey}
                  monthKey={monthKey}
                  tasks={sortedGroups[monthKey]}
                  onEditTask={handleEditTask}
                  onAddTask={handleAddTask}
                  onManualSort={() => handleSortModeChange('manual')}
                />
              ))
            )}
          </>
        )}

        {currentView === 'flat' && (
          <FlatView
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            onAddTask={handleAddTask}
            sortMode={sortMode}
            onManualSort={() => handleSortModeChange('manual')}
          />
        )}

        {currentView === 'company' && (
          <CompanyView
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            onAddTask={handleAddTask}
          />
        )}

        {currentView === 'category' && (
          <CategoryView
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            onAddTask={handleAddTask}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            tasks={activeTasks}
            onEditTask={handleEditTask}
          />
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={handleCloseModal}
        task={editingTask}
        defaultMonth={defaultMonth}
        focusAttachments={focusAttachments}
      />
    </div>
  );
};

export default Dashboard;
