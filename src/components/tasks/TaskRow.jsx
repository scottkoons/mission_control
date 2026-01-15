import { useState } from 'react';
import { GripVertical, Trash2, Paperclip } from 'lucide-react';
import DateBadge from './DateBadge';
import ConfirmModal from '../common/ConfirmModal';
import { useTasks } from '../../context/TaskContext';

const TaskRow = ({
  task,
  onEdit,
  dragHandleProps,
  isDragging,
}) => {
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

  const handleAttachmentClick = (e) => {
    e.stopPropagation();
    onEdit(task, true); // Open with attachments focused
  };

  return (
    <tr
      className={`border-b border-border transition-colors cursor-pointer ${
        isDragging ? 'bg-surface-hover opacity-50' : isHovered ? 'bg-surface-hover' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      {/* Drag Handle */}
      <td className="w-8 px-2">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>
      </td>

      {/* Task Name */}
      <td className="px-4 py-3">
        <span className={`text-sm ${task.completedAt ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {task.taskName || 'Untitled Task'}
        </span>
      </td>

      {/* Notes */}
      <td className="px-4 py-3">
        <span className={`text-sm ${task.completedAt ? 'line-through text-text-muted' : 'text-text-secondary'}`}>
          {task.notes || 'No notes'}
        </span>
      </td>

      {/* Draft Due */}
      <td className="px-4 py-3">
        <DateBadge
          date={task.draftDue}
          isComplete={task.draftComplete}
          onClick={() => toggleDraftComplete(task.id)}
        />
      </td>

      {/* Final Due */}
      <td className="px-4 py-3">
        <DateBadge
          date={task.finalDue}
          isComplete={task.finalComplete}
          onClick={() => toggleFinalComplete(task.id)}
        />
      </td>

      {/* Info/Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Attachment indicator */}
          <button
            onClick={handleAttachmentClick}
            className={`p-1 rounded transition-colors ${
              hasAttachments
                ? 'text-secondary hover:text-secondary/80'
                : 'text-text-muted hover:text-secondary'
            }`}
            title={hasAttachments ? `${task.attachments.length} attachment(s)` : 'Add attachments'}
          >
            <Paperclip size={16} />
          </button>

          {/* Delete button */}
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

export default TaskRow;
