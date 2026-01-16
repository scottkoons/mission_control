import { useState } from 'react';
import { Plus, Trash2, Tag, Edit2, Check, X } from 'lucide-react';
import Header from '../components/layout/Header';
import ConfirmModal from '../components/common/ConfirmModal';
import { useCategories } from '../context/CategoryContext';

const Categories = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory(newCategoryName);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleStartEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) return;

    try {
      await updateCategory(editingId, editingName);
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteClick = (category) => {
    setDeleteConfirm(category);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      await deleteCategory(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Categories" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Categories" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name..."
                className="flex-1 bg-surface-hover border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={18} />
                <span>Add Category</span>
              </button>
            </div>
          </form>

          {/* Categories List */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            {categories.length === 0 ? (
              <div className="p-8 text-center">
                <Tag size={48} className="mx-auto text-text-muted mb-4" />
                <p className="text-text-secondary">No categories yet</p>
                <p className="text-sm text-text-muted mt-1">
                  Add a category above to get started
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <Tag size={18} className="text-primary flex-shrink-0" />

                    {editingId === category.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 bg-surface-hover border border-border rounded px-3 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 rounded text-success hover:bg-success/10 transition-colors"
                          title="Save"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 rounded text-text-muted hover:bg-surface-hover transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-text-primary">{category.name}</span>
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-1.5 rounded text-text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-surface-hover transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Category count */}
          {categories.length > 0 && (
            <p className="text-sm text-text-muted mt-4 text-center">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This will not delete any tasks, but they will no longer be associated with this category.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Categories;
