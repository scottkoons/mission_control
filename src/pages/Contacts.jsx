import { useState, useMemo, useCallback } from 'react';
import { Building2, Search, Download, UserPlus, Users } from 'lucide-react';
import CompanyCard from '../components/contacts/CompanyCard';
import CompanyModal from '../components/contacts/CompanyModal';
import ContactModal from '../components/contacts/ContactModal';
import { useCompanies } from '../context/CompanyContext';
import { useContacts } from '../context/ContactContext';

const Contacts = () => {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStandaloneContactModal, setShowStandaloneContactModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [addContactToCompanyId, setAddContactToCompanyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { companies, loading: companiesLoading, updateCompany } = useCompanies();
  const { contacts, loading: contactsLoading, getContactsByCompany } = useContacts();

  const loading = companiesLoading || contactsLoading;

  // Get primary contact name for a company
  const getPrimaryContactName = (company) => {
    if (!company.primaryContactId) return null;
    const contact = contacts.find((c) => c.id === company.primaryContactId);
    return contact?.name || null;
  };

  // Get unassigned contacts (no companyId)
  const unassignedContacts = useMemo(() => {
    return contacts.filter((c) => !c.companyId);
  }, [contacts]);

  // Filter unassigned contacts by search
  const filteredUnassignedContacts = useMemo(() => {
    if (!searchQuery) return unassignedContacts;

    const query = searchQuery.toLowerCase();
    return unassignedContacts.filter((contact) =>
      (contact.name || '').toLowerCase().includes(query) ||
      (contact.email || '').toLowerCase().includes(query) ||
      (contact.phone || '').toLowerCase().includes(query) ||
      (contact.title || '').toLowerCase().includes(query) ||
      (contact.notes || '').toLowerCase().includes(query)
    );
  }, [unassignedContacts, searchQuery]);

  // Filter companies and contacts by search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;

    const query = searchQuery.toLowerCase();

    return companies.filter((company) => {
      // Check company fields
      const companyMatch =
        (company.name || '').toLowerCase().includes(query) ||
        (company.email || '').toLowerCase().includes(query) ||
        (company.phone || '').toLowerCase().includes(query) ||
        (company.website || '').toLowerCase().includes(query) ||
        (company.address || '').toLowerCase().includes(query) ||
        (company.notes || '').toLowerCase().includes(query);

      if (companyMatch) return true;

      // Check if any contact in this company matches
      const companyContacts = getContactsByCompany(company.id);
      return companyContacts.some((contact) =>
        (contact.name || '').toLowerCase().includes(query) ||
        (contact.email || '').toLowerCase().includes(query) ||
        (contact.phone || '').toLowerCase().includes(query) ||
        (contact.title || '').toLowerCase().includes(query) ||
        (contact.notes || '').toLowerCase().includes(query)
      );
    });
  }, [companies, contacts, searchQuery, getContactsByCompany]);

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setShowCompanyModal(true);
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const handleCloseCompanyModal = () => {
    setShowCompanyModal(false);
    setSelectedCompany(null);
  };

  const handleAddContact = (companyId) => {
    setAddContactToCompanyId(companyId);
    setSelectedContact(null);
    setShowContactModal(true);
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setAddContactToCompanyId(null);
    setShowContactModal(true);
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setSelectedContact(null);
    setAddContactToCompanyId(null);
  };

  // Standalone add contact (with company selection)
  const handleAddStandaloneContact = () => {
    setSelectedContact(null);
    setShowStandaloneContactModal(true);
  };

  const handleCloseStandaloneContactModal = () => {
    setShowStandaloneContactModal(false);
    setSelectedContact(null);
  };

  // Edit contact from unassigned list
  const handleEditUnassignedContact = (contact) => {
    setSelectedContact(contact);
    setShowStandaloneContactModal(true);
  };

  // Get company name for adding contact
  const getCompanyNameForContact = () => {
    if (addContactToCompanyId) {
      const company = companies.find((c) => c.id === addContactToCompanyId);
      return company?.name || '';
    }
    return '';
  };

  // Export contacts to CSV
  const handleExportCSV = useCallback(() => {
    // CSV header
    const headers = [
      'Company Name',
      'Company Phone',
      'Company Email',
      'Company Website',
      'Company Address',
      'Company Notes',
      'Contact Name',
      'Contact Title',
      'Contact Email',
      'Contact Phone',
      'Contact Notes',
      'Is Primary Contact',
    ];

    // Helper to escape CSV fields
    const escapeCSV = (value) => {
      if (!value) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV rows
    const rows = [];

    companies.forEach((company) => {
      const companyContacts = getContactsByCompany(company.id);

      if (companyContacts.length === 0) {
        // Company with no contacts
        rows.push([
          escapeCSV(company.name),
          escapeCSV(company.phone),
          escapeCSV(company.email),
          escapeCSV(company.website),
          escapeCSV(company.address),
          escapeCSV(company.notes),
          '', '', '', '', '', '',
        ].join(','));
      } else {
        // One row per contact
        companyContacts.forEach((contact) => {
          rows.push([
            escapeCSV(company.name),
            escapeCSV(company.phone),
            escapeCSV(company.email),
            escapeCSV(company.website),
            escapeCSV(company.address),
            escapeCSV(company.notes),
            escapeCSV(contact.name),
            escapeCSV(contact.title),
            escapeCSV(contact.email),
            escapeCSV(contact.phone),
            escapeCSV(contact.notes),
            company.primaryContactId === contact.id ? 'Yes' : 'No',
          ].join(','));
        });
      }
    });

    // Add unassigned contacts
    unassignedContacts.forEach((contact) => {
      rows.push([
        '(Unassigned)',
        '', '', '', '', '',
        escapeCSV(contact.name),
        escapeCSV(contact.title),
        escapeCSV(contact.email),
        escapeCSV(contact.phone),
        escapeCSV(contact.notes),
        'No',
      ].join(','));
    });

    // Combine header and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [companies, unassignedContacts, getContactsByCompany]);

  // Handle file drop on company card
  const handleFileDrop = useCallback(async (companyId, files) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'application/pdf'];

    const newAttachments = [];

    for (const file of files) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`File type "${file.type}" is not supported`);
        continue;
      }

      // Read file as data URL
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (newAttachments.length > 0) {
      const updatedAttachments = [...(company.attachments || []), ...newAttachments];
      await updateCompany(companyId, { attachments: updatedAttachments });
    }
  }, [companies, updateCompany]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-text-primary hidden md:block">Contacts</h1>

          {/* Search */}
          <div className="relative flex-1 md:flex-none md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search companies & contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-hover border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Export CSV Button */}
            {(companies.length > 0 || contacts.length > 0) && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-surface-hover hover:bg-border text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border"
                title="Export to CSV"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {/* Add Contact Button */}
            <button
              onClick={handleAddStandaloneContact}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Add Contact</span>
            </button>

            {/* Add Company Button */}
            <button
              onClick={handleAddCompany}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Building2 size={18} />
              <span className="hidden sm:inline">Add Company</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-text-secondary text-center py-12">
            <p>Loading...</p>
          </div>
        ) : filteredCompanies.length === 0 && filteredUnassignedContacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted mb-4">
              {searchQuery ? 'No companies or contacts match your search.' : 'No companies or contacts yet.'}
            </p>
            {!searchQuery && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleAddCompany}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Add your first company
                </button>
                <span className="text-text-muted">or</span>
                <button
                  onClick={handleAddStandaloneContact}
                  className="text-secondary hover:text-secondary/80 text-sm font-medium"
                >
                  Add a contact
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Company Cards */}
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                contactCount={getContactsByCompany(company.id).length}
                primaryContactName={getPrimaryContactName(company)}
                onClick={() => handleEditCompany(company)}
                onFileDrop={handleFileDrop}
              />
            ))}

            {/* Unassigned Contacts Card */}
            {filteredUnassignedContacts.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-text-muted/20 flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-text-muted" />
                  </div>
                  <h3 className="text-base font-semibold text-text-primary">
                    Unassigned Contacts
                  </h3>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredUnassignedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleEditUnassignedContact(contact)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {contact.name}
                        </p>
                        {contact.title && (
                          <p className="text-xs text-text-muted truncate">{contact.title}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-muted">
                    {filteredUnassignedContacts.length} contact{filteredUnassignedContacts.length !== 1 ? 's' : ''} without a company
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Company Modal */}
      <CompanyModal
        isOpen={showCompanyModal}
        onClose={handleCloseCompanyModal}
        company={selectedCompany}
        onEditContact={handleEditContact}
        onAddContact={handleAddContact}
      />

      {/* Contact Modal (from company) */}
      <ContactModal
        isOpen={showContactModal}
        onClose={handleCloseContactModal}
        contact={selectedContact}
        companyId={addContactToCompanyId}
        companyName={getCompanyNameForContact()}
      />

      {/* Standalone Contact Modal (with company selection) */}
      <ContactModal
        isOpen={showStandaloneContactModal}
        onClose={handleCloseStandaloneContactModal}
        contact={selectedContact}
        showCompanySelect={true}
      />
    </div>
  );
};

export default Contacts;
