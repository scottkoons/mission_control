import { useState } from 'react';
import { Building2, Users, Paperclip } from 'lucide-react';

const CompanyCard = ({ company, contactCount, primaryContactName, onClick, onFileDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const logoUrl = company.logo?.storageURL || company.logo?.data;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onFileDrop) {
      onFileDrop(company.id, files);
    }
  };

  return (
    <div
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-surface border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
        isDragOver
          ? 'border-primary border-2 bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Company Name */}
      <div className="flex items-center gap-3 mb-3">
        {logoUrl ? (
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white border border-border">
            <img
              src={logoUrl}
              alt={`${company.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-primary" />
          </div>
        )}
        <h3 className="text-base font-semibold text-text-primary truncate">
          {company.name || 'Unnamed Company'}
        </h3>
      </div>

      {/* Contact Count & Primary Contact */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Users size={14} />
          <span>{contactCount} contact{contactCount !== 1 ? 's' : ''}</span>
        </div>
        {primaryContactName && (
          <span className="text-xs text-secondary truncate max-w-[50%]" title={`Primary: ${primaryContactName}`}>
            {primaryContactName}
          </span>
        )}
      </div>

      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 rounded-xl bg-primary/10 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Paperclip size={20} />
            <span>Drop to attach</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyCard;
