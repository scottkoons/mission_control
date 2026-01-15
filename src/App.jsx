import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Completed from './pages/Completed';
import FileCabinet from './pages/FileCabinet';
import ToastContainer from './components/common/Toast';
import CSVImport from './components/export/CSVImport';
import { storageService } from './services/storageService';
import { useTasks } from './context/TaskContext';
import { useToast } from './context/ToastContext';
import { exportTasksToCSV, downloadCSV } from './utils/csvUtils';
import { exportPDFFlat, exportPDFGrouped } from './utils/pdfUtils';

function App() {
  const [currentView, setCurrentView] = useState('grouped');
  const [showImportModal, setShowImportModal] = useState(false);
  const { tasks, monthlyNotes } = useTasks();
  const { addToast } = useToast();

  useEffect(() => {
    const settings = storageService.getSettings();
    setCurrentView(settings.defaultView || 'grouped');
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
    storageService.saveSettings({ defaultView: view });
  };

  const handleExportPDF = (type) => {
    try {
      const settings = storageService.getSettings();
      const dateMode = settings.groupedDateMode || 'draft';

      if (type === 'flat') {
        exportPDFFlat(tasks);
        addToast('PDF (Flat) exported successfully', { type: 'success', duration: 3000 });
      } else if (type === 'grouped') {
        exportPDFGrouped(tasks, monthlyNotes, dateMode);
        addToast('PDF (Grouped) exported successfully', { type: 'success', duration: 3000 });
      }
    } catch (error) {
      console.error('PDF export error:', error);
      addToast('Error exporting PDF', { type: 'error' });
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportTasksToCSV(tasks, monthlyNotes);
      const filename = `mission-control-tasks-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);
      addToast('CSV exported successfully', { type: 'success', duration: 3000 });
    } catch (error) {
      console.error('CSV export error:', error);
      addToast('Error exporting CSV', { type: 'error' });
    }
  };

  const handleImportCSV = () => {
    setShowImportModal(true);
  };

  return (
    <>
      <Layout
        currentView={currentView}
        onViewChange={handleViewChange}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
      >
        <Routes>
          <Route
            path="/"
            element={<Dashboard currentView={currentView} onViewChange={handleViewChange} />}
          />
          <Route
            path="/dashboard"
            element={<Dashboard currentView={currentView} onViewChange={handleViewChange} />}
          />
          <Route path="/completed" element={<Completed />} />
          <Route path="/files" element={<FileCabinet />} />
        </Routes>
      </Layout>
      <ToastContainer />
      <CSVImport
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </>
  );
}

export default App;
