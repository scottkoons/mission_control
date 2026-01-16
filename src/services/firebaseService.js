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

// Contacts
export const subscribeContacts = (userId, callback) => {
  const contactsCol = getUserCollection(userId, 'contacts');
  return onSnapshot(
    contactsCol,
    (snapshot) => {
      const contacts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Sort by company name, then by contact name
      contacts.sort((a, b) => {
        const companyCompare = (a.company || '').localeCompare(b.company || '');
        if (companyCompare !== 0) return companyCompare;
        return (a.name || '').localeCompare(b.name || '');
      });
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
