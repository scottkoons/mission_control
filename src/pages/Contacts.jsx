import { useState } from 'react';
import { UserPlus, Search } from 'lucide-react';
import ContactCard from '../components/contacts/ContactCard';
import ContactModal from '../components/contacts/ContactModal';
import { useContacts } from '../context/ContactContext';

const Contacts = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { contacts, loading } = useContacts();

  const handleAddContact = () => {
    setSelectedContact(null);
    setShowModal(true);
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContact(null);
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (contact.name || '').toLowerCase().includes(query) ||
      (contact.company || '').toLowerCase().includes(query) ||
      (contact.email || '').toLowerCase().includes(query) ||
      (contact.title || '').toLowerCase().includes(query)
    );
  });

  // Group contacts by company
  const groupedContacts = filteredContacts.reduce((groups, contact) => {
    const company = contact.company || 'No Company';
    if (!groups[company]) {
      groups[company] = [];
    }
    groups[company].push(contact);
    return groups;
  }, {});

  // Sort companies alphabetically
  const sortedCompanies = Object.keys(groupedContacts).sort((a, b) => {
    if (a === 'No Company') return 1;
    if (b === 'No Company') return -1;
    return a.localeCompare(b);
  });

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
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-hover border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Add Contact Button */}
          <button
            onClick={handleAddContact}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Add Contact</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-text-secondary text-center py-12">
            <p>Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted mb-4">
              {searchQuery ? 'No contacts match your search.' : 'No contacts yet.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddContact}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Add your first contact
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {sortedCompanies.map((company) => (
              <div key={company}>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                  {company}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupedContacts[company].map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onClick={() => handleEditContact(contact)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showModal}
        onClose={handleCloseModal}
        contact={selectedContact}
      />
    </div>
  );
};

export default Contacts;
