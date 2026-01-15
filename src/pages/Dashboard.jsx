import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import { useTasks } from '../context/TaskContext';
import { storageService } from '../services/storageService';

const Dashboard = ({ currentView, onViewChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateMode, setDateMode] = useState('draft');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { tasks, getActiveTasks } = useTasks();

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
        onAddTask={() => setShowTaskModal(true)}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {currentView === 'grouped' && (
          <div className="text-text-secondary text-center py-12">
            <p className="text-lg">Grouped View</p>
            <p className="text-sm mt-2">Phase 2 will implement the task table with monthly sections</p>
            <p className="text-sm mt-4">Tasks loaded: {activeTasks.length}</p>
          </div>
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
    </div>
  );
};

export default Dashboard;
