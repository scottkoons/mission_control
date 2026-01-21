import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Completed from './pages/Completed';
import FileCabinet from './pages/FileCabinet';
import Contacts from './pages/Contacts';
import Categories from './pages/Categories';
import TodoList from './pages/TodoList';
import Login from './pages/Login';
import ToastContainer from './components/common/Toast';
import CSVImport from './components/export/CSVImport';
import PDFExportModal from './components/export/PDFExportModal';
import { useTasks } from './context/TaskContext';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import { exportTasksToCSV, downloadCSV } from './utils/csvUtils';
import { exportPDFFlat, exportPDFGrouped, exportPDFByCompany, exportPDFByCategory, exportPDFCalendar } from './utils/pdfUtils';
import { useCompanies } from './context/CompanyContext';
import { useCategories } from './context/CategoryContext';

function App() {
  const [currentView, setCurrentView] = useState('grouped');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [pdfExportType, setPdfExportType] = useState(null);
  const { tasks, monthlyNotes, generalNotes, companyNotes, categoryNotes } = useTasks();
  const { addToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { companies } = useCompanies();
  const { categories } = useCategories();

  useEffect(() => {
    // Load settings from localStorage (still used for UI preferences)
    const savedSettings = localStorage.getItem('mission-control-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setCurrentView(settings.defaultView || 'grouped');
    }
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
    const savedSettings = localStorage.getItem('mission-control-settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    localStorage.setItem('mission-control-settings', JSON.stringify({ ...settings, defaultView: view }));
  };

  const handleExportPDF = (type) => {
    setPdfExportType(type);
    setShowPDFExportModal(true);
  };

  const handlePDFExportWithOrientation = (type, orientation) => {
    try {
      const savedSettings = localStorage.getItem('mission-control-settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      const dateMode = settings.groupedDateMode || 'draft';
      const sortMode = settings.sortMode || 'date';

      if (type === 'flat') {
        exportPDFFlat(tasks, generalNotes['flat-view'] || '', orientation, sortMode);
        addToast('PDF (Flat) exported successfully', { type: 'success', duration: 3000 });
      } else if (type === 'grouped') {
        exportPDFGrouped(tasks, monthlyNotes, dateMode, orientation, sortMode);
        addToast('PDF (Grouped) exported successfully', { type: 'success', duration: 3000 });
      } else if (type === 'company') {
        exportPDFByCompany(tasks, companies, companyNotes, orientation);
        addToast('PDF (By Company) exported successfully', { type: 'success', duration: 3000 });
      } else if (type === 'category') {
        exportPDFByCategory(tasks, categories, categoryNotes, orientation);
        addToast('PDF (By Category) exported successfully', { type: 'success', duration: 3000 });
      } else if (type === 'calendar') {
        exportPDFCalendar(tasks, 'all', orientation);
        addToast('PDF (Calendar) exported successfully', { type: 'success', duration: 3000 });
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

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    );
  }

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
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/todos" element={<TodoList />} />
        </Routes>
      </Layout>
      <ToastContainer />
      <CSVImport
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
      <PDFExportModal
        isOpen={showPDFExportModal}
        onClose={() => setShowPDFExportModal(false)}
        onExport={handlePDFExportWithOrientation}
        exportType={pdfExportType}
      />
    </>
  );
}

export default App;
