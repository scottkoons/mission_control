import { useState, useEffect, useRef } from 'react';
import {
  Phone, Mail, Globe, MapPin, Trash2, Upload, X, Download,
  FileText, Maximize2, UserPlus, Star, Edit2, Building2, ImagePlus, Plus, User
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
import FilePreview from '../files/FilePreview';
import PdfThumbnail from '../files/PdfThumbnail';
import { useCompanies } from '../../context/CompanyContext';
import { useContacts } from '../../context/ContactContext';
import { formatPhoneNumber } from '../../utils/formatUtils';

const CompanyModal = ({ isOpen, onClose, company = null, onEditContact, onAddContact }) => {
  const { createCompany, updateCompany, deleteCompany } = useCompanies();
  const { getContactsByCompany, updateContact, deleteContactsByCompany, createContact } = useContacts();
  const isEditing = !!company;

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    notes: '',
    attachments: [],
    primaryContactId: null,
    logo: null,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [pendingContacts, setPendingContacts] = useState([]);
  const [newContactForm, setNewContactForm] = useState({ name: '', title: '', email: '', phone: '' });
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const contacts = company ? getContactsByCompany(company.id) : [];

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        address: company.address || '',
        notes: company.notes || '',
        attachments: company.attachments || [],
        primaryContactId: company.primaryContactId || null,
        logo: company.logo || null,
      });
      setIsEditMode(false);
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        notes: '',
        attachments: [],
        primaryContactId: null,
        logo: null,
      });
      setIsEditMode(true);
      setPendingContacts([]);
      setNewContactForm({ name: '', title: '', email: '', phone: '' });
      setShowAddContactForm(false);
    }
  }, [company, isOpen]);

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

  const processLogoFile = (file) => {
    if (!file) return;

    const maxSize = 2 * 1024 * 1024; // 2MB for logos
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];

    if (file.size > maxSize) {
      alert('Logo must be under 2MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Logo must be SVG, PNG, JPG, or WebP');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        logo: {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target.result,
          uploadedAt: new Date().toISOString(),
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    processLogoFile(file);
  };

  const handleLogoDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLogoDragging(true);
  };

  const handleLogoDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLogoDragging(false);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLogoDragging(false);
    const file = e.dataTransfer.files?.[0];
    processLogoFile(file);
  };

  const handleLogoPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processLogoFile(file);
        }
        break;
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: null }));
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

  // Pending contact handlers
  const handleNewContactChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === 'phone' ? formatPhoneNumber(value) : value;
    setNewContactForm((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleAddPendingContact = () => {
    if (!newContactForm.name.trim()) return;

    setPendingContacts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...newContactForm,
      },
    ]);
    setNewContactForm({ name: '', title: '', email: '', phone: '' });
    setShowAddContactForm(false);
  };

  const handleRemovePendingContact = (contactId) => {
    setPendingContacts((prev) => prev.filter((c) => c.id !== contactId));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      await updateCompany(company.id, formData);
      setIsEditMode(false);
    } else {
      // Create the company first
      const newCompany = await createCompany(formData);

      // Create any pending contacts with the new company ID
      if (newCompany && pendingContacts.length > 0) {
        for (const contact of pendingContacts) {
          await createContact({
            companyId: newCompany.id,
            name: contact.name,
            title: contact.title,
            email: contact.email,
            phone: contact.phone,
          });
        }
      }

      onClose();
    }
  };

  const handleDelete = async () => {
    // Delete all contacts for this company first
    await deleteContactsByCompany(company.id);
    await deleteCompany(company);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleSetPrimary = async (contactId) => {
    setFormData((prev) => ({ ...prev, primaryContactId: contactId }));
    if (company) {
      await updateCompany(company.id, { primaryContactId: contactId });
    }
  };

  const handleEmailClick = () => {
    if (formData.email) {
      window.location.href = `mailto:${formData.email}`;
    }
  };

  const handlePhoneClick = () => {
    if (formData.phone) {
      window.location.href = `tel:${formData.phone}`;
    }
  };

  const handleWebsiteClick = () => {
    if (formData.website) {
      let url = formData.website;
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  };

  // View mode content
  const renderViewMode = () => (
    <div className="space-y-6">
      {/* Logo */}
      {formData.logo && (
        <div className="flex justify-center">
          <img
            src={formData.logo.storageURL || formData.logo.data}
            alt={`${formData.name} logo`}
            className="w-24 h-24 object-cover rounded-full border border-border bg-white"
          />
        </div>
      )}

      {/* Company Info */}
      <div className="space-y-3">
        {formData.phone && (
          <button
            onClick={handlePhoneClick}
            className="flex items-center gap-3 text-text-secondary hover:text-primary transition-colors w-full text-left"
          >
            <Phone size={18} className="flex-shrink-0" />
            <span>{formData.phone}</span>
          </button>
        )}
        {formData.email && (
          <button
            onClick={handleEmailClick}
            className="flex items-center gap-3 text-text-secondary hover:text-primary transition-colors w-full text-left"
          >
            <Mail size={18} className="flex-shrink-0" />
            <span>{formData.email}</span>
          </button>
        )}
        {formData.website && (
          <button
            onClick={handleWebsiteClick}
            className="flex items-center gap-3 text-text-secondary hover:text-primary transition-colors w-full text-left"
          >
            <Globe size={18} className="flex-shrink-0" />
            <span>{formData.website}</span>
          </button>
        )}
        {formData.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(formData.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 text-text-secondary hover:text-primary transition-colors"
          >
            <MapPin size={18} className="flex-shrink-0 mt-0.5" />
            <span className="whitespace-pre-line">{formData.address}</span>
          </a>
        )}
      </div>

      {/* Notes */}
      {formData.notes && (
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-sm text-text-secondary whitespace-pre-line">{formData.notes}</p>
        </div>
      )}

      {/* Attachments */}
      {formData.attachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">Attachments</h4>
          <div className="grid grid-cols-3 gap-2">
            {formData.attachments.map((attachment) => {
              const isImage = attachment.type.startsWith('image/');
              const isPDF = attachment.type === 'application/pdf';
              return (
                <div
                  key={attachment.id}
                  onClick={() => setPreviewFile(attachment)}
                  className="aspect-square bg-surface-hover rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary/50"
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contacts Section */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-text-primary">
            Contacts ({contacts.length})
          </h4>
          <button
            onClick={() => onAddContact(company.id)}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
          >
            <UserPlus size={16} />
            <span>Add</span>
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            No contacts yet
          </p>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-3 bg-surface-hover rounded-lg hover:bg-border/50 cursor-pointer transition-colors"
                onClick={() => onEditContact(contact)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {contact.name}
                    </span>
                    {formData.primaryContactId === contact.id && (
                      <Star size={14} className="text-warning fill-warning flex-shrink-0" />
                    )}
                  </div>
                  {contact.title && (
                    <p className="text-xs text-text-muted truncate">{contact.title}</p>
                  )}
                </div>
                {formData.primaryContactId !== contact.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(contact.id);
                    }}
                    className="p-1.5 rounded text-text-muted hover:text-warning hover:bg-warning/10 transition-colors"
                    title="Set as primary contact"
                  >
                    <Star size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          icon={Trash2}
          onClick={() => setShowDeleteConfirm(true)}
          className="text-danger hover:bg-danger/10"
        >
          Delete
        </Button>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={Edit2}
            onClick={() => setIsEditMode(true)}
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );

  // Edit mode content
  const renderEditMode = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Company Logo
        </label>
        <div className="flex items-center gap-4">
          {formData.logo ? (
            <div className="relative group">
              <img
                src={formData.logo.storageURL || formData.logo.data}
                alt="Company logo"
                className="w-16 h-16 object-cover rounded-full border border-border bg-white"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-1 -right-1 p-1 rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => logoInputRef.current?.click()}
              onDragOver={handleLogoDragOver}
              onDragLeave={handleLogoDragLeave}
              onDrop={handleLogoDrop}
              onPaste={handleLogoPaste}
              tabIndex={0}
              className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                isLogoDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-surface-hover'
              }`}
            >
              <ImagePlus size={24} className="text-text-muted" />
            </div>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <div className="text-sm text-text-muted">
            <p>Drop, paste, or click to upload</p>
            <p className="text-xs">SVG, PNG, JPG, WebP (max 2MB)</p>
          </div>
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Company Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Company name"
          className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(555) 123-4567"
          className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="info@company.com"
          className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Website */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Website
        </label>
        <input
          type="text"
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="www.company.com"
          className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Address
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Street address, city, state, zip"
          rows={2}
          className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
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

      {/* Contacts Section (only when creating new company) */}
      {!isEditing && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-primary">
              Contacts ({pendingContacts.length})
            </label>
            {!showAddContactForm && (
              <button
                type="button"
                onClick={() => setShowAddContactForm(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
              >
                <Plus size={16} />
                <span>Add Contact</span>
              </button>
            )}
          </div>

          {/* Pending contacts list */}
          {pendingContacts.length > 0 && (
            <div className="space-y-2 mb-3">
              {pendingContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 bg-surface-hover rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {contact.name}
                    </p>
                    {contact.title && (
                      <p className="text-xs text-text-muted truncate">{contact.title}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingContact(contact.id)}
                    className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add contact form */}
          {showAddContactForm && (
            <div className="bg-surface-hover rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="name"
                  value={newContactForm.name}
                  onChange={handleNewContactChange}
                  placeholder="Name *"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  name="title"
                  value={newContactForm.title}
                  onChange={handleNewContactChange}
                  placeholder="Title"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  name="email"
                  value={newContactForm.email}
                  onChange={handleNewContactChange}
                  placeholder="Email"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="tel"
                  name="phone"
                  value={newContactForm.phone}
                  onChange={handleNewContactChange}
                  placeholder="Phone"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddContactForm(false);
                    setNewContactForm({ name: '', title: '', email: '', phone: '' });
                  }}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPendingContact}
                  disabled={!newContactForm.name.trim()}
                  className="px-3 py-1.5 text-sm bg-secondary text-white rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Contact
                </button>
              </div>
            </div>
          )}

          {pendingContacts.length === 0 && !showAddContactForm && (
            <p className="text-sm text-text-muted text-center py-3 bg-surface-hover rounded-lg">
              No contacts added yet
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (isEditing) {
              setIsEditMode(false);
              // Reset form data
              setFormData({
                name: company.name || '',
                phone: company.phone || '',
                email: company.email || '',
                website: company.website || '',
                address: company.address || '',
                notes: company.notes || '',
                attachments: company.attachments || [],
                primaryContactId: company.primaryContactId || null,
                logo: company.logo || null,
              });
            } else {
              onClose();
            }
          }}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {isEditing ? 'Save Changes' : 'Add Company'}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? (isEditMode ? 'Edit Company' : formData.name) : 'Add New Company'}
        size="lg"
      >
        {isEditing && !isEditMode ? renderViewMode() : renderEditMode()}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Company"
        message={`Are you sure you want to delete "${company?.name}" and all its contacts? This action cannot be undone.`}
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

export default CompanyModal;
