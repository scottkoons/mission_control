import { useState } from 'react';
import Header from '../components/layout/Header';
import { useTasks } from '../context/TaskContext';

const Completed = () => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { getCompletedTasks } = useTasks();
  const completedTasks = getCompletedTasks();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Completed Tasks"
        showSearch={false}
        onAddTask={() => setShowTaskModal(true)}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-text-secondary text-center py-12">
          <p className="text-lg">Completed Tasks</p>
          <p className="text-sm mt-2">Phase 4 will implement the completed tasks view</p>
          <p className="text-sm mt-4">Completed tasks: {completedTasks.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Completed;
