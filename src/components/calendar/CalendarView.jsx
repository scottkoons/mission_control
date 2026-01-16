import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import CalendarGrid from './CalendarGrid';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTasks } from '../../context/TaskContext';
import { exportPDFCalendar } from '../../utils/pdfUtils';

const CalendarView = ({ tasks, onEditTask }) => {
  const { updateTask } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState('all'); // 'draft' | 'final' | 'all'
  const { theme } = useTheme();
  const { addToast } = useToast();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get tasks for the current month based on filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.completedAt) return false; // Don't show completed tasks

      const checkDate = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date >= monthStart && date <= monthEnd;
      };

      if (dateFilter === 'draft') {
        return checkDate(task.draftDue);
      } else if (dateFilter === 'final') {
        return checkDate(task.finalDue);
      } else {
        return checkDate(task.draftDue) || checkDate(task.finalDue);
      }
    });
  }, [tasks, currentDate, dateFilter, monthStart, monthEnd]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleExportPDF = () => {
    try {
      // Filter out completed and unscheduled tasks for PDF
      const pdfTasks = tasks.filter((t) => !t.completedAt && (t.draftDue || t.finalDue));
      exportPDFCalendar(pdfTasks, dateFilter);
      addToast('Calendar PDF exported successfully', { type: 'success', duration: 3000 });
    } catch (error) {
      console.error('PDF export error:', error);
      addToast('Error exporting calendar PDF', { type: 'error' });
    }
  };

  const handleDateChange = async (taskId, dateType, newDate) => {
    try {
      const updates = dateType === 'draft'
        ? { draftDue: newDate }
        : { finalDue: newDate };
      await updateTask(taskId, updates);
      addToast(`${dateType === 'draft' ? 'Draft' : 'Final'} date updated`, { type: 'success', duration: 2000 });
    } catch (error) {
      console.error('Error updating date:', error);
      addToast('Error updating date', { type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-text-primary">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-lg hover:bg-surface-hover text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Date Filter Toggles */}
          <div className="flex items-center gap-1 bg-surface-hover rounded-lg p-1">
            <button
              onClick={() => setDateFilter('draft')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                dateFilter === 'draft'
                  ? 'bg-secondary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Draft Date
            </button>
            <button
              onClick={() => setDateFilter('final')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                dateFilter === 'final'
                  ? 'bg-success text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Final Date
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                dateFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-surface-hover hover:bg-border rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <CalendarGrid
        currentDate={currentDate}
        tasks={filteredTasks}
        dateFilter={dateFilter}
        onEditTask={onEditTask}
        onDateChange={handleDateChange}
      />
    </div>
  );
};

export default CalendarView;
