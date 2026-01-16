import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
  getBlob,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Helper to get user-specific collection path
const getUserCollection = (userId, collectionName) => {
  return collection(db, 'users', userId, collectionName);
};

const getUserDoc = (userId, collectionName, docId) => {
  return doc(db, 'users', userId, collectionName, docId);
};

// Tasks
export const fetchTasks = async (userId) => {
  const tasksCol = getUserCollection(userId, 'tasks');
  const q = query(tasksCol, orderBy('sortOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const saveTask = async (userId, task) => {
  const taskDoc = getUserDoc(userId, 'tasks', task.id);
  await setDoc(taskDoc, task);
};

export const saveTasks = async (userId, tasks) => {
  const batch = writeBatch(db);
  tasks.forEach((task) => {
    const taskDoc = getUserDoc(userId, 'tasks', task.id);
    batch.set(taskDoc, task);
  });
  await batch.commit();
};

export const deleteTaskFromDB = async (userId, taskId) => {
  const taskDoc = getUserDoc(userId, 'tasks', taskId);
  await deleteDoc(taskDoc);
};

// Subscribe to real-time task updates
export const subscribeTasks = (userId, callback) => {
  const tasksCol = getUserCollection(userId, 'tasks');
  // Don't use orderBy - it requires a composite index
  // Sort in memory instead
  return onSnapshot(
    tasksCol,
    (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Sort by sortOrder in memory
      tasks.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      callback(tasks);
    },
    (error) => {
      console.error('Error subscribing to tasks:', error);
      callback([]);
    }
  );
};

// Monthly Notes
export const fetchMonthlyNotes = async (userId) => {
  const notesCol = getUserCollection(userId, 'monthlyNotes');
  const snapshot = await getDocs(notesCol);
  const notes = {};
  snapshot.docs.forEach((doc) => {
    notes[doc.id] = doc.data().content;
  });
  return notes;
};

export const saveMonthlyNote = async (userId, monthKey, content) => {
  const noteDoc = getUserDoc(userId, 'monthlyNotes', monthKey);
  await setDoc(noteDoc, { content });
};

// Subscribe to real-time monthly notes updates
export const subscribeMonthlyNotes = (userId, callback) => {
  const notesCol = getUserCollection(userId, 'monthlyNotes');
  return onSnapshot(
    notesCol,
    (snapshot) => {
      const notes = {};
      snapshot.docs.forEach((doc) => {
        notes[doc.id] = doc.data().content;
      });
      callback(notes);
    },
    (error) => {
      console.error('Error subscribing to monthly notes:', error);
      callback({});
    }
  );
};

// Company Notes
export const subscribeCompanyNotes = (userId, callback) => {
  const notesCol = getUserCollection(userId, 'companyNotes');
  return onSnapshot(
    notesCol,
    (snapshot) => {
      const notes = {};
      snapshot.docs.forEach((doc) => {
        notes[doc.id] = doc.data().content;
      });
      callback(notes);
    },
    (error) => {
      console.error('Error subscribing to company notes:', error);
      callback({});
    }
  );
};

export const saveCompanyNote = async (userId, companyId, content) => {
  const noteDoc = getUserDoc(userId, 'companyNotes', companyId);
  await setDoc(noteDoc, { content });
};

// Category Notes
export const subscribeCategoryNotes = (userId, callback) => {
  const notesCol = getUserCollection(userId, 'categoryNotes');
  return onSnapshot(
    notesCol,
    (snapshot) => {
      const notes = {};
      snapshot.docs.forEach((doc) => {
        notes[doc.id] = doc.data().content;
      });
      callback(notes);
    },
    (error) => {
      console.error('Error subscribing to category notes:', error);
      callback({});
    }
  );
};

export const saveCategoryNote = async (userId, categoryId, content) => {
  const noteDoc = getUserDoc(userId, 'categoryNotes', categoryId);
  await setDoc(noteDoc, { content });
};

// General Notes (for flat view)
export const subscribeGeneralNotes = (userId, callback) => {
  const notesCol = getUserCollection(userId, 'generalNotes');
  return onSnapshot(
    notesCol,
    (snapshot) => {
      const notes = {};
      snapshot.docs.forEach((doc) => {
        notes[doc.id] = doc.data().content;
      });
      callback(notes);
    },
    (error) => {
      console.error('Error subscribing to general notes:', error);
      callback({});
    }
  );
};

export const saveGeneralNote = async (userId, noteKey, content) => {
  const noteDoc = getUserDoc(userId, 'generalNotes', noteKey);
  await setDoc(noteDoc, { content });
};

// Settings
export const fetchSettings = async (userId) => {
  const settingsDoc = getUserDoc(userId, 'settings', 'preferences');
  const snapshot = await getDocs(collection(db, 'users', userId, 'settings'));
  if (snapshot.empty) return {};
  const doc = snapshot.docs.find((d) => d.id === 'preferences');
  return doc ? doc.data() : {};
};

export const saveSettings = async (userId, settings) => {
  const settingsDoc = getUserDoc(userId, 'settings', 'preferences');
  await setDoc(settingsDoc, settings, { merge: true });
};

// Files (File Cabinet)
export const fetchFiles = async (userId) => {
  const filesCol = getUserCollection(userId, 'files');
  const snapshot = await getDocs(filesCol);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const saveFile = async (userId, fileData) => {
  // Upload file data to Firebase Storage
  const storageRef = ref(storage, `users/${userId}/files/${fileData.id}`);
  await uploadString(storageRef, fileData.data, 'data_url');
  const downloadURL = await getDownloadURL(storageRef);

  // Save metadata to Firestore
  const fileDoc = getUserDoc(userId, 'files', fileData.id);
  const metadata = {
    id: fileData.id,
    name: fileData.name,
    type: fileData.type,
    size: fileData.size,
    uploadedAt: fileData.uploadedAt,
    storageURL: downloadURL,
  };
  await setDoc(fileDoc, metadata);
  return { ...metadata, data: downloadURL };
};

export const deleteFileFromDB = async (userId, fileId) => {
  // Delete from Storage
  try {
    const storageRef = ref(storage, `users/${userId}/files/${fileId}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
  }

  // Delete metadata from Firestore
  const fileDoc = getUserDoc(userId, 'files', fileId);
  await deleteDoc(fileDoc);
};

// Subscribe to real-time file updates
export const subscribeFiles = (userId, callback) => {
  const filesCol = getUserCollection(userId, 'files');
  return onSnapshot(
    filesCol,
    (snapshot) => {
      const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(files);
    },
    (error) => {
      console.error('Error subscribing to files:', error);
      callback([]);
    }
  );
};

// Task Attachments (stored in Firebase Storage)
export const uploadAttachment = async (userId, taskId, attachmentData) => {
  const storageRef = ref(
    storage,
    `users/${userId}/attachments/${taskId}/${attachmentData.id}`
  );
  await uploadString(storageRef, attachmentData.data, 'data_url');
  const downloadURL = await getDownloadURL(storageRef);

  return {
    id: attachmentData.id,
    name: attachmentData.name,
    type: attachmentData.type,
    size: attachmentData.size,
    uploadedAt: attachmentData.uploadedAt,
    storageURL: downloadURL,
  };
};

export const deleteAttachment = async (userId, taskId, attachmentId) => {
  try {
    const storageRef = ref(
      storage,
      `users/${userId}/attachments/${taskId}/${attachmentId}`
    );
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting attachment:', error);
  }
};

// Fetch file bytes from Firebase Storage URL (bypasses CORS)
export const fetchFileBytes = async (storageURL) => {
  try {
    // Extract the storage path from the download URL
    // Firebase Storage URLs contain the path encoded in the URL
    const urlObj = new URL(storageURL);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (!pathMatch) {
      throw new Error('Invalid storage URL format');
    }
    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);

    // Use getBlob to fetch the file (bypasses CORS)
    const blob = await getBlob(storageRef);
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Error fetching file bytes:', error);
    throw error;
  }
};

// Companies
export const subscribeCompanies = (userId, callback) => {
  const companiesCol = getUserCollection(userId, 'companies');
  return onSnapshot(
    companiesCol,
    (snapshot) => {
      const companies = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      companies.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      callback(companies);
    },
    (error) => {
      console.error('Error subscribing to companies:', error);
      callback([]);
    }
  );
};

export const saveCompany = async (userId, company) => {
  const companyDoc = getUserDoc(userId, 'companies', company.id);
  await setDoc(companyDoc, company);
};

export const deleteCompanyFromDB = async (userId, companyId) => {
  const companyDoc = getUserDoc(userId, 'companies', companyId);
  await deleteDoc(companyDoc);
};

// Company Attachments
export const uploadCompanyAttachment = async (userId, companyId, attachmentData) => {
  const storageRef = ref(
    storage,
    `users/${userId}/company-attachments/${companyId}/${attachmentData.id}`
  );
  await uploadString(storageRef, attachmentData.data, 'data_url');
  const downloadURL = await getDownloadURL(storageRef);

  return {
    id: attachmentData.id,
    name: attachmentData.name,
    type: attachmentData.type,
    size: attachmentData.size,
    uploadedAt: attachmentData.uploadedAt,
    storageURL: downloadURL,
  };
};

export const uploadCompanyLogo = async (userId, companyId, logoData) => {
  const storageRef = ref(
    storage,
    `users/${userId}/company-logos/${companyId}/${logoData.id}`
  );
  await uploadString(storageRef, logoData.data, 'data_url');
  const downloadURL = await getDownloadURL(storageRef);

  return {
    id: logoData.id,
    name: logoData.name,
    type: logoData.type,
    size: logoData.size,
    uploadedAt: logoData.uploadedAt,
    storageURL: downloadURL,
  };
};

// Contacts (linked to companies)
export const subscribeContacts = (userId, callback) => {
  const contactsCol = getUserCollection(userId, 'contacts');
  return onSnapshot(
    contactsCol,
    (snapshot) => {
      const contacts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      contacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      callback(contacts);
    },
    (error) => {
      console.error('Error subscribing to contacts:', error);
      callback([]);
    }
  );
};

export const saveContact = async (userId, contact) => {
  const contactDoc = getUserDoc(userId, 'contacts', contact.id);
  await setDoc(contactDoc, contact);
};

export const deleteContactFromDB = async (userId, contactId) => {
  const contactDoc = getUserDoc(userId, 'contacts', contactId);
  await deleteDoc(contactDoc);
};

// Contact Attachments
export const uploadContactAttachment = async (userId, contactId, attachmentData) => {
  const storageRef = ref(
    storage,
    `users/${userId}/contact-attachments/${contactId}/${attachmentData.id}`
  );
  await uploadString(storageRef, attachmentData.data, 'data_url');
  const downloadURL = await getDownloadURL(storageRef);

  return {
    id: attachmentData.id,
    name: attachmentData.name,
    type: attachmentData.type,
    size: attachmentData.size,
    uploadedAt: attachmentData.uploadedAt,
    storageURL: downloadURL,
  };
};

// Categories
export const subscribeCategories = (userId, callback) => {
  const categoriesCol = getUserCollection(userId, 'categories');
  return onSnapshot(
    categoriesCol,
    (snapshot) => {
      const categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      callback(categories);
    },
    (error) => {
      console.error('Error subscribing to categories:', error);
      callback([]);
    }
  );
};

export const saveCategory = async (userId, category) => {
  const categoryDoc = getUserDoc(userId, 'categories', category.id);
  await setDoc(categoryDoc, category);
};

export const deleteCategoryFromDB = async (userId, categoryId) => {
  const categoryDoc = getUserDoc(userId, 'categories', categoryId);
  await deleteDoc(categoryDoc);
};
