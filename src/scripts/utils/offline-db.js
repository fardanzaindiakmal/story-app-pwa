import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const DB_VERSION = 1;

const PENDING_STORE_NAME = 'pending_stories';
const BOOKMARK_STORE_NAME = 'bookmarked_stories';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(PENDING_STORE_NAME)) {
      database.createObjectStore(PENDING_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
    if (!database.objectStoreNames.contains(BOOKMARK_STORE_NAME)) {
      database.createObjectStore(BOOKMARK_STORE_NAME, { keyPath: 'id' });
    }
  },
});

export async function addPendingStory(story) {
  const db = await dbPromise;
  return db.add(PENDING_STORE_NAME, story);
}

export async function getAllPendingStories() {
  const db = await dbPromise;
  return db.getAll(PENDING_STORE_NAME);
}

export async function deletePendingStory(id) {
  const db = await dbPromise;
  return db.delete(PENDING_STORE_NAME, Number(id));
}

export async function addBookmarkStory(story) {
  if (!story.id) {
    throw new Error('`id` is required to bookmark a story.');
  }
  const db = await dbPromise;
  return db.put(BOOKMARK_STORE_NAME, story);
}

export async function getAllBookmarkStories() {
  const db = await dbPromise;
  return db.getAll(BOOKMARK_STORE_NAME);
}

export async function getBookmarkStoryById(id) {
  if (!id) {
    throw new Error('`id` is required.');
  }
  const db = await dbPromise;
  return db.get(BOOKMARK_STORE_NAME, id);
}

export async function deleteBookmarkStory(id) {
  if (!id) {
    throw new Error('`id` is required.');
  }
  const db = await dbPromise;
  return db.delete(BOOKMARK_STORE_NAME, id);
}