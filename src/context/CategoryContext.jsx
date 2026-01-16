import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  subscribeCategories,
  saveCategory,
  deleteCategoryFromDB,
} from '../services/firebaseService';

const CategoryContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showDeleteToast, addToast } = useToast();

  // Subscribe to real-time category updates
  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeCategories(user.uid, (fetchedCategories) => {
      setCategories(fetchedCategories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createCategory = useCallback(async (name) => {
    if (!user) return null;

    const newCategory = {
      id: uuidv4(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await saveCategory(user.uid, newCategory);
      addToast('Category created', { type: 'success', duration: 2000 });
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      addToast('Error creating category', { type: 'error' });
      throw error;
    }
  }, [user, addToast]);

  const updateCategory = useCallback(async (categoryId, name) => {
    if (!user) return;

    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const updatedCategory = {
      ...category,
      name: name.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCategory(user.uid, updatedCategory);
      addToast('Category updated', { type: 'success', duration: 2000 });
    } catch (error) {
      console.error('Error updating category:', error);
      addToast('Error updating category', { type: 'error' });
      throw error;
    }
  }, [user, categories, addToast]);

  const deleteCategory = useCallback(async (category) => {
    if (!user) return;

    try {
      await deleteCategoryFromDB(user.uid, category.id);

      showDeleteToast(`"${category.name}" deleted`, async () => {
        await saveCategory(user.uid, category);
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      addToast('Error deleting category', { type: 'error' });
    }
  }, [user, showDeleteToast, addToast]);

  const getCategoryById = useCallback((categoryId) => {
    return categories.find((c) => c.id === categoryId);
  }, [categories]);

  const value = {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryContext;
