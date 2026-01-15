import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import CalendarTask from './CalendarTask';

const CalendarGrid = ({ currentDate, tasks, dateFilter, onEditTask }) => {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    let allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Always fill to 42 days (6 complete rows) for consistent layout
    while (allDays.length < 42) {
      const lastDay = allDays[allDays.length - 1];
      allDays.push(addDays(lastDay, 1));
    }

    return allDays;
  }, [currentDate]);

  // Get tasks for a specific day
  const getTasksForDay = (day) => {
    const tasksForDay = [];

    tasks.forEach((task) => {
      // Check draft due - use parseISO to avoid timezone issues
      if ((dateFilter === 'all' || dateFilter === 'draft') && task.draftDue) {
        const draftDate = parseISO(task.draftDue);
        if (isSameDay(draftDate, day)) {
          tasksForDay.push({
            ...task,
            displayType: 'draft',
          });
        }
      }

      // Check final due (avoid duplicate if same day as draft)
      if ((dateFilter === 'all' || dateFilter === 'final') && task.finalDue) {
        const finalDate = parseISO(task.finalDue);
        if (isSameDay(finalDate, day)) {
          // Don't add duplicate if draft and final are same day and showing all
          const isDuplicate =
            dateFilter === 'all' &&
            task.draftDue &&
            isSameDay(parseISO(task.draftDue), finalDate);

          if (!isDuplicate) {
            tasksForDay.push({
              ...task,
              displayType: 'final',
            });
          } else {
            // Mark the existing draft entry as both
            const existingDraft = tasksForDay.find(
              (t) => t.id === task.id && t.displayType === 'draft'
            );
            if (existingDraft) {
              existingDraft.displayType = 'both';
            }
          }
        }
      }
    });

    return tasksForDay;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col bg-surface rounded-xl border border-border overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-border">
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-1 ${
                isCurrentMonth ? 'bg-surface' : 'bg-surface-hover/50'
              }`}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1">
                <span
                  className={`w-7 h-7 flex items-center justify-center text-sm rounded-full ${
                    isDayToday
                      ? 'bg-secondary text-white font-semibold'
                      : isCurrentMonth
                      ? 'text-text-primary'
                      : 'text-text-muted'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Tasks for this day */}
              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {dayTasks.map((task, index) => (
                  <CalendarTask
                    key={`${task.id}-${task.displayType}-${index}`}
                    task={task}
                    onClick={() => onEditTask(task)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
