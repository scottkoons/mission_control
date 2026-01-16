import { useMemo } from 'react';
import { Plus, Building2 } from 'lucide-react';
import TaskTable from './TaskTable';
import SectionNotes from './SectionNotes';
import { useCompanies } from '../../context/CompanyContext';
import { useTasks } from '../../context/TaskContext';
import { defaultTaskSort } from '../../utils/sortUtils';

const CompanySection = ({ companyId, companyName, companyLogo, tasks, onEditTask, onAddTask, notes, onUpdateNotes }) => {
  const noteKey = companyId || 'unassigned';

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
      {/* Company Header */}
      <div className="bg-surface-hover px-6 py-4 border-b border-border">
        <div className="flex items-center justify-center gap-3">
          {companyLogo ? (
            <img
              src={companyLogo.storageURL || companyLogo.data}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <Building2 size={24} className="text-text-muted" />
          )}
          <h2 className="text-lg font-semibold text-text-primary">
            {companyName}
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
          label={`${companyName} Notes`}
          notes={notes}
          onUpdate={onUpdateNotes}
          placeholder={`Notes for ${companyName}...`}
          rightAction={
            <button
              onClick={() => onAddTask(companyId)}
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

const CompanyView = ({ tasks, onEditTask, onAddTask }) => {
  const { companies } = useCompanies();
  const { companyNotes, updateCompanyNotes } = useTasks();

  // Group tasks by company
  const { groups, sortedKeys } = useMemo(() => {
    const grouped = {};

    tasks.forEach((task) => {
      const key = task.companyId || 'unassigned';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });

    // Sort tasks within each group
    for (const key of Object.keys(grouped)) {
      grouped[key] = defaultTaskSort(grouped[key]);
    }

    // Sort keys: companies first (alphabetically by name), then unassigned at the end
    const companyKeys = Object.keys(grouped).filter(k => k !== 'unassigned');
    companyKeys.sort((a, b) => {
      const companyA = companies.find(c => c.id === a);
      const companyB = companies.find(c => c.id === b);
      const nameA = companyA?.name || '';
      const nameB = companyB?.name || '';
      return nameA.localeCompare(nameB);
    });

    // Add unassigned at the end if it exists
    const sorted = [...companyKeys];
    if (grouped['unassigned']) {
      sorted.push('unassigned');
    }

    return { groups: grouped, sortedKeys: sorted };
  }, [tasks, companies]);

  const getCompanyInfo = (companyId) => {
    if (companyId === 'unassigned') {
      return { name: 'Unassigned', logo: null };
    }
    const company = companies.find(c => c.id === companyId);
    return {
      name: company?.name || 'Unknown Company',
      logo: company?.logo || null,
    };
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
      {sortedKeys.map((companyId) => {
        const { name, logo } = getCompanyInfo(companyId);
        const noteKey = companyId === 'unassigned' ? 'unassigned' : companyId;
        return (
          <CompanySection
            key={companyId}
            companyId={companyId === 'unassigned' ? null : companyId}
            companyName={name}
            companyLogo={logo}
            tasks={groups[companyId]}
            onEditTask={onEditTask}
            onAddTask={onAddTask}
            notes={companyNotes[noteKey] || ''}
            onUpdateNotes={updateCompanyNotes}
          />
        );
      })}
    </>
  );
};

export default CompanyView;
