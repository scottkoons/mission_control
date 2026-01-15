import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Completed from './pages/Completed';
import FileCabinet from './pages/FileCabinet';
import ToastContainer from './components/common/Toast';
import { storageService } from './services/storageService';

function App() {
  const [currentView, setCurrentView] = useState('grouped');
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    const settings = storageService.getSettings();
    setCurrentView(settings.defaultView || 'grouped');
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
    storageService.saveSettings({ defaultView: view });
  };

  const handleExportPDF = (type) => {
    // Will be implemented in Phase 7
    console.log('Export PDF:', type);
  };

  const handleExportCSV = () => {
    // Will be implemented in Phase 7
    console.log('Export CSV');
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
    </>
  );
}

export default App;
