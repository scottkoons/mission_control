import { useDroppable } from '@dnd-kit/core';
import FolderCard from './FolderCard';

const DroppableFolderCard = ({ folder, ...props }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folder },
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all ${isOver ? 'ring-2 ring-primary scale-105' : ''}`}
    >
      <FolderCard folder={folder} {...props} />
    </div>
  );
};

export default DroppableFolderCard;
