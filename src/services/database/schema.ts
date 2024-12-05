import * as SQLite from 'expo-sqlite';

export const initializeDatabase = async () => {
  const db = SQLite.openDatabase('memorymap.db');

  // Create tables
  await db.transaction(tx => {
    // Locations table
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        description TEXT,
        address TEXT,
        category TEXT,
        is_instagram_source INTEGER DEFAULT 0,
        instagram_url TEXT,
        date_posted TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',
        version INTEGER DEFAULT 1,
        deleted INTEGER DEFAULT 0
      );
    `);

    // User locations table - for personalization
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS user_locations (
        id TEXT PRIMARY KEY,
        location_id TEXT NOT NULL,
        custom_name TEXT,
        custom_description TEXT,
        category TEXT,
        is_favorite INTEGER DEFAULT 0,
        notify_enabled INTEGER DEFAULT 0,
        notify_radius REAL DEFAULT 1.0,
        saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',
        version INTEGER DEFAULT 1,
        deleted INTEGER DEFAULT 0,
        FOREIGN KEY(location_id) REFERENCES locations(id)
      );
    `);

    // Sync queue table
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        attempts INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
      );
    `);
  });
};

