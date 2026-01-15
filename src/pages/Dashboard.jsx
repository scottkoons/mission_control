import { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import MonthSection from '../components/tasks/MonthSection';
import TaskModal from '../components/tasks/TaskModal';
import { useTasks } from '../context/TaskContext';
import { storageService } from '../services/storageService';
import { groupTasksByMonth, getMonthKey } from '../utils/dateUtils';
import { defaultTaskSort } from '../utils/sortUtils';

const Dashboard = ({ currentView, onViewChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateMode, setDateMode] = useState('draft');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultMonth, setDefaultMonth] = useState(null);
  const [focusAttachments, setFocusAttachments] = useState(false);
  const { getActiveTasks } = useTasks();

  useEffect(() => {
    const settings = storageService.getSettings();
    setDateMode(settings.groupedDateMode || 'draft');
  }, []);

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    storageService.saveSettings({ groupedDateMode: mode });
  };

  const getTitle = () => {
    switch (currentView) {
      case 'grouped':
        return 'Marketing Task List';
      case 'flat':
        return 'Marketing Task List (Flat)';
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

  // Sort tasks within each group
  const sortedGroups = useMemo(() => {
    const result = {};
    for (const key of monthKeys) {
      result[key] = defaultTaskSort(taskGroups[key]);
    }
    return result;
  }, [taskGroups, monthKeys]);

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
      <Header
        title={getTitle()}
        showDateToggle={currentView === 'grouped'}
        dateMode={dateMode}
        onDateModeChange={handleDateModeChange}
        showSearch={currentView !== 'calendar'}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onAddTask={() => handleAddTask()}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {currentView === 'grouped' && (
          <>
            {monthKeys.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-text-secondary">
                  {searchQuery ? 'No tasks match your search' : 'No tasks yet'}
                </p>
                <p className="text-sm text-text-muted mt-2">
                  Click "Add New Task" to create your first task
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
                />
              ))
            )}
          </>
        )}

        {currentView === 'flat' && (
          <div className="text-text-secondary text-center py-12">
            <p className="text-lg">Flat View</p>
            <p className="text-sm mt-2">Phase 4 will implement the flat task list</p>
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="text-text-secondary text-center py-12">
            <p className="text-lg">Calendar View</p>
            <p className="text-sm mt-2">Phase 4 will implement the calendar grid</p>
          </div>
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
