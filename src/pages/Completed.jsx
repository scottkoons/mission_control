import { useState, useMemo } from 'react';
import Header from '../components/layout/Header';
import TaskModal from '../components/tasks/TaskModal';
import CompletedSection from '../components/tasks/CompletedSection';
import { useTasks } from '../context/TaskContext';
import { getMonthKey, getMonthDisplayName } from '../utils/dateUtils';

const Completed = () => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const { getCompletedTasks } = useTasks();
  const completedTasks = getCompletedTasks();

  // Group tasks by completion month
  const { groups, sortedKeys } = useMemo(() => {
    const grouped = {};

    completedTasks.forEach((task) => {
      const monthKey = task.completedAt ? getMonthKey(task.completedAt) : 'unknown';
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(task);
    });

    // Sort keys in descending order (most recent first)
    const sorted = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return { groups: grouped, sortedKeys: sorted };
  }, [completedTasks]);

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Completed Tasks"
        showSearch={false}
        onAddTask={() => setShowTaskModal(true)}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {completedTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-text-secondary">No completed tasks yet</p>
            <p className="text-sm text-text-muted mt-2">
              Tasks will appear here when both draft and final dates are marked complete
            </p>
          </div>
        ) : (
          sortedKeys.map((monthKey) => (
            <CompletedSection
              key={monthKey}
              monthKey={monthKey}
              monthName={getMonthDisplayName(monthKey)}
              tasks={groups[monthKey]}
              onEditTask={handleEditTask}
            />
          ))
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={handleCloseModal}
        task={editingTask}
      />
    </div>
  );
};

export default Completed;
