import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import FileCard from './FileCard';

const DraggableFileCard = ({ file, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `file-${file.id}`,
    data: { type: 'file', file },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <FileCard file={file} {...props} />
    </div>
  );
};

export default DraggableFileCard;
