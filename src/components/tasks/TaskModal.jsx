import { useState, useEffect } from 'react';
import { Upload, X, Copy } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
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

  useEffect(() => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuickDate = (field, date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: format(date, 'yyyy-MM-dd'),
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }

      const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'application/pdf'];
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

  const handleRemoveAttachment = (attachmentId) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== attachmentId),
    }));
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
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".svg,.png,.jpg,.jpeg,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload size={32} className="mx-auto text-text-muted mb-2" />
              <p className="text-sm text-text-secondary">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-text-muted mt-1">
                SVG, PNG, JPG or PDF (MAX. 10MB)
              </p>
            </label>
          </div>

          {/* Uploaded files */}
          {formData.attachments.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {formData.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-surface-hover px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-text-primary truncate max-w-[150px]">
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-text-muted hover:text-danger"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
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
            <Button type="submit" variant="primary">
              {isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
