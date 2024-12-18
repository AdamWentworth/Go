// src/mocks/services/indexedDB.js

import 'fake-indexeddb/auto';
import { openDB as originalOpenDB } from 'idb';

export const openDB = jest.fn().mockImplementation(originalOpenDB);

export const clearStore = jest.fn(() => Promise.resolve());
export const clearListsStore = jest.fn(() => Promise.resolve());
export const deleteMetadata = jest.fn(() => Promise.resolve());
export const initDB = jest.fn(() => Promise.resolve());
export const initListsDB = jest.fn(() => Promise.resolve());
export const getFromDB = jest.fn(() => Promise.resolve(null));
export const putIntoDB = jest.fn(() => Promise.resolve());
export const putBulkIntoDB = jest.fn(() => Promise.resolve());
export const getAllFromDB = jest.fn(() => Promise.resolve([]));
export const deleteFromDB = jest.fn(() => Promise.resolve());
export const getFromListsDB = jest.fn(() => Promise.resolve(null));
export const putIntoListsDB = jest.fn(() => Promise.resolve());
export const getAllFromListsDB = jest.fn(() => Promise.resolve([]));
export const clearBatchedUpdates = jest.fn(() => Promise.resolve());
export const getBatchedUpdates = jest.fn(() => Promise.resolve([]));
export const putBatchedUpdates = jest.fn(() => Promise.resolve());
export const getAllListsFromDB = jest.fn(() => Promise.resolve({}));
export const storeListsInIndexedDB = jest.fn(() => Promise.resolve());
