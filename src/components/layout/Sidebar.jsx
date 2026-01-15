import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckCircle2,
  FolderOpen,
  List,
  ListOrdered,
  Calendar,
  FileText,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useTheme } from '../../context/ThemeContext';
import { storageService } from '../../services/storageService';

const Sidebar = ({ onViewChange, currentView, onExportPDF, onExportCSV, onImportCSV }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getOverdueCount } = useTasks();
  const { currentTheme, cycleTheme, themes } = useTheme();

  const overdueCount = getOverdueCount();

  useEffect(() => {
    const settings = storageService.getSettings();
    setCollapsed(settings.sidebarCollapsed || false);
  }, []);

  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    storageService.saveSettings({ sidebarCollapsed: newCollapsed });
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light-mode':
        return <Sun size={20} />;
      case 'control-center':
        return <Monitor size={20} />;
      default:
        return <Moon size={20} />;
    }
  };

  const NavItem = ({ icon: Icon, label, badge, onClick, isActive, danger }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary/20 text-primary'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
      } ${danger ? 'hover:text-danger' : ''}`}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} className="flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left text-sm font-medium">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute top-0 right-0 bg-danger text-white text-xs w-4 h-4 flex items-center justify-center rounded-full transform translate-x-1/2 -translate-y-1/2">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );

  const SectionHeader = ({ children }) => (
    !collapsed && (
      <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
        {children}
      </div>
    )
  );

  const isOnDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isOnCompleted = location.pathname === '/completed';
  const isOnFileCabinet = location.pathname === '/files';

  return (
    <aside
      className={`bg-surface border-r border-border flex flex-col h-screen transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img
          src="/assets/mission-control-orange-logo.png"
          alt="Mission Control"
          className="w-8 h-8 flex-shrink-0"
        />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-text-primary truncate">Mission Control</h1>
            <p className="text-xs text-text-muted truncate">Colorado Mountain Brewery</p>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded hover:bg-surface-hover text-text-secondary"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Main Navigation */}
        <div className="relative">
          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            badge={overdueCount}
            onClick={() => navigate('/')}
            isActive={isOnDashboard}
          />
        </div>
        <NavItem
          icon={CheckCircle2}
          label="Completed"
          onClick={() => navigate('/completed')}
          isActive={isOnCompleted}
        />
        <NavItem
          icon={FolderOpen}
          label="File Cabinet"
          onClick={() => navigate('/files')}
          isActive={isOnFileCabinet}
        />

        {/* Divider */}
        <div className="border-t border-border my-3" />

        {/* View Section */}
        <SectionHeader>View</SectionHeader>
        <NavItem
          icon={ListOrdered}
          label="Grouped"
          onClick={() => {
            navigate('/');
            onViewChange('grouped');
          }}
          isActive={isOnDashboard && currentView === 'grouped'}
        />
        <NavItem
          icon={List}
          label="Flat"
          onClick={() => {
            navigate('/');
            onViewChange('flat');
          }}
          isActive={isOnDashboard && currentView === 'flat'}
        />
        <NavItem
          icon={Calendar}
          label="Calendar"
          onClick={() => {
            navigate('/');
            onViewChange('calendar');
          }}
          isActive={isOnDashboard && currentView === 'calendar'}
        />

        {/* Divider */}
        <div className="border-t border-border my-3" />

        {/* Export Section */}
        <SectionHeader>Export</SectionHeader>
        <NavItem
          icon={FileText}
          label="PDF - Flat"
          onClick={() => onExportPDF('flat')}
        />
        <NavItem
          icon={FileText}
          label="PDF - Grouped"
          onClick={() => onExportPDF('grouped')}
        />
        <NavItem
          icon={Download}
          label="Export CSV"
          onClick={onExportCSV}
        />
        <NavItem
          icon={Upload}
          label="Import CSV"
          onClick={onImportCSV}
        />
      </nav>

      {/* Footer - Theme Toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={cycleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
          title={`Current: ${themes[currentTheme]?.label || 'Space Program'}`}
        >
          {getThemeIcon()}
          {!collapsed && (
            <span className="text-sm font-medium">{themes[currentTheme]?.label || 'Space Program'}</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
