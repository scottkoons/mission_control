import { useState, useEffect, useRef } from 'react';
import { Upload, X, Copy, Download, FileText, Maximize2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FilePreview from '../files/FilePreview';
import { useTasks } from '../../context/TaskContext';
import { formatDateForInput, getQuickDates } from '../../utils/dateUtils';
import { format } from 'date-fns';

const TaskModal = ({ isOpen, onClose, task = null, defaultMonth = null, focusAttachments = false }) => {
  const { createTask, updateTask, duplicateTask } = useTasks();
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    taskName: '',
    notes: '',
    draftDue: '',
    finalDue: '',
    repeat: 'none',
    attachments: [],
  });
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [dateError, setDateError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setDateError(''); // Clear any previous error
    if (task) {
      setFormData({
        taskName: task.taskName || '',
        notes: task.notes || '',
        draftDue: formatDateForInput(task.draftDue) || '',
        finalDue: formatDateForInput(task.finalDue) || '',
        repeat: task.repeat || 'none',
        attachments: task.attachments || [],
      });
    } else {
      // Set default dates based on defaultMonth if provided
      let defaultDraftDue = '';
      if (defaultMonth && defaultMonth !== 'unscheduled') {
        const [year, month] = defaultMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 15);
        defaultDraftDue = formatDateForInput(date);
      }

      setFormData({
        taskName: '',
        notes: '',
        draftDue: defaultDraftDue,
        finalDue: '',
        repeat: 'none',
        attachments: [],
      });
    }
  }, [task, defaultMonth, isOpen]);

  // Prevent browser default drag behavior when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const preventDefaults = (e) => {
      e.preventDefault();
    };

    document.addEventListener('dragenter', preventDefaults);
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('drop', preventDefaults);

    return () => {
      document.removeEventListener('dragenter', preventDefaults);
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, [isOpen]);

  // Handle clipboard paste for screenshots
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      // Don't intercept paste if user is typing in a text field
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            // Generate a filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const extension = item.type.split('/')[1] || 'png';
            const fileName = `screenshot-${timestamp}.${extension}`;

            // Create a new File with a proper name
            const file = new File([blob], fileName, { type: item.type });
            processFiles([file]);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Validate that final date is not before draft date
  const validateDates = (draftDue, finalDue) => {
    if (draftDue && finalDue) {
      const draft = new Date(draftDue);
      const final = new Date(finalDue);
      if (final < draft) {
        return 'Final due date cannot be before draft due date';
      }
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Validate dates when either date field changes
    if (name === 'draftDue' || name === 'finalDue') {
      const error = validateDates(newFormData.draftDue, newFormData.finalDue);
      setDateError(error);
    }
  };

  const handleQuickDate = (field, date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const newFormData = { ...formData, [field]: formattedDate };
    setFormData(newFormData);

    // Validate dates
    const error = validateDates(newFormData.draftDue, newFormData.finalDue);
    setDateError(error);
  };

  const processFiles = (files) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'application/pdf'];

    for (const file of files) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`File type "${file.type}" is not supported`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target.result,
          uploadedAt: new Date().toISOString(),
        };

        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleRemoveAttachment = (attachmentId) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== attachmentId),
    }));
  };

  const handleDownloadAttachment = (attachment) => {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewAttachment = (attachment) => {
    setPreviewFile(attachment);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const taskData = {
      taskName: formData.taskName,
      notes: formData.notes,
      draftDue: formData.draftDue || null,
      finalDue: formData.finalDue || null,
      repeat: formData.repeat,
      attachments: formData.attachments,
    };

    if (isEditing) {
      updateTask(task.id, taskData);
    } else {
      createTask(taskData);
    }

    onClose();
  };

  const handleDuplicate = () => {
    if (task) {
      duplicateTask(task.id);
      onClose();
    }
  };

  const quickDates = getQuickDates();

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Add New Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Task Name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Task Name
          </label>
          <input
            type="text"
            name="taskName"
            value={formData.taskName}
            onChange={handleChange}
            placeholder="e.g., Q4 Social Media Campaign"
            className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Description
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter task details, requirements, and stakeholders..."
            rows={4}
            className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          {/* Draft Due */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Draft Due Date
            </label>
            <input
              type="date"
              name="draftDue"
              value={formData.draftDue}
              onChange={handleChange}
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickDate('draftDue', quickDates.tomorrow)}
                className="text-xs text-secondary hover:text-secondary/80"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('draftDue', quickDates.nextMonday)}
                className="text-xs text-secondary hover:text-secondary/80"
              >
                Next Monday
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('draftDue', quickDates.endOfMonth)}
                className="text-xs text-secondary hover:text-secondary/80"
              >
                End of Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('draftDue', quickDates.plusOneWeek)}
                className="text-xs text-secondary hover:text-secondary/80"
              >
                +1 Week
              </button>
            </div>
          </div>

          {/* Final Due */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Final Due/Publish Date
            </label>
            <input
              type="date"
              name="finalDue"
              value={formData.finalDue}
              onChange={handleChange}
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickDate('finalDue', quickDates.tomorrow)}
                className="text-xs text-secondary hover:text-secondary/80"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('finalDue', quickDates.nextMonday)}
                className="text-xs text-secondary hover:text-secondary/80"
              >
                Next Monday
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('finalDue', quickDates.endOfMonth)}
                className="text-xs text-secondary hover:text-secondary/80"
              >
                End of Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('finalDue', quickDates.plusOneWeek)}
                className="text-xs text-secondary hover:text-secondary/80"
              >
                +1 Week
              </button>
            </div>
          </div>
        </div>

        {/* Date validation error */}
        {dateError && (
          <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 px-3 py-2 rounded-lg">
            <span>⚠</span>
            <span>{dateError}</span>
          </div>
        )}

        {/* Repeat */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Repeat
          </label>
          <select
            name="repeat"
            value={formData.repeat}
            onChange={handleChange}
            className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="monthly-15th">15th of Month</option>
          </select>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Upload Attachments
          </label>
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".svg,.png,.jpg,.jpeg,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload size={32} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary">
              Click to upload, drag and drop, or paste a screenshot
            </p>
            <p className="text-xs text-text-muted mt-1">
              SVG, PNG, JPG or PDF (MAX. 10MB)
            </p>
          </div>

          {/* Uploaded files */}
          {formData.attachments.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {formData.attachments.map((attachment) => {
                const isImage = attachment.type.startsWith('image/');
                const isPDF = attachment.type === 'application/pdf';

                return (
                  <div
                    key={attachment.id}
                    className="relative group bg-surface-hover rounded-lg overflow-hidden border border-border"
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-square flex items-center justify-center cursor-pointer"
                      onClick={() => handlePreviewAttachment(attachment)}
                    >
                      {isImage ? (
                        <img
                          src={attachment.data}
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-text-muted">
                          <FileText size={32} />
                          <span className="text-xs mt-1">
                            {isPDF ? 'PDF' : 'File'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePreviewAttachment(attachment)}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                        title="Preview"
                      >
                        <Maximize2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(attachment)}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="p-2 rounded-lg bg-white/20 hover:bg-danger/80 text-white transition-colors"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Filename */}
                    <div className="px-2 py-1.5 border-t border-border">
                      <p className="text-xs text-text-primary truncate" title={attachment.name}>
                        {attachment.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              icon={Copy}
              onClick={handleDuplicate}
            >
              Duplicate Task
            </Button>
          )}
          <div className={`flex items-center gap-3 ${!isEditing ? 'ml-auto' : ''}`}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!!dateError}>
              {isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>

    {/* File Preview Modal */}
    {previewFile && (
      <FilePreview
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadAttachment}
      />
    )}
  </>
  );
};

export default TaskModal;
