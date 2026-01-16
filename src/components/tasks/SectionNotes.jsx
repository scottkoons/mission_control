import { useState, useEffect, useRef } from 'react';

const SectionNotes = ({ noteKey, label, notes, onUpdate, placeholder, rightAction }) => {
  const [localNotes, setLocalNotes] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalNotes(notes || '');
  }, [noteKey, notes]);

  const handleChange = (e) => {
    const newNotes = e.target.value;
    setLocalNotes(newNotes);

    // Debounce save
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onUpdate(noteKey, newNotes);
    }, 500);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Save immediately on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onUpdate(noteKey, localNotes);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
        {rightAction}
      </div>
      <textarea
        value={localNotes}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder || 'Type notes here...'}
        className={`w-full bg-surface-hover border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none transition-colors min-h-[80px] ${
          isFocused ? 'border-primary ring-1 ring-primary' : 'border-border'
        }`}
      />
    </div>
  );
};

export default SectionNotes;
