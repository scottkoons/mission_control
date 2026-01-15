import { useTheme } from '../../context/ThemeContext';
import { getDateStatus } from '../../utils/dateUtils';

const CalendarTask = ({ task, onClick }) => {
  const { theme } = useTheme();

  // Get the relevant date and completion status based on display type
  const getDateAndStatus = () => {
    if (task.displayType === 'draft') {
      return { date: task.draftDue, isComplete: task.draftComplete === true };
    }
    if (task.displayType === 'final') {
      return { date: task.finalDue, isComplete: task.finalComplete === true };
    }
    // For 'both', use final date - only complete if both are done
    return {
      date: task.finalDue,
      isComplete: task.draftComplete === true && task.finalComplete === true
    };
  };

  // Get status color (same logic as DateBadge)
  const getStatusColor = () => {
    const { date, isComplete } = getDateAndStatus();
    const status = getDateStatus(date, isComplete);

    switch (status) {
      case 'completed':
        return theme.success;
      case 'overdue':
        return theme.danger;
      case 'soon':
        return theme.warning;
      case 'future':
      default:
        return theme.secondary;
    }
  };

  const color = getStatusColor();
  const isDraft = task.displayType === 'draft';
  const prefix = isDraft ? 'Draft: ' : task.displayType === 'final' ? 'Final: ' : '';

  // Draft dates get hatched pattern, final dates get solid background
  const background = isDraft
    ? `repeating-linear-gradient(
        -45deg,
        ${color}15,
        ${color}15 4px,
        ${color}30 4px,
        ${color}30 8px
      )`
    : `${color}20`;

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2 py-1 rounded text-xs truncate border-l-2 transition-opacity hover:opacity-80"
      style={{
        background: background,
        borderLeftColor: color,
        color: color,
      }}
      title={`${prefix}${task.taskName}`}
    >
      {prefix}{task.taskName}
    </button>
  );
};

export default CalendarTask;
