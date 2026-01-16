import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, Trash2, Upload, X, Download, FileText, Maximize2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
import FilePreview from '../files/FilePreview';
import { useContacts } from '../../context/ContactContext';

const ContactModal = ({ isOpen, onClose, contact = null }) => {
  const { createContact, updateContact, deleteContact } = useContacts();
  const isEditing = !!contact;

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    attachments: [],
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        company: contact.company || '',
        title: contact.title || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        notes: contact.notes || '',
        attachments: contact.attachments || [],
      });
    } else {
      setFormData({
        name: '',
        company: '',
        title: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        attachments: [],
      });
    }
  }, [contact, isOpen]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handlePreviewAttachment = (attachment) => {
    setPreviewFile(attachment);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      await updateContact(contact.id, formData);
    } else {
      await createContact(formData);
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
        title={isEditing ? 'Edit Contact' : 'Add New Contact'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Company name"
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

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

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Address
            </label>
            <div className="relative">
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, city, state, zip"
                rows={2}
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              {formData.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(formData.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-2 p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                  title="Open in Google Maps"
                >
                  <MapPin size={18} />
                </a>
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
              placeholder="Additional notes about this contact..."
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
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
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
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-text-muted mt-1">
                SVG, PNG, JPG or PDF (MAX. 10MB)
              </p>
            </div>

            {/* Uploaded files */}
            {formData.attachments.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
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

export default ContactModal;
