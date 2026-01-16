import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import TaskTable from './TaskTable';
import SectionNotes from './SectionNotes';
import { useTasks } from '../../context/TaskContext';
import { sortByDraftDue } from '../../utils/sortUtils';

const FlatView = ({ tasks, onEditTask, onAddTask }) => {
  const { generalNotes, updateGeneralNotes } = useTasks();
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
      <div className="px-2">
        <TaskTable
          tasks={sortedTasks}
          onEditTask={onEditTask}
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
