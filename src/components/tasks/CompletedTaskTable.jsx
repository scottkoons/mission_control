import { useState } from 'react';
import { GripVertical, Trash2, Paperclip } from 'lucide-react';
import DateBadge from './DateBadge';
import ConfirmModal from '../common/ConfirmModal';
import { useTasks } from '../../context/TaskContext';

const CompletedTaskRow = ({ task, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toggleDraftComplete, toggleFinalComplete, deleteTask } = useTasks();

  const hasAttachments = task.attachments && task.attachments.length > 0;

  const handleRowClick = () => {
    onEdit(task);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id);
  };

  return (
    <tr
      className={`border-b border-border transition-colors cursor-pointer ${
        isHovered ? 'bg-surface-hover' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      {/* Placeholder for drag handle (disabled for completed) */}
      <td className="w-8 px-2">
        <div className="text-text-muted/30 p-1">
          <GripVertical size={16} />
        </div>
      </td>

      {/* Task Name */}
      <td className="px-4 py-3">
        <span className="text-sm line-through text-text-muted">
          {task.taskName || 'Untitled Task'}
        </span>
      </td>

      {/* Notes */}
      <td className="px-4 py-3">
        <span className="text-sm line-through text-text-muted truncate max-w-xs block">
          {task.notes || 'No notes'}
        </span>
      </td>

      {/* Draft Due - all completed show green */}
      <td className="px-4 py-3">
        <DateBadge
          date={task.draftDue}
          isComplete={true}
          onClick={() => toggleDraftComplete(task.id)}
        />
      </td>

      {/* Final Due - all completed show green */}
      <td className="px-4 py-3">
        <DateBadge
          date={task.finalDue}
          isComplete={true}
          onClick={() => toggleFinalComplete(task.id)}
        />
      </td>

      {/* Info/Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {hasAttachments && (
            <span className="text-secondary p-1">
              <Paperclip size={16} />
            </span>
          )}
          <button
            onClick={handleDeleteClick}
            className="p-1 rounded text-text-muted hover:text-danger transition-colors"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.taskName || 'Untitled Task'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </tr>
  );
};

const CompletedTaskTable = ({ tasks, onEditTask }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No completed tasks in this section
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="w-8 px-2"></th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Task Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Notes
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Draft Due
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Final Due
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Info
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <CompletedTaskRow
              key={task.id}
              task={task}
              onEdit={onEditTask}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompletedTaskTable;
