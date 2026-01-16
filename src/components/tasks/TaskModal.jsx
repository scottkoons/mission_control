import { useState, useEffect, useRef } from 'react';
import { Upload, X, Copy, Download, FileText, Maximize2, Building2, ChevronDown, User, Mail, Tag, Plus } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FilePreview from '../files/FilePreview';
import PdfThumbnail from '../files/PdfThumbnail';
import CompanyModal from '../contacts/CompanyModal';
import ContactModal from '../contacts/ContactModal';
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
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const fileInputRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const contactDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    setDateError('');
    setShowCompanyDropdown(false);
    setShowContactDropdown(false);
    setShowCategoryDropdown(false);
    if (task) {
      let contactId = task.contactId || null;
      let shouldAutoSaveContact = false;
      if (task.companyId && !task.contactId) {
        const company = companies.find(c => c.id === task.companyId);
        if (company?.primaryContactId) {
          contactId = company.primaryContactId;
          shouldAutoSaveContact = true;
        }
      }

      if (shouldAutoSaveContact && contactId) {
        updateTask(task.id, { ...task, contactId });
      }

      setFormData({
        taskName: task.taskName || '',
        notes: task.notes || '',
        draftDue: formatDateForInput(task.draftDue) || '',
        finalDue: formatDateForInput(task.finalDue) || '',
        repeat: task.repeat || 'none',
        attachments: task.attachments || [],
        companyId: task.companyId || null,
        contactId: contactId,
        categoryId: task.categoryId || null,
      });
    } else {
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
  }, [task, defaultMonth, isOpen, companies]);

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

  useEffect(() => {
    if (!isOpen) return;
    const preventDefaults = (e) => e.preventDefault();
    document.addEventListener('dragenter', preventDefaults);
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('drop', preventDefaults);
    return () => {
      document.removeEventListener('dragenter', preventDefaults);
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const extension = item.type.split('/')[1] || 'png';
            const fileName = `screenshot-${timestamp}.${extension}`;
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

  const validateDates = (draftDue, finalDue) => {
    if (draftDue && finalDue) {
      const draft = new Date(draftDue);
      const final = new Date(finalDue);
      if (final < draft) return 'Final due date cannot be before draft due date';
    }
    return '';
  };

  const getSelectedCompany = () => formData.companyId ? companies.find(c => c.id === formData.companyId) : null;
  const getSelectedContact = () => formData.contactId ? contacts.find(c => c.id === formData.contactId) : null;
  const getSelectedCategory = () => formData.categoryId ? categories.find(c => c.id === formData.categoryId) : null;

  const handleContactSelect = (contact) => {
    if (formData.companyId && contact.companyId !== formData.companyId) {
      const contactCompany = companies.find(c => c.id === contact.companyId);
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      const confirmMessage = `${contact.name} belongs to ${contactCompany?.name || 'a different company'}, not ${selectedCompany?.name || 'the selected company'}. Do you want to assign this contact anyway?`;
      if (window.confirm(confirmMessage)) {
        setFormData(prev => ({ ...prev, contactId: contact.id }));
      }
    } else {
      setFormData(prev => ({ ...prev, contactId: contact.id }));
    }
    setShowContactDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    if (name === 'draftDue' || name === 'finalDue') {
      setDateError(validateDates(newFormData.draftDue, newFormData.finalDue));
    }
  };

  const handleQuickDate = (field, date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const newFormData = { ...formData, [field]: formattedDate };
    setFormData(newFormData);
    setDateError(validateDates(newFormData.draftDue, newFormData.finalDue));
  };

  const processFiles = (files) => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'application/pdf'];
    for (const file of files) {
      if (file.size > maxSize) { alert(`File "${file.name}" exceeds 10MB limit`); continue; }
      if (!allowedTypes.includes(file.type)) { alert(`File type "${file.type}" is not supported`); continue; }
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
        setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, newAttachment] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e) => processFiles(Array.from(e.target.files));
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)); };
  const handleRemoveAttachment = (attachmentId) => setFormData((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.id !== attachmentId) }));

  const handleDownloadAttachment = async (attachment) => {
    const url = attachment.storageURL || attachment.data;
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
        window.open(url, '_blank');
      }
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreviewAttachment = (attachment) => setPreviewFile(attachment);

  const handleEmailAttachment = async (attachment) => {
    const contact = getSelectedContact();
    if (!contact || !contact.email) { alert('No contact email available'); return; }
    await handleDownloadAttachment(attachment);
    setTimeout(() => {
      const subject = encodeURIComponent(`Regarding: ${attachment.name}`);
      const body = encodeURIComponent(`Hi ${contact.name || ''},\n\nPlease see the attached file: ${attachment.name}\n\n(The file has been downloaded to your computer - please attach it to this email)\n\nBest regards`);
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
    if (isEditing) { updateTask(task.id, taskData); } else { createTask(taskData); }
    onClose();
  };

  const handleDuplicate = () => { if (task) { duplicateTask(task.id); onClose(); } };

  const quickDates = getQuickDates();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Add New Task'} size="3xl">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Task Name</label>
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
                <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter task details, requirements, and stakeholders..."
                  rows={3}
                  className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Attachments</label>
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                >
                  <input ref={fileInputRef} type="file" multiple accept=".svg,.png,.jpg,.jpeg,.pdf" onChange={handleFileUpload} className="hidden" />
                  <Upload size={24} className="mx-auto text-text-muted mb-1" />
                  <p className="text-sm text-text-secondary">Click, drag, or paste</p>
                  <p className="text-xs text-text-muted">SVG, PNG, JPG, PDF (10MB max)</p>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {formData.attachments.map((attachment) => {
                      const isImage = attachment.type.startsWith('image/');
                      const isPDF = attachment.type === 'application/pdf';
                      return (
                        <div key={attachment.id} className="relative group bg-surface-hover rounded-lg overflow-hidden border border-border">
                          <div className="aspect-square flex items-center justify-center cursor-pointer" onClick={() => handlePreviewAttachment(attachment)}>
                            {isImage ? (
                              <img src={attachment.storageURL || attachment.data} alt={attachment.name} className="w-full h-full object-cover" />
                            ) : isPDF ? (
                              <PdfThumbnail file={attachment} />
                            ) : (
                              <FileText size={24} className="text-text-muted" />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button type="button" onClick={() => handlePreviewAttachment(attachment)} className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white" title="Preview"><Maximize2 size={12} /></button>
                            <button type="button" onClick={() => handleDownloadAttachment(attachment)} className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white" title="Download"><Download size={12} /></button>
                            {getSelectedContact()?.email && <button type="button" onClick={() => handleEmailAttachment(attachment)} className="p-1.5 rounded bg-white/20 hover:bg-primary/80 text-white" title="Email"><Mail size={12} /></button>}
                            <button type="button" onClick={() => handleRemoveAttachment(attachment.id)} className="p-1.5 rounded bg-white/20 hover:bg-danger/80 text-white" title="Remove"><X size={12} /></button>
                          </div>
                          <div className="px-1.5 py-1 border-t border-border">
                            <p className="text-xs text-text-primary truncate" title={attachment.name}>{attachment.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="w-64 space-y-3 border-l border-border pl-6">
              {/* Company */}
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Company</label>
                <div className="relative" ref={companyDropdownRef}>
                  <button type="button" onClick={() => setShowCompanyDropdown(!showCompanyDropdown)} className="w-full flex items-center justify-between bg-surface-hover border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <div className="flex items-center gap-2 truncate">
                      {getSelectedCompany() ? (
                        <>
                          {getSelectedCompany().logo ? <img src={getSelectedCompany().logo.storageURL || getSelectedCompany().logo.data} alt="" className="w-4 h-4 rounded-full object-cover" /> : <Building2 size={14} className="text-text-muted" />}
                          <span className="text-text-primary truncate">{getSelectedCompany().name}</span>
                        </>
                      ) : (
                        <><Building2 size={14} className="text-text-muted" /><span className="text-text-muted">None</span></>
                      )}
                    </div>
                    <ChevronDown size={14} className={`text-text-muted transition-transform flex-shrink-0 ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showCompanyDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      <button type="button" onClick={() => { setFormData(prev => ({ ...prev, companyId: null, contactId: null })); setShowCompanyDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover ${!formData.companyId ? 'bg-primary/10 text-primary' : 'text-text-secondary'}`}>No company</button>
                      <button type="button" onClick={() => { setShowCompanyDropdown(false); setShowCreateCompanyModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover text-primary"><Plus size={14} />Create company</button>
                      <div className="border-t border-border" />
                      {companies.map((company) => (
                        <button key={company.id} type="button" onClick={() => {
                          let newContactId = company.primaryContactId || (getContactsByCompany(company.id).some(c => c.id === formData.contactId) ? formData.contactId : null);
                          setFormData(prev => ({ ...prev, companyId: company.id, contactId: newContactId }));
                          setShowCompanyDropdown(false);
                        }} className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover ${formData.companyId === company.id ? 'bg-primary/10 text-primary' : 'text-text-primary'}`}>
                          {company.logo ? <img src={company.logo.storageURL || company.logo.data} alt="" className="w-4 h-4 rounded-full object-cover" /> : <Building2 size={14} className="text-text-muted" />}
                          <span className="truncate">{company.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Contact</label>
                <div className="relative" ref={contactDropdownRef}>
                  <button type="button" onClick={() => setShowContactDropdown(!showContactDropdown)} className="w-full flex items-center justify-between bg-surface-hover border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <div className="flex items-center gap-2 truncate">
                      <User size={14} className="text-text-muted flex-shrink-0" />
                      <span className={getSelectedContact() ? 'text-text-primary truncate' : 'text-text-muted'}>{getSelectedContact()?.name || 'None'}</span>
                    </div>
                    <ChevronDown size={14} className={`text-text-muted transition-transform flex-shrink-0 ${showContactDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showContactDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      <button type="button" onClick={() => { setFormData(prev => ({ ...prev, contactId: null })); setShowContactDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover ${!formData.contactId ? 'bg-primary/10 text-primary' : 'text-text-secondary'}`}>No contact</button>
                      <button type="button" onClick={() => { setShowContactDropdown(false); setShowCreateContactModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover text-primary"><Plus size={14} />Create contact</button>
                      <div className="border-t border-border" />
                      {formData.companyId && getContactsByCompany(formData.companyId).length > 0 && (
                        <>
                          <div className="px-3 py-1 text-xs font-semibold text-text-muted uppercase bg-surface-hover">{companies.find(c => c.id === formData.companyId)?.name}</div>
                          {getContactsByCompany(formData.companyId).map((contact) => (
                            <button key={contact.id} type="button" onClick={() => handleContactSelect(contact)} className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover ${formData.contactId === contact.id ? 'bg-primary/10 text-primary' : 'text-text-primary'}`}>
                              <User size={14} className="text-text-muted" /><span className="truncate">{contact.name}</span>
                            </button>
                          ))}
                        </>
                      )}
                      {contacts.filter(c => c.companyId !== formData.companyId).map((contact) => (
                        <button key={contact.id} type="button" onClick={() => handleContactSelect(contact)} className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover ${formData.contactId === contact.id ? 'bg-primary/10 text-primary' : 'text-text-primary'}`}>
                          <User size={14} className="text-text-muted" /><span className="truncate">{contact.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Category</label>
                  <div className="relative" ref={categoryDropdownRef}>
                    <button type="button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="w-full flex items-center justify-between bg-surface-hover border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <div className="flex items-center gap-2 truncate">
                        <Tag size={14} className={getSelectedCategory() ? 'text-primary' : 'text-text-muted'} />
                        <span className={getSelectedCategory() ? 'text-text-primary truncate' : 'text-text-muted'}>{getSelectedCategory()?.name || 'None'}</span>
                      </div>
                      <ChevronDown size={14} className={`text-text-muted transition-transform flex-shrink-0 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        <button type="button" onClick={() => { setFormData(prev => ({ ...prev, categoryId: null })); setShowCategoryDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover ${!formData.categoryId ? 'bg-primary/10 text-primary' : 'text-text-secondary'}`}>No category</button>
                        <div className="border-t border-border" />
                        {categories.map((category) => (
                          <button key={category.id} type="button" onClick={() => { setFormData(prev => ({ ...prev, categoryId: category.id })); setShowCategoryDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover ${formData.categoryId === category.id ? 'bg-primary/10 text-primary' : 'text-text-primary'}`}>
                            <Tag size={14} className="text-primary" /><span className="truncate">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Draft Due</label>
                  <input type="date" name="draftDue" value={formData.draftDue} onChange={handleChange} className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button type="button" onClick={() => handleQuickDate('draftDue', quickDates.tomorrow)} className="text-xs text-secondary hover:text-secondary/80">Tomorrow</button>
                    <button type="button" onClick={() => handleQuickDate('draftDue', quickDates.nextMonday)} className="text-xs text-secondary hover:text-secondary/80">Mon</button>
                    <button type="button" onClick={() => handleQuickDate('draftDue', quickDates.plusOneWeek)} className="text-xs text-secondary hover:text-secondary/80">+1wk</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Final Due</label>
                  <input type="date" name="finalDue" value={formData.finalDue} onChange={handleChange} className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button type="button" onClick={() => handleQuickDate('finalDue', quickDates.tomorrow)} className="text-xs text-secondary hover:text-secondary/80">Tomorrow</button>
                    <button type="button" onClick={() => handleQuickDate('finalDue', quickDates.nextMonday)} className="text-xs text-secondary hover:text-secondary/80">Mon</button>
                    <button type="button" onClick={() => handleQuickDate('finalDue', quickDates.plusOneWeek)} className="text-xs text-secondary hover:text-secondary/80">+1wk</button>
                  </div>
                </div>
              </div>

              {dateError && (
                <div className="flex items-center gap-1.5 text-danger text-xs bg-danger/10 px-2 py-1.5 rounded-lg">
                  <span>⚠</span><span>{dateError}</span>
                </div>
              )}

              {/* Repeat */}
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Repeat</label>
                <select name="repeat" value={formData.repeat} onChange={handleChange} className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="monthly-15th">15th of Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
            {isEditing && <Button type="button" variant="ghost" icon={Copy} onClick={handleDuplicate}>Duplicate Task</Button>}
            <div className={`flex items-center gap-3 ${!isEditing ? 'ml-auto' : ''}`}>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={!!dateError}>{isEditing ? 'Save Changes' : 'Create Task'}</Button>
            </div>
          </div>
        </form>
      </Modal>

      {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} onDownload={handleDownloadAttachment} />}

      <CompanyModal isOpen={showCreateCompanyModal} onClose={() => setShowCreateCompanyModal(false)} onSave={(newCompany) => { setFormData(prev => ({ ...prev, companyId: newCompany.id })); setShowCreateCompanyModal(false); }} />

      <ContactModal isOpen={showCreateContactModal} onClose={() => setShowCreateContactModal(false)} defaultCompanyId={formData.companyId} showCompanySelect={true} onSave={(newContact) => { setFormData(prev => ({ ...prev, contactId: newContact.id })); setShowCreateContactModal(false); }} />
    </>
  );
};

export default TaskModal;
