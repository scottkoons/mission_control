import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  subscribeContacts,
  saveContact,
  deleteContactFromDB,
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

  const createContact = useCallback(async (contactData) => {
    if (!user) return null;

    const newContact = {
      id: uuidv4(),
      name: contactData.name || '',
      company: contactData.company || '',
      title: contactData.title || '',
      email: contactData.email || '',
      phone: contactData.phone || '',
      address: contactData.address || '',
      notes: contactData.notes || '',
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

    const updatedContact = {
      ...contact,
      ...updates,
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
        // Undo - restore the contact
        await saveContact(user.uid, contact);
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      addToast('Error deleting contact', { type: 'error' });
    }
  }, [user, showDeleteToast, addToast]);

  const value = {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
  };

  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  );
};

export default ContactContext;
