import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  subscribeContacts,
  saveContact,
  deleteContactFromDB,
  uploadContactAttachment,
} from '../services/firebaseService';

const ContactContext = createContext();

export const useContacts = () => {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  return context;
};

export const ContactProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showDeleteToast, addToast } = useToast();

  // Subscribe to real-time contact updates
  useEffect(() => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeContacts(user.uid, (fetchedContacts) => {
      setContacts(fetchedContacts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to process attachments
  const processAttachments = async (contactId, attachments) => {
    const processedAttachments = [];
    for (const attachment of attachments) {
      if (attachment.storageURL) {
        processedAttachments.push(attachment);
      } else if (attachment.data) {
        try {
          const uploaded = await uploadContactAttachment(user.uid, contactId, attachment);
          processedAttachments.push(uploaded);
        } catch (error) {
          console.error('Error uploading attachment:', error);
          processedAttachments.push({
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
            uploadedAt: attachment.uploadedAt,
            error: 'Failed to upload',
          });
        }
      }
    }
    return processedAttachments;
  };

  const createContact = useCallback(async (contactData) => {
    if (!user) return null;

    const contactId = uuidv4();

    // Process attachments
    const processedAttachments = contactData.attachments?.length > 0
      ? await processAttachments(contactId, contactData.attachments)
      : [];

    const newContact = {
      id: contactId,
      companyId: contactData.companyId || null, // Link to company
      name: contactData.name || '',
      title: contactData.title || '',
      email: contactData.email || '',
      phone: contactData.phone || '',
      notes: contactData.notes || '',
      attachments: processedAttachments,
      isPrimary: contactData.isPrimary || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveContact(user.uid, newContact);
      addToast('Contact created', { type: 'success', duration: 2000 });
      return newContact;
    } catch (error) {
      console.error('Error creating contact:', error);
      addToast('Error creating contact', { type: 'error' });
      throw error;
    }
  }, [user, addToast]);

  const updateContact = useCallback(async (contactId, updates) => {
    if (!user) return;

    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    // Process attachments if they're being updated
    let processedUpdates = { ...updates };
    if (updates.attachments?.length > 0) {
      processedUpdates.attachments = await processAttachments(contactId, updates.attachments);
    }

    const updatedContact = {
      ...contact,
      ...processedUpdates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveContact(user.uid, updatedContact);
      addToast('Contact updated', { type: 'success', duration: 2000 });
    } catch (error) {
      console.error('Error updating contact:', error);
      addToast('Error updating contact', { type: 'error' });
      throw error;
    }
  }, [user, contacts, addToast]);

  const deleteContact = useCallback(async (contact) => {
    if (!user) return;

    try {
      await deleteContactFromDB(user.uid, contact.id);

      showDeleteToast(`"${contact.name}" deleted`, async () => {
        await saveContact(user.uid, contact);
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      addToast('Error deleting contact', { type: 'error' });
    }
  }, [user, showDeleteToast, addToast]);

  // Get contacts for a specific company
  const getContactsByCompany = useCallback((companyId) => {
    return contacts.filter((c) => c.companyId === companyId);
  }, [contacts]);

  // Delete all contacts for a company
  const deleteContactsByCompany = useCallback(async (companyId) => {
    const companyContacts = contacts.filter((c) => c.companyId === companyId);
    for (const contact of companyContacts) {
      await deleteContactFromDB(user.uid, contact.id);
    }
  }, [user, contacts]);

  const value = {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    getContactsByCompany,
    deleteContactsByCompany,
  };

  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  );
};

export default ContactContext;
