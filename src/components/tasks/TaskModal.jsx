import { useState, useEffect, useRef } from 'react';
import { Upload, X, Copy, Download, FileText, Maximize2, Building2, ChevronDown, User, Mail, Tag } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FilePreview from '../files/FilePreview';
import PdfThumbnail from '../files/PdfThumbnail';
import { useTasks } from '../../context/TaskContext';
import { useCompanies } from '../../context/CompanyContext';
import { useContacts } from '../../context/ContactContext';
import { useCategories } from '../../context/CategoryContext';
import { formatDateForInput, getQuickDates } from '../../utils/dateUtils';
import { format } from 'date-fns';

const TaskModal = ({ isOpen, onClose, task = null, defaultMonth = null, focusAttachments = false }) => {
  const { createTask, updateTask, duplicateTask } = useTasks();
  const { companies } = useCompanies();
  const { contacts, getContactsByCompany } = useContacts();
  const { categories } = useCategories();
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    taskName: '',
    notes: '',
    draftDue: '',
    finalDue: '',
    repeat: 'none',
    attachments: [],
    companyId: null,
    contactId: null,
    categoryId: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [dateError, setDateError] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const contactDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    setDateError(''); // Clear any previous error
    setShowCompanyDropdown(false);
    setShowContactDropdown(false);
    setShowCategoryDropdown(false);
    if (task) {
      setFormData({
        taskName: task.taskName || '',
        notes: task.notes || '',
        draftDue: formatDateForInput(task.draftDue) || '',
        finalDue: formatDateForInput(task.finalDue) || '',
        repeat: task.repeat || 'none',
        attachments: task.attachments || [],
        companyId: task.companyId || null,
        contactId: task.contactId || null,
        categoryId: task.categoryId || null,
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
        companyId: null,
        contactId: null,
        categoryId: null,
      });
    }
  }, [task, defaultMonth, isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) {
        setShowCompanyDropdown(false);
      }
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target)) {
        setShowContactDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getSelectedCompany = () => {
    if (!formData.companyId) return null;
    return companies.find(c => c.id === formData.companyId);
  };

  const getSelectedContact = () => {
    if (!formData.contactId) return null;
    return contacts.find(c => c.id === formData.contactId);
  };

  // Get available contacts - if a company is selected, show only that company's contacts
  // Otherwise show all contacts
  const getAvailableContacts = () => {
    if (formData.companyId) {
      return getContactsByCompany(formData.companyId);
    }
    return contacts;
  };

  const getSelectedCategory = () => {
    if (!formData.categoryId) return null;
    return categories.find(c => c.id === formData.categoryId);
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

  const handleDownloadAttachment = async (attachment) => {
    const url = attachment.storageURL || attachment.data;

    // For Firebase Storage URLs, fetch as blob to force download
    if (attachment.storageURL) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Download error:', error);
        // Fallback to opening in new tab
        window.open(url, '_blank');
      }
    } else {
      // For data URLs, direct download works
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreviewAttachment = (attachment) => {
    setPreviewFile(attachment);
  };

  const handleEmailAttachment = async (attachment) => {
    const contact = getSelectedContact();
    if (!contact || !contact.email) {
      alert('No contact email available');
      return;
    }

    // Download the file first so user can attach it
    await handleDownloadAttachment(attachment);

    // Small delay to ensure download starts before opening email
    setTimeout(() => {
      const subject = encodeURIComponent(`Regarding: ${attachment.name}`);
      const body = encodeURIComponent(
        `Hi ${contact.name || ''},\n\n` +
        `Please see the attached file: ${attachment.name}\n\n` +
        `(The file has been downloaded to your computer - please attach it to this email)\n\n` +
        `Best regards`
      );

      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    }, 500);
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
      companyId: formData.companyId || null,
      contactId: formData.contactId || null,
      categoryId: formData.categoryId || null,
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

        {/* Company */}
        {companies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Company (optional)
            </label>
            <div className="relative" ref={companyDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="w-full flex items-center justify-between bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex items-center gap-2">
                  {getSelectedCompany() ? (
                    <>
                      {getSelectedCompany().logo ? (
                        <img
                          src={getSelectedCompany().logo.storageURL || getSelectedCompany().logo.data}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 size={16} className="text-text-muted" />
                      )}
                      <span className="text-text-primary">{getSelectedCompany().name}</span>
                    </>
                  ) : (
                    <>
                      <Building2 size={16} className="text-text-muted" />
                      <span className="text-text-muted">No company linked</span>
                    </>
                  )}
                </div>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCompanyDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {/* No company option */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, companyId: null, contactId: null }));
                      setShowCompanyDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                      !formData.companyId ? 'bg-primary/10 text-primary' : 'text-text-secondary'
                    }`}
                  >
                    <span className="text-sm">No company linked</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Company list */}
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => {
                        // Auto-assign primary contact if company has one, otherwise clear contact
                        let newContactId = null;
                        if (company.primaryContactId) {
                          // Use the company's primary contact
                          newContactId = company.primaryContactId;
                        } else {
                          // Check if current contact is part of new company
                          const newCompanyContacts = getContactsByCompany(company.id);
                          const contactInNewCompany = newCompanyContacts.some(c => c.id === formData.contactId);
                          newContactId = contactInNewCompany ? formData.contactId : null;
                        }
                        setFormData(prev => ({
                          ...prev,
                          companyId: company.id,
                          contactId: newContactId,
                        }));
                        setShowCompanyDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                        formData.companyId === company.id ? 'bg-primary/10 text-primary' : 'text-text-primary'
                      }`}
                    >
                      {company.logo ? (
                        <img
                          src={company.logo.storageURL || company.logo.data}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 size={16} className="text-text-muted" />
                      )}
                      <span className="text-sm">{company.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        {contacts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Contact (optional)
            </label>
            <div className="relative" ref={contactDropdownRef}>
              <button
                type="button"
                onClick={() => setShowContactDropdown(!showContactDropdown)}
                className="w-full flex items-center justify-between bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex items-center gap-2">
                  {getSelectedContact() ? (
                    <>
                      <User size={16} className="text-text-muted" />
                      <span className="text-text-primary">{getSelectedContact().name}</span>
                      {getSelectedContact().email && (
                        <span className="text-text-muted text-sm">({getSelectedContact().email})</span>
                      )}
                    </>
                  ) : (
                    <>
                      <User size={16} className="text-text-muted" />
                      <span className="text-text-muted">No contact linked</span>
                    </>
                  )}
                </div>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${showContactDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showContactDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {/* No contact option */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, contactId: null }));
                      setShowContactDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                      !formData.contactId ? 'bg-primary/10 text-primary' : 'text-text-secondary'
                    }`}
                  >
                    <span className="text-sm">No contact linked</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Contact list */}
                  {getAvailableContacts().length > 0 ? (
                    getAvailableContacts().map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, contactId: contact.id }));
                          setShowContactDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                          formData.contactId === contact.id ? 'bg-primary/10 text-primary' : 'text-text-primary'
                        }`}
                      >
                        <User size={16} className="text-text-muted" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{contact.name}</span>
                          {contact.email && (
                            <span className="text-xs text-text-muted ml-2">({contact.email})</span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2.5 text-sm text-text-muted">
                      {formData.companyId ? 'No contacts for this company' : 'No contacts available'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Category (optional)
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full flex items-center justify-between bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex items-center gap-2">
                  {getSelectedCategory() ? (
                    <>
                      <Tag size={16} className="text-primary" />
                      <span className="text-text-primary">{getSelectedCategory().name}</span>
                    </>
                  ) : (
                    <>
                      <Tag size={16} className="text-text-muted" />
                      <span className="text-text-muted">No category</span>
                    </>
                  )}
                </div>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {/* No category option */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, categoryId: null }));
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                      !formData.categoryId ? 'bg-primary/10 text-primary' : 'text-text-secondary'
                    }`}
                  >
                    <span className="text-sm">No category</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Category list */}
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, categoryId: category.id }));
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                        formData.categoryId === category.id ? 'bg-primary/10 text-primary' : 'text-text-primary'
                      }`}
                    >
                      <Tag size={16} className="text-primary" />
                      <span className="text-sm">{category.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                          src={attachment.storageURL || attachment.data}
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                        />
                      ) : isPDF ? (
                        <PdfThumbnail file={attachment} />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-text-muted">
                          <FileText size={32} />
                          <span className="text-xs mt-1">File</span>
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
                      {getSelectedContact()?.email && (
                        <button
                          type="button"
                          onClick={() => handleEmailAttachment(attachment)}
                          className="p-2 rounded-lg bg-white/20 hover:bg-primary/80 text-white transition-colors"
                          title={`Email to ${getSelectedContact().name}`}
                        >
                          <Mail size={16} />
                        </button>
                      )}
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
