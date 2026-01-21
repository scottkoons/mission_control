import { Plus } from 'lucide-react';
import TaskTable from './TaskTable';
import MonthlyNotes from './MonthlyNotes';
import { getMonthDisplayName } from '../../utils/dateUtils';

const MonthSection = ({ monthKey, tasks, onEditTask, onAddTask, onManualSort }) => {
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
          onManualSort={onManualSort}
        />
      </div>

      {/* Footer: Notes with Add Button */}
      <div className="px-6 pb-6 pt-4 flex flex-col flex-1">
        <MonthlyNotes
          monthKey={monthKey}
          monthName={monthName}
          rightAction={
            <button
              onClick={() => onAddTask(monthKey)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={16} />
              <span>Add New Task</span>
            </button>
          }
        />
      </div>
    </div>
  );
};

export default MonthSection;
