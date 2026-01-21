import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTaskRow from './SortableTaskRow';
import { multiSort, SORT_ASC, SORT_DESC, toggleDirection } from '../../utils/sortUtils';
import { useTasks } from '../../context/TaskContext';

const TaskTable = ({ tasks, onEditTask, onManualSort, getReorderGroup }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(SORT_ASC);
  const { updateSortOrder } = useTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const draggedTask = sortedTasks.find((t) => t.id === active.id);
      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);

      // If getReorderGroup is provided, only update tasks in the same group
      // (e.g., same month for flat view to stay consistent with grouped view)
      if (getReorderGroup && draggedTask) {
        const groupTasks = getReorderGroup(draggedTask);
        const groupIds = new Set(groupTasks.map((t) => t.id));
        const groupOrder = newOrder.filter((t) => groupIds.has(t.id));
        updateSortOrder(groupOrder.map((t) => t.id));
      } else {
        updateSortOrder(newOrder.map((t) => t.id));
      }

      // Switch to manual sort mode when user drags a task
      onManualSort?.();
    }
  };

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '32px' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
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
            <SortableContext
              items={sortedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedTasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
};

export default TaskTable;
