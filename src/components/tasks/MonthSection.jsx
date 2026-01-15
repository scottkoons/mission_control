import { Plus } from 'lucide-react';
import TaskTable from './TaskTable';
import MonthlyNotes from './MonthlyNotes';
import { getMonthDisplayName } from '../../utils/dateUtils';

const MonthSection = ({ monthKey, tasks, onEditTask, onAddTask }) => {
  const monthName = getMonthDisplayName(monthKey);

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
      {/* Month Header */}
      <div className="bg-surface-hover px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary text-center">
          {monthName}
        </h2>
      </div>

      {/* Task Table */}
      <div className="px-2">
        <TaskTable
          tasks={tasks}
          onEditTask={onEditTask}
        />
      </div>

      {/* Footer: Notes + Add Button */}
      <div className="px-6 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <MonthlyNotes
              monthKey={monthKey}
              monthName={monthName}
            />
          </div>
          <button
            onClick={() => onAddTask(monthKey)}
            className="mt-8 flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Plus size={16} />
            <span>Add New Task</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthSection;
