import FileCard from './FileCard';

const FileGrid = ({ files, onPreview, onDownload, onDelete }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-text-secondary">No files uploaded yet</p>
        <p className="text-sm text-text-muted mt-2">
          Click "Upload Files" to add files to your cabinet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default FileGrid;
