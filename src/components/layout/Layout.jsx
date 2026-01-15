import { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, currentView, onViewChange, onExportPDF, onExportCSV, onImportCSV }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        onExportPDF={onExportPDF}
        onExportCSV={onExportCSV}
        onImportCSV={onImportCSV}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default Layout;
