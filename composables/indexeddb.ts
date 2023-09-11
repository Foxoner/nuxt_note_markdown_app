import { Note } from '../types'

const dbName = 'NotesDB';
const storeName = 'notes';

const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(storeName, { autoIncrement: true });
    };

    request.onsuccess = (event) => {
      const db = event.target.result as IDBDatabase;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const saveNote = async (notes: Note[]) => {
  const db = await openDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  // Clear the existing notes
  store.clear();

  // Add the new notes
  notes.forEach((note) => {
    store.add(note);
  });

  transaction.oncomplete = () => {
    db.close();
  };
  // const request = store.add(note);
  
  // request.onsuccess = () => {
  //   db.close();
  // };

  // request.onerror = (event) => {
  //   console.error('Error adding note:', event.target.error);
  // };

};

const getNotes = async () => {
  const db = await openDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);

  const notes: Note[] = [];

  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result as IDBCursorWithValue;
    if (cursor) {
      notes.push(cursor.value);
      cursor.continue();
    }
  };

  transaction.oncomplete = () => {
    db.close();
  };

  return notes;
};

export { saveNote, getNotes };