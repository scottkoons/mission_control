import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import TaskTable from './TaskTable';
import SectionNotes from './SectionNotes';
import { useTasks } from '../../context/TaskContext';
import { sortByDraftDue, sortBySortOrder } from '../../utils/sortUtils';
import { getMonthKey } from '../../utils/dateUtils';

const FlatView = ({ tasks, onEditTask, onAddTask, sortMode, onManualSort }) => {
  const { generalNotes, updateGeneralNotes } = useTasks();
  // Sort tasks based on sortMode
  // Both modes sort by date first (to match grouped view's month ordering),
  // then by sortOrder within each month for manual mode
  const sortedTasks = useMemo(() => {
    const dated = tasks.filter((t) => t.draftDue || t.finalDue);
    const unscheduled = tasks.filter((t) => !t.draftDue && !t.finalDue);

    if (sortMode === 'manual') {
      // Manual mode: sort by month first, then by sortOrder within each month
      // This matches the grouped view's ordering
      dated.sort((a, b) => {
        const monthA = getMonthKey(a.draftDue);
        const monthB = getMonthKey(b.draftDue);
        if (monthA !== monthB) {
          return monthA.localeCompare(monthB);
        }
        // Within same month, use sortOrder (then createdAt for stability)
        const orderDiff = sortBySortOrder(a, b);
        if (orderDiff !== 0) return orderDiff;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });

      // Unscheduled tasks also sort by sortOrder, then createdAt
      unscheduled.sort((a, b) => {
        const orderDiff = sortBySortOrder(a, b);
        if (orderDiff !== 0) return orderDiff;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
    } else {
      // Date mode: sort by draft due date
      dated.sort((a, b) => sortByDraftDue(a, b));
    }

    return [...dated, ...unscheduled];
  }, [tasks, sortMode]);

  // Get all tasks in the same month as the given task (for reordering)
  const getReorderGroup = (task) => {
    if (!task.draftDue && !task.finalDue) {
      // Unscheduled tasks group together
      return tasks.filter((t) => !t.draftDue && !t.finalDue);
    }
    const taskMonth = getMonthKey(task.draftDue);
    return tasks.filter((t) => getMonthKey(t.draftDue) === taskMonth);
  };

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
      <div className="px-2">
        <TaskTable
          tasks={sortedTasks}
          onEditTask={onEditTask}
          onManualSort={onManualSort}
          getReorderGroup={getReorderGroup}
        />
      </div>

      {/* Footer: Notes with Add Button */}
      <div className="px-6 pb-6 pt-4 flex flex-col flex-1">
        <SectionNotes
          noteKey="flat-view"
          label="General Notes"
          notes={generalNotes['flat-view'] || ''}
          onUpdate={updateGeneralNotes}
          placeholder="Type general notes here..."
          rightAction={
            <button
              onClick={() => onAddTask()}
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

export default FlatView;
