import { formatDate, getDateStatus } from '../../utils/dateUtils';
import { useTheme } from '../../context/ThemeContext';

const DateBadge = ({ date, isComplete, onClick, className = '' }) => {
  const { theme } = useTheme();
  const status = getDateStatus(date, isComplete);

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return theme.success;
      case 'overdue':
        return theme.danger;
      case 'soon':
        return theme.warning;
      case 'future':
        return theme.secondary;
      default:
        return theme.textMuted;
    }
  };

  const color = getStatusColor();
  const displayText = date ? formatDate(date) : '-';

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick && date) {
      onClick();
    }
  };

  if (!date) {
    return (
      <span className={`text-sm text-text-muted ${className}`}>
        -
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
      title={isComplete ? 'Click to mark incomplete' : 'Click to mark complete'}
    >
      {displayText}
    </button>
  );
};

export default DateBadge;
