import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Trash2, Upload, X, Download, FileText, Maximize2, ChevronDown, Plus, Building2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
import FilePreview from '../files/FilePreview';
import PdfThumbnail from '../files/PdfThumbnail';
import { useContacts } from '../../context/ContactContext';
import { useCompanies } from '../../context/CompanyContext';
import { formatPhoneNumber } from '../../utils/formatUtils';

const ContactModal = ({ isOpen, onClose, contact = null, companyId = null, companyName = '', showCompanySelect = false }) => {
  const { createContact, updateContact, deleteContact } = useContacts();
  const { companies, createCompany } = useCompanies();
  const isEditing = !!contact;

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    notes: '',
    attachments: [],
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        title: contact.title || '',
        email: contact.email || '',
        phone: contact.phone || '',
        notes: contact.notes || '',
        attachments: contact.attachments || [],
      });
      setSelectedCompanyId(contact.companyId || null);
    } else {
      setFormData({
        name: '',
        title: '',
        email: '',
        phone: '',
        notes: '',
        attachments: [],
      });
      setSelectedCompanyId(companyId || null);
    }
    setShowNewCompanyInput(false);
    setNewCompanyName('');
  }, [contact, companyId, isOpen]);

  // Prevent browser default drag behavior
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === 'phone' ? formatPhoneNumber(value) : value;
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const processFiles = (files) => {
    const maxSize = 10 * 1024 * 1024;
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

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files = [];
    for (const item of items) {
      if (item.type.startsWith('image/') || item.type === 'application/pdf') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      processFiles(files);
    }
  };

  const handleRemoveAttachment = (attachmentId) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== attachmentId),
    }));
  };

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
        console.error('Download error:', error);
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

  const handleCreateNewCompany = async () => {
    if (!newCompanyName.trim()) return;

    const newCompany = await createCompany({ name: newCompanyName.trim() });
    if (newCompany) {
      setSelectedCompanyId(newCompany.id);
      setShowNewCompanyInput(false);
      setNewCompanyName('');
      setShowCompanyDropdown(false);
    }
  };

  const getSelectedCompanyName = () => {
    if (!selectedCompanyId) return 'No Company (Unassigned)';
    const company = companies.find(c => c.id === selectedCompanyId);
    return company?.name || 'Unknown Company';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const contactData = {
      ...formData,
      companyId: selectedCompanyId,
    };

    if (isEditing) {
      await updateContact(contact.id, contactData);
    } else {
      await createContact(contactData);
    }

    onClose();
  };

  const handleDelete = async () => {
    await deleteContact(contact);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleEmailClick = (e) => {
    e.preventDefault();
    if (formData.email) {
      window.location.href = `mailto:${formData.email}`;
    }
  };

  const handlePhoneClick = (e) => {
    e.preventDefault();
    if (formData.phone) {
      window.location.href = `tel:${formData.phone}`;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Edit Contact' : 'Add Contact'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Selection */}
          {(showCompanySelect || isEditing) ? (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Company
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="w-full flex items-center justify-between bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-left text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-text-muted" />
                    <span className={selectedCompanyId ? '' : 'text-text-muted'}>
                      {getSelectedCompanyName()}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-text-muted transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCompanyDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Unassigned option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompanyId(null);
                        setShowCompanyDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                        !selectedCompanyId ? 'bg-primary/10 text-primary' : 'text-text-secondary'
                      }`}
                    >
                      <span className="text-sm">No Company (Unassigned)</span>
                    </button>

                    {/* Divider */}
                    {companies.length > 0 && <div className="border-t border-border" />}

                    {/* Existing companies */}
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => {
                          setSelectedCompanyId(company.id);
                          setShowCompanyDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                          selectedCompanyId === company.id ? 'bg-primary/10 text-primary' : 'text-text-primary'
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

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* Add new company */}
                    {showNewCompanyInput ? (
                      <div className="p-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            placeholder="Company name"
                            className="flex-1 bg-surface-hover border border-border rounded px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateNewCompany();
                              } else if (e.key === 'Escape') {
                                setShowNewCompanyInput(false);
                                setNewCompanyName('');
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleCreateNewCompany}
                            disabled={!newCompanyName.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNewCompanyInput(true)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Plus size={16} />
                        <span className="text-sm font-medium">Add New Company</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : companyName ? (
            <div className="bg-surface-hover rounded-lg px-4 py-2 text-sm text-text-secondary">
              Adding contact to: <span className="font-medium text-text-primary">{companyName}</span>
            </div>
          ) : null}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contact name"
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Job title"
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 pr-12 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {formData.email && (
                <button
                  type="button"
                  onClick={handleEmailClick}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                  title="Send email"
                >
                  <Mail size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Phone
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 pr-12 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {formData.phone && (
                <button
                  type="button"
                  onClick={handlePhoneClick}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                  title="Call"
                >
                  <Phone size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows={3}
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Attachments
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPaste={handlePaste}
              onClick={() => fileInputRef.current?.click()}
              tabIndex={0}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
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
              <Upload size={24} className="mx-auto text-text-muted mb-2" />
              <p className="text-sm text-text-secondary">
                Drop, paste, or click to upload
              </p>
            </div>

            {formData.attachments.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {formData.attachments.map((attachment) => {
                  const isImage = attachment.type.startsWith('image/');
                  const isPDF = attachment.type === 'application/pdf';
                  return (
                    <div
                      key={attachment.id}
                      className="relative group aspect-square bg-surface-hover rounded-lg overflow-hidden border border-border"
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
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <FileText size={24} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewFile(attachment)}
                          className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Maximize2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="p-1.5 rounded bg-white/20 hover:bg-danger/80 text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
                icon={Trash2}
                onClick={() => setShowDeleteConfirm(true)}
                className="text-danger hover:bg-danger/10"
              >
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {isEditing ? 'Save Changes' : 'Add Contact'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contact?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* File Preview */}
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

export default ContactModal;
