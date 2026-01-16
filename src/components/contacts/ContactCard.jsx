import { Building2, User } from 'lucide-react';

const ContactCard = ({ contact, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg"
    >
      {/* Company */}
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={16} className="text-primary flex-shrink-0" />
        <span className="text-sm font-semibold text-text-primary truncate">
          {contact.company || 'No Company'}
        </span>
      </div>

      {/* Name */}
      <div className="flex items-center gap-2">
        <User size={16} className="text-text-muted flex-shrink-0" />
        <span className="text-sm text-text-secondary truncate">
          {contact.name || 'No Name'}
        </span>
      </div>

      {/* Title if available */}
      {contact.title && (
        <p className="text-xs text-text-muted mt-2 truncate pl-6">
          {contact.title}
        </p>
      )}
    </div>
  );
};

export default ContactCard;
