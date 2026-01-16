import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
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
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      });
    }
  }, [contact, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        size="md"
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
    </>
  );
};

export default ContactModal;
