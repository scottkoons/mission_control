import { useMemo } from 'react';
import { Plus, Tag } from 'lucide-react';
import TaskTable from './TaskTable';
import SectionNotes from './SectionNotes';
import { useCategories } from '../../context/CategoryContext';
import { useTasks } from '../../context/TaskContext';
import { defaultTaskSort } from '../../utils/sortUtils';

const CategorySection = ({ categoryId, categoryName, tasks, onEditTask, onAddTask, notes, onUpdateNotes }) => {
  const noteKey = categoryId || 'unassigned';

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
      {/* Category Header */}
      <div className="bg-surface-hover px-6 py-4 border-b border-border">
        <div className="flex items-center justify-center gap-3">
          <Tag size={24} className="text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">
            {categoryName}
          </h2>
        </div>
      </div>

      {/* Task Table */}
      <div className="px-2">
        <TaskTable
          tasks={tasks}
          onEditTask={onEditTask}
        />
      </div>

      {/* Footer: Notes with Add Button */}
      <div className="px-6 pb-6 pt-4 flex flex-col flex-1">
        <SectionNotes
          noteKey={noteKey}
          label={`${categoryName} Notes`}
          notes={notes}
          onUpdate={onUpdateNotes}
          placeholder={`Notes for ${categoryName}...`}
          rightAction={
            <button
              onClick={() => onAddTask(categoryId)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={16} />
              <span>Add New Task</span>
            </button>
          }
        />
      </div>
    </div>
  );
};

const CategoryView = ({ tasks, onEditTask, onAddTask }) => {
  const { categories } = useCategories();
  const { categoryNotes, updateCategoryNotes } = useTasks();

  // Group tasks by category
  const { groups, sortedKeys } = useMemo(() => {
    const grouped = {};

    tasks.forEach((task) => {
      const key = task.categoryId || 'unassigned';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });

    // Sort tasks within each group
    for (const key of Object.keys(grouped)) {
      grouped[key] = defaultTaskSort(grouped[key]);
    }

    // Sort keys: categories first (alphabetically by name), then unassigned at the end
    const categoryKeys = Object.keys(grouped).filter(k => k !== 'unassigned');
    categoryKeys.sort((a, b) => {
      const categoryA = categories.find(c => c.id === a);
      const categoryB = categories.find(c => c.id === b);
      const nameA = categoryA?.name || '';
      const nameB = categoryB?.name || '';
      return nameA.localeCompare(nameB);
    });

    // Add unassigned at the end if it exists
    const sorted = [...categoryKeys];
    if (grouped['unassigned']) {
      sorted.push('unassigned');
    }

    return { groups: grouped, sortedKeys: sorted };
  }, [tasks, categories]);

  const getCategoryName = (categoryId) => {
    if (categoryId === 'unassigned') {
      return 'Unassigned';
    }
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  if (sortedKeys.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-text-secondary">No tasks yet</p>
        <p className="text-sm text-text-muted mt-2">
          Click "Add New Task" or press Cmd+N to create your first task
        </p>
      </div>
    );
  }

  return (
    <>
      {sortedKeys.map((categoryId) => {
        const noteKey = categoryId === 'unassigned' ? 'unassigned' : categoryId;
        return (
          <CategorySection
            key={categoryId}
            categoryId={categoryId === 'unassigned' ? null : categoryId}
            categoryName={getCategoryName(categoryId)}
            tasks={groups[categoryId]}
            onEditTask={onEditTask}
            onAddTask={onAddTask}
            notes={categoryNotes[noteKey] || ''}
            onUpdateNotes={updateCategoryNotes}
          />
        );
      })}
    </>
  );
};

export default CategoryView;
