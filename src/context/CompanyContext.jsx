import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  subscribeCompanies,
  saveCompany,
  deleteCompanyFromDB,
  uploadCompanyAttachment,
  uploadCompanyLogo,
} from '../services/firebaseService';

const CompanyContext = createContext();

export const useCompanies = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanies must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showDeleteToast, addToast } = useToast();

  // Subscribe to real-time company updates
  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeCompanies(user.uid, (fetchedCompanies) => {
      setCompanies(fetchedCompanies);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to process attachments
  const processAttachments = async (companyId, attachments) => {
    const processedAttachments = [];
    for (const attachment of attachments) {
      if (attachment.storageURL) {
        processedAttachments.push(attachment);
      } else if (attachment.data) {
        try {
          const uploaded = await uploadCompanyAttachment(user.uid, companyId, attachment);
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

  // Helper to process logo
  const processLogo = async (companyId, logo) => {
    if (!logo) return null;
    if (logo.storageURL) return logo;
    if (logo.data) {
      try {
        return await uploadCompanyLogo(user.uid, companyId, logo);
      } catch (error) {
        console.error('Error uploading logo:', error);
        return null;
      }
    }
    return null;
  };

  const createCompany = useCallback(async (companyData) => {
    if (!user) return null;

    const companyId = uuidv4();

    // Process attachments
    const processedAttachments = companyData.attachments?.length > 0
      ? await processAttachments(companyId, companyData.attachments)
      : [];

    // Process logo
    const processedLogo = await processLogo(companyId, companyData.logo);

    const newCompany = {
      id: companyId,
      name: companyData.name || '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      website: companyData.website || '',
      address: companyData.address || '',
      notes: companyData.notes || '',
      attachments: processedAttachments,
      primaryContactId: companyData.primaryContactId || null,
      logo: processedLogo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCompany(user.uid, newCompany);
      addToast('Company created', { type: 'success', duration: 2000 });
      return newCompany;
    } catch (error) {
      console.error('Error creating company:', error);
      addToast('Error creating company', { type: 'error' });
      throw error;
    }
  }, [user, addToast]);

  const updateCompany = useCallback(async (companyId, updates) => {
    if (!user) return;

    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

    // Process attachments if they're being updated
    let processedUpdates = { ...updates };
    if (updates.attachments?.length > 0) {
      processedUpdates.attachments = await processAttachments(companyId, updates.attachments);
    }

    // Process logo if it's being updated
    if (updates.logo !== undefined) {
      processedUpdates.logo = await processLogo(companyId, updates.logo);
    }

    const updatedCompany = {
      ...company,
      ...processedUpdates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCompany(user.uid, updatedCompany);
      addToast('Company updated', { type: 'success', duration: 2000 });
    } catch (error) {
      console.error('Error updating company:', error);
      addToast('Error updating company', { type: 'error' });
      throw error;
    }
  }, [user, companies, addToast]);

  const deleteCompany = useCallback(async (company) => {
    if (!user) return;

    try {
      await deleteCompanyFromDB(user.uid, company.id);

      showDeleteToast(`"${company.name}" deleted`, async () => {
        await saveCompany(user.uid, company);
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      addToast('Error deleting company', { type: 'error' });
    }
  }, [user, showDeleteToast, addToast]);

  const setPrimaryContact = useCallback(async (companyId, contactId) => {
    await updateCompany(companyId, { primaryContactId: contactId });
  }, [updateCompany]);

  const value = {
    companies,
    loading,
    createCompany,
    updateCompany,
    deleteCompany,
    setPrimaryContact,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export default CompanyContext;
