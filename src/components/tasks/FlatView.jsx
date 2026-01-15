import { useMemo } from 'react';
import TaskTable from './TaskTable';
import { sortByDraftDue } from '../../utils/sortUtils';

const FlatView = ({ tasks, onEditTask }) => {
  // Sort tasks: dated tasks by draft due, then unscheduled at bottom
  const sortedTasks = useMemo(() => {
    const dated = tasks.filter((t) => t.draftDue || t.finalDue);
    const unscheduled = tasks.filter((t) => !t.draftDue && !t.finalDue);

    // Sort dated tasks by draft due
    dated.sort((a, b) => sortByDraftDue(a, b));

    return [...dated, ...unscheduled];
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-text-secondary">No tasks yet</p>
        <p className="text-sm text-text-muted mt-2">
          Click "Add New Task" to create your first task
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-surface-hover px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary text-center">
          All Tasks
        </h2>
      </div>

      {/* Task Table */}
      <div className="px-2 pb-4">
        <TaskTable
          tasks={sortedTasks}
          onEditTask={onEditTask}
        />
      </div>
    </div>
  );
};

export default FlatView;
