import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTasks } from '../../context/TaskContext';

const Layout = ({ children, currentView, onViewChange, onExportPDF, onExportCSV, onImportCSV }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getOverdueCount, getDueSoonCount } = useTasks();

  const overdueCount = getOverdueCount();
  const dueSoonCount = getDueSoonCount();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-40 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <img
          src="/assets/mission-control-orange-logo.png"
          alt="Mission Control"
          className="h-8 object-contain"
        />
        <div className="flex items-center gap-1">
          {dueSoonCount > 0 && (
            <span className="bg-warning text-black text-xs px-2 py-0.5 rounded-full">
              {dueSoonCount}
            </span>
          )}
          {overdueCount > 0 && (
            <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full">
              {overdueCount}
            </span>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:transform-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => {
            onViewChange(view);
            handleNavClick();
          }}
          onExportPDF={(type) => {
            onExportPDF(type);
            handleNavClick();
          }}
          onExportCSV={() => {
            onExportCSV();
            handleNavClick();
          }}
          onImportCSV={() => {
            onImportCSV();
            handleNavClick();
          }}
          onNavClick={handleNavClick}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
