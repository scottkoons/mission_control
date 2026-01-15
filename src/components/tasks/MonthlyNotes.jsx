import { useState, useEffect, useRef } from 'react';
import { useTasks } from '../../context/TaskContext';

const MonthlyNotes = ({ monthKey, monthName }) => {
  const { monthlyNotes, updateMonthlyNotes } = useTasks();
  const [notes, setNotes] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setNotes(monthlyNotes[monthKey] || '');
  }, [monthKey, monthlyNotes]);

  const handleChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);

    // Debounce save
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updateMonthlyNotes(monthKey, newNotes);
    }, 500);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Save immediately on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    updateMonthlyNotes(monthKey, notes);
  };

  return (
    <div className="flex-1 flex flex-col">
      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        {monthName} Notes
      </label>
      <textarea
        value={notes}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder="Type generic notes here..."
        className={`w-full flex-1 bg-surface-hover border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none transition-colors min-h-[80px] ${
          isFocused ? 'border-primary ring-1 ring-primary' : 'border-border'
        }`}
      />
    </div>
  );
};

export default MonthlyNotes;
