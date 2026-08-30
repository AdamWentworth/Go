import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'pokegonexus-native.db';

let databasePromise: ReturnType<typeof SQLite.openDatabaseAsync> | null = null;

/**
 * All native persistence stores share one connection. Opening the same file
 * through multiple handles during a cold launch can leave concurrent schema
 * initialization waiting on each other, especially immediately after app data
 * has been cleared. Expo SQLite serializes work issued through one connection.
 */
export const openNativeDatabase = (): ReturnType<typeof SQLite.openDatabaseAsync> => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
};
