import { useState, useRef } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { parseCSV, generateCSVTemplate, downloadCSV } from '../../utils/csvUtils';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';

const CSVImport = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const { createTask, updateMonthlyNotes } = useTasks();
  const { addToast } = useToast();

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      addToast('Please select a CSV file', { type: 'error' });
      return;
    }

    setFile(selectedFile);

    // Parse and preview
    const content = await selectedFile.text();
    const parsed = parseCSV(content);
    setPreview(parsed);
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    downloadCSV(template, 'tasks-template.csv');
  };

  const handleImport = async () => {
    if (!preview || preview.tasks.length === 0) {
      addToast('No tasks found in the CSV file', { type: 'error' });
      return;
    }

    setImporting(true);

    try {
      // Import tasks
      for (const task of preview.tasks) {
        const newTask = {
          ...task,
          id: uuidv4(),
          attachments: [],
          completedAt: null,
          updatedAt: new Date().toISOString(),
          createdAt: task.createdAt || new Date().toISOString(),
        };
        createTask(newTask);
      }

      // Import monthly notes
      if (preview.monthlyNotes) {
        Object.entries(preview.monthlyNotes).forEach(([key, value]) => {
          updateMonthlyNotes(key, value);
        });
      }

      addToast(`Imported ${preview.tasks.length} task(s) successfully`, { type: 'success' });
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
      addToast('Error importing tasks', { type: 'error' });
    }

    setImporting(false);
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Tasks from CSV" size="md">
      <div className="space-y-4">
        {/* File Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-secondary">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-text-muted mt-1">.csv files</p>
        </div>

        {/* Selected File */}
        {file && (
          <div className="flex items-center gap-3 bg-surface-hover px-4 py-3 rounded-lg">
            <FileText size={20} className="text-primary" />
            <span className="text-sm text-text-primary flex-1">{file.name}</span>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="bg-surface-hover rounded-lg p-4">
            <p className="text-sm font-medium text-text-primary mb-2">Preview:</p>
            <p className="text-sm text-text-secondary">
              {preview.tasks.length} task(s) found
            </p>
            {preview.tasks.length > 0 && (
              <ul className="mt-2 text-xs text-text-muted max-h-32 overflow-y-auto">
                {preview.tasks.slice(0, 5).map((task, i) => (
                  <li key={i} className="truncate">
                    - {task.taskName || 'Untitled'}
                  </li>
                ))}
                {preview.tasks.length > 5 && (
                  <li>...and {preview.tasks.length - 5} more</li>
                )}
              </ul>
            )}
            {Object.keys(preview.monthlyNotes).length > 0 && (
              <p className="text-xs text-text-muted mt-2">
                + {Object.keys(preview.monthlyNotes).length} monthly note(s)
              </p>
            )}
          </div>
        )}

        {/* Download Template */}
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80"
        >
          <Download size={16} />
          Download blank CSV template
        </button>

        {/* Tip */}
        <p className="text-xs text-text-muted">
          Tip: Export your current tasks to see the expected format
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!preview || preview.tasks.length === 0 || importing}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CSVImport;
