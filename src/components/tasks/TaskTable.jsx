import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import TaskRow from './TaskRow';
import { multiSort, SORT_ASC, SORT_DESC, toggleDirection } from '../../utils/sortUtils';

const TaskTable = ({ tasks, onEditTask, onReorder }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(SORT_ASC);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(toggleDirection(sortDirection));
    } else {
      setSortField(field);
      setSortDirection(SORT_ASC);
    }
  };

  const sortedTasks = sortField
    ? multiSort(tasks, [{ field: sortField, direction: sortDirection }])
    : tasks;

  const SortHeader = ({ field, children }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === SORT_ASC ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )
        )}
      </div>
    </th>
  );

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No tasks in this section
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="w-8 px-2"></th>
            <SortHeader field="taskName">Task Name</SortHeader>
            <SortHeader field="notes">Notes</SortHeader>
            <SortHeader field="draftDue">Draft Due</SortHeader>
            <SortHeader field="finalDue">Final Due</SortHeader>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Info
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={onEditTask}
              dragHandleProps={{}}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
