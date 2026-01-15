import { useTheme } from '../../context/ThemeContext';

const CalendarTask = ({ task, onClick }) => {
  const { theme } = useTheme();

  const getTypeStyles = () => {
    switch (task.displayType) {
      case 'draft':
        return {
          backgroundColor: `${theme.secondary}20`,
          borderColor: theme.secondary,
          color: theme.secondary,
          prefix: 'Draft: ',
        };
      case 'final':
        return {
          backgroundColor: `${theme.success}20`,
          borderColor: theme.success,
          color: theme.success,
          prefix: 'Final: ',
        };
      case 'both':
        return {
          backgroundColor: `${theme.primary}20`,
          borderColor: theme.primary,
          color: theme.primary,
          prefix: '',
        };
      default:
        return {
          backgroundColor: `${theme.textMuted}20`,
          borderColor: theme.textMuted,
          color: theme.textMuted,
          prefix: '',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2 py-1 rounded text-xs truncate border-l-2 transition-opacity hover:opacity-80"
      style={{
        backgroundColor: styles.backgroundColor,
        borderLeftColor: styles.borderColor,
        color: styles.color,
      }}
      title={`${styles.prefix}${task.taskName}`}
    >
      {styles.prefix}{task.taskName}
    </button>
  );
};

export default CalendarTask;
