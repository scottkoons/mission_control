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

const Sidebar = ({ onViewChange, currentView, onExportPDF, onExportCSV, onImportCSV, onNavClick }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getOverdueCount, getDueSoonCount } = useTasks();
  const { currentTheme, cycleTheme, themes } = useTheme();

  const overdueCount = getOverdueCount();
  const dueSoonCount = getDueSoonCount();

  useEffect(() => {
    const settings = storageService.getSettings();
    setCollapsed(settings.sidebarCollapsed || false);
  }, []);

  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    storageService.saveSettings({ sidebarCollapsed: newCollapsed });
  };

  const handleNavigate = (path) => {
    navigate(path);
    onNavClick?.();
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

  const NavItem = ({ icon: Icon, label, overdueBadge, dueSoonBadge, onClick, isActive, danger }) => (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary/20 text-primary'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
      } ${danger ? 'hover:text-danger' : ''}`}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} className="flex-shrink-0" />
      {/* Always show on mobile, conditionally on desktop */}
      <span className={`flex-1 text-left text-sm font-medium ${collapsed ? 'md:hidden' : ''}`}>{label}</span>
      <div className={`flex items-center gap-1 ${collapsed ? 'md:hidden' : ''}`}>
        {dueSoonBadge?.count > 0 && (
          <span
            className="bg-warning text-black text-xs px-2 py-0.5 rounded-full"
            title={dueSoonBadge.tooltip}
          >
            {dueSoonBadge.count}
          </span>
        )}
        {overdueBadge?.count > 0 && (
          <span
            className="bg-danger text-white text-xs px-2 py-0.5 rounded-full"
            title={overdueBadge.tooltip}
          >
            {overdueBadge.count}
          </span>
        )}
      </div>
      {/* Collapsed badges - only on desktop when collapsed, centered above icon */}
      {collapsed && (overdueBadge?.count > 0 || dueSoonBadge?.count > 0) && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex gap-0.5">
          {dueSoonBadge?.count > 0 && (
            <span
              className="bg-warning text-black text-xs w-4 h-4 flex items-center justify-center rounded-full"
              title={dueSoonBadge.tooltip}
            >
              {dueSoonBadge.count > 9 ? '9+' : dueSoonBadge.count}
            </span>
          )}
          {overdueBadge?.count > 0 && (
            <span
              className="bg-danger text-white text-xs w-4 h-4 flex items-center justify-center rounded-full"
              title={overdueBadge.tooltip}
            >
              {overdueBadge.count > 9 ? '9+' : overdueBadge.count}
            </span>
          )}
        </div>
      )}
    </button>
  );

  const SectionHeader = ({ children }) => (
    <div className={`px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider ${collapsed ? 'md:hidden' : ''}`}>
      {children}
    </div>
  );

  const isOnDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isOnCompleted = location.pathname === '/completed';
  const isOnFileCabinet = location.pathname === '/files';

  return (
    <aside
      className={`bg-surface border-r border-border flex flex-col h-screen transition-all duration-300 w-64 ${
        collapsed ? 'md:w-16' : 'md:w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className={`flex items-center justify-center flex-1 ${collapsed ? 'md:w-8 md:flex-none' : ''}`}>
          {/* Full logo - hidden on desktop when collapsed */}
          <img
            src="/assets/mission-control-orange-logo.png"
            alt="Mission Control"
            className={`object-contain h-12 max-w-full ${collapsed ? 'md:hidden' : ''}`}
          />
          {/* Icon only - shown on desktop when collapsed */}
          <img
            src="/assets/mission-control-orange-favicon.png"
            alt="Mission Control"
            className={`object-contain w-8 h-8 hidden ${collapsed ? 'md:block' : ''}`}
          />
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1 rounded hover:bg-surface-hover text-text-secondary flex-shrink-0 hidden md:block"
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
            overdueBadge={{
              count: overdueCount,
              tooltip: `${overdueCount} date${overdueCount === 1 ? '' : 's'} overdue`
            }}
            dueSoonBadge={{
              count: dueSoonCount,
              tooltip: `${dueSoonCount} date${dueSoonCount === 1 ? '' : 's'} due soon`
            }}
            onClick={() => handleNavigate('/')}
            isActive={isOnDashboard}
          />
        </div>
        <NavItem
          icon={CheckCircle2}
          label="Completed"
          onClick={() => handleNavigate('/completed')}
          isActive={isOnCompleted}
        />
        <NavItem
          icon={FolderOpen}
          label="File Cabinet"
          onClick={() => handleNavigate('/files')}
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
            handleNavigate('/');
            onViewChange('grouped');
          }}
          isActive={isOnDashboard && currentView === 'grouped'}
        />
        <NavItem
          icon={List}
          label="Flat"
          onClick={() => {
            handleNavigate('/');
            onViewChange('flat');
          }}
          isActive={isOnDashboard && currentView === 'flat'}
        />
        <NavItem
          icon={Calendar}
          label="Calendar"
          onClick={() => {
            handleNavigate('/');
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
          <span className={`text-sm font-medium ${collapsed ? 'md:hidden' : ''}`}>
            {themes[currentTheme]?.label || 'Space Program'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
