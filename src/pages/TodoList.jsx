import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTodos } from '../context/TodoContext';

const SortableTodoItem = ({ todo, onToggle, onUpdate, onDelete, onExpand, isExpanded }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editNotes, setEditNotes] = useState(todo.notes || '');
  const inputRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate(todo.id, { text: editText, notes: editNotes });
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditText(todo.text);
      setEditNotes(todo.notes || '');
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface border border-border rounded-lg mb-2 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary p-1"
        >
          <GripVertical size={16} />
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            todo.completed
              ? 'bg-primary border-primary'
              : 'border-border hover:border-primary'
          }`}
        >
          {todo.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Text */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-surface-hover border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter item..."
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`flex-1 cursor-text ${
              todo.completed ? 'line-through text-text-muted' : 'text-text-primary'
            }`}
          >
            {todo.text || <span className="text-text-muted italic">Click to add text...</span>}
          </span>
        )}

        {/* Expand/Collapse for Notes */}
        <button
          onClick={() => onExpand(todo.id)}
          className="p-1 text-text-muted hover:text-text-secondary transition-colors"
          title={isExpanded ? 'Hide notes' : 'Show notes'}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1 text-text-muted hover:text-danger transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Notes Section */}
      {isExpanded && (
        <div className="px-4 pb-3 pl-14">
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            onBlur={() => onUpdate(todo.id, { notes: editNotes })}
            placeholder="Add notes..."
            rows={2}
            className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      )}
    </div>
  );
};

const TodoList = () => {
  const { todos, loading, createTodo, updateTodo, deleteTodo, reorderTodos, toggleComplete } = useTodos();
  const [expandedIds, setExpandedIds] = useState(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);

    const reordered = arrayMove(todos, oldIndex, newIndex);
    reorderTodos(reordered);
  };

  const handleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNewTodo = async () => {
    const newTodo = await createTodo('');
    if (newTodo) {
      setExpandedIds((prev) => new Set(prev).add(newTodo.id));
    }
  };

  const incompleteTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Quick Notes</h1>
          <button
            onClick={handleNewTodo}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            <span>New Item</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-text-secondary text-center py-12">
            <p>Loading...</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-text-secondary">No items yet</p>
            <p className="text-sm text-text-muted mt-2">Click "New Item" to add your first note</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Active Items */}
            {incompleteTodos.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={incompleteTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {incompleteTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleComplete}
                      onUpdate={updateTodo}
                      onDelete={deleteTodo}
                      onExpand={handleExpand}
                      isExpanded={expandedIds.has(todo.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {/* Completed Items */}
            {completedTodos.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-medium text-text-muted mb-3">
                  Completed ({completedTodos.length})
                </h2>
                {completedTodos.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleComplete}
                    onUpdate={updateTodo}
                    onDelete={deleteTodo}
                    onExpand={handleExpand}
                    isExpanded={expandedIds.has(todo.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
