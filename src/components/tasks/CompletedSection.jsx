import CompletedTaskTable from './CompletedTaskTable';
import MonthlyNotes from './MonthlyNotes';

const CompletedSection = ({ monthKey, monthName, tasks, onEditTask }) => {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
      {/* Month Header */}
      <div className="bg-surface-hover px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary text-center">
          Completed in {monthName}
        </h2>
      </div>

      {/* Task Table */}
      <div className="px-2">
        <CompletedTaskTable
          tasks={tasks}
          onEditTask={onEditTask}
        />
      </div>

      {/* Footer: Notes */}
      <div className="px-6 pb-6">
        <MonthlyNotes
          monthKey={`completed-${monthKey}`}
          monthName={monthName}
        />
      </div>
    </div>
  );
};

export default CompletedSection;
