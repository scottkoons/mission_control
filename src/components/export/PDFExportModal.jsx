import { FileText, FileImage } from 'lucide-react';
import Modal from '../common/Modal';

const PDFExportModal = ({ isOpen, onClose, onExport, exportType }) => {
  const getExportTypeLabel = () => {
    switch (exportType) {
      case 'flat':
        return 'Flat List';
      case 'grouped':
        return 'Grouped by Month';
      case 'company':
        return 'By Company';
      case 'category':
        return 'By Category';
      case 'calendar':
        return 'Calendar';
      default:
        return 'Tasks';
    }
  };

  const handleExport = (orientation) => {
    onExport(exportType, orientation);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export PDF">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Export {getExportTypeLabel()} as PDF
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleExport('portrait')}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-surface-hover transition-colors"
          >
            <div className="w-12 h-16 border-2 border-current rounded flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div className="text-center">
              <div className="font-medium text-text-primary">Portrait</div>
              <div className="text-xs text-text-muted mt-1">Task, Draft Date, Final Date</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('landscape')}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-surface-hover transition-colors"
          >
            <div className="w-16 h-12 border-2 border-current rounded flex items-center justify-center">
              <FileImage size={24} />
            </div>
            <div className="text-center">
              <div className="font-medium text-text-primary">Landscape</div>
              <div className="text-xs text-text-muted mt-1">Task, Notes, Draft Date, Final Date</div>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PDFExportModal;
