import { openDatabase, WebSQLDatabase } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'failed';
  deleted: boolean;
  isFavorite: boolean;
}

export class LocationService {
  private static db: WebSQLDatabase = openDatabase('memorymap.db');

  static async initDatabase(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.transaction(
        tx => {
          // Create locations table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS locations (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              latitude REAL NOT NULL,
              longitude REAL NOT NULL,
              description TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              sync_status TEXT NOT NULL,
              deleted INTEGER DEFAULT 0
            )`,
            [],
            () => {
              // Create user_locations table for favorites
              tx.executeSql(
                `CREATE TABLE IF NOT EXISTS user_locations (
                  id TEXT PRIMARY KEY,
                  location_id TEXT NOT NULL,
                  is_favorite INTEGER DEFAULT 0,
                  saved_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL,
                  sync_status TEXT NOT NULL,
                  FOREIGN KEY (location_id) REFERENCES locations (id)
                )`,
                [],
                () => {
                  // Create sync_queue table
                  tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS sync_queue (
                      id TEXT PRIMARY KEY,
                      entity_type TEXT NOT NULL,
                      entity_id TEXT NOT NULL,
                      operation TEXT NOT NULL,
                      data TEXT NOT NULL,
                      created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`,
                    [],
                    () => resolve(),
                    (_, error) => {
                      reject(new Error(`Failed to create sync_queue table: ${error.message}`));
                      return false;
                    }
                  );
                },
                (_, error) => {
                  reject(new Error(`Failed to create user_locations table: ${error.message}`));
                  return false;
                }
              );
            },
            (_, error) => {
              reject(new Error(`Failed to create locations table: ${error.message}`));
              return false;
            }
          );
        },
        error => reject(new Error(`Transaction error: ${error.message}`))
      );
    });
  }

  static async saveLocation(location: { name: string; latitude: number; longitude: number; description?: string }): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise<string>((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            `INSERT INTO locations (id, name, latitude, longitude, description, created_at, updated_at, sync_status, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, location.name, location.latitude, location.longitude, location.description || '', now, now, 'pending', 0],
            (_, result) => {
              if (result.rowsAffected > 0) {
                // Add to sync queue with complete location data
                const syncData = {
                  ...location,
                  id,
                  created_at: now,
                  updated_at: now,
                  deleted: false
                };
                
                tx.executeSql(
                  `INSERT INTO sync_queue (id, entity_type, entity_id, operation, data)
                   VALUES (?, ?, ?, ?, ?)`,
                  [uuidv4(), 'locations', id, 'create', JSON.stringify(syncData)],
                  (_, syncResult) => {
                    if (syncResult.rowsAffected > 0) {
                      resolve(id);
                    } else {
                      reject(new Error('Failed to add location to sync queue'));
                    }
                  },
                  (_, error) => {
                    reject(new Error(`Sync queue error: ${error.message}`));
                    return false;
                  }
                );
              } else {
                reject(new Error('Failed to save location: No rows affected'));
              }
            },
            (_, error) => {
              reject(new Error(`Database error: ${error.message}`));
              return false;
            }
          );
        },
        error => reject(new Error(`Transaction error: ${error.message}`))
      );
    });
  }

  static async getLocations(): Promise<Location[]> {
    return new Promise<Location[]>((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT l.*, COALESCE(ul.is_favorite, 0) as isFavorite 
           FROM locations l
           LEFT JOIN user_locations ul ON l.id = ul.location_id
           WHERE l.deleted = 0 
           ORDER BY l.created_at DESC`,
          [],
          (_, { rows }) => {
            resolve(rows._array as Location[]);
          },
          (_, error) => {
            reject(new Error(`Failed to fetch locations: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  static async updateFavoriteStatus(locationId: string, isFavorite: boolean): Promise<void> {
    const now = new Date().toISOString();
    return new Promise<void>((resolve, reject) => {
      this.db.transaction(
        tx => {
          // First, check if a user_locations entry exists
          tx.executeSql(
            `SELECT id FROM user_locations WHERE location_id = ?`,
            [locationId],
            (_, { rows }) => {
              if (rows.length > 0) {
                // Update existing entry
                tx.executeSql(
                  `UPDATE user_locations 
                   SET is_favorite = ?, updated_at = ?, sync_status = 'pending'
                   WHERE location_id = ?`,
                  [isFavorite ? 1 : 0, now, locationId],
                  (_, result) => {
                    if (result.rowsAffected > 0) {
                      resolve();
                    } else {
                      reject(new Error('Failed to update favorite status'));
                    }
                  },
                  (_, error) => {
                    reject(new Error(`Database error: ${error.message}`));
                    return false;
                  }
                );
              } else {
                // Create new entry
                tx.executeSql(
                  `INSERT INTO user_locations (id, location_id, is_favorite, saved_at, updated_at, sync_status)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [uuidv4(), locationId, isFavorite ? 1 : 0, now, now, 'pending'],
                  (_, result) => {
                    if (result.rowsAffected > 0) {
                      resolve();
                    } else {
                      reject(new Error('Failed to create user location entry'));
                    }
                  },
                  (_, error) => {
                    reject(new Error(`Database error: ${error.message}`));
                    return false;
                  }
                );
              }
            },
            (_, error) => {
              reject(new Error(`Database error: ${error.message}`));
              return false;
            }
          );
        },
        error => reject(new Error(`Transaction error: ${error.message}`))
      );
    });
  }

  static async deleteLocation(locationId: string): Promise<void> {
    const now = new Date().toISOString();
    return new Promise<void>((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            `UPDATE locations 
             SET deleted = 1, updated_at = ?, sync_status = 'pending'
             WHERE id = ?`,
            [now, locationId],
            (_, result) => {
              if (result.rowsAffected > 0) {
                // Add to sync queue
                tx.executeSql(
                  `INSERT INTO sync_queue (id, entity_type, entity_id, operation, data)
                   VALUES (?, ?, ?, ?, ?)`,
                  [uuidv4(), 'locations', locationId, 'delete', JSON.stringify({ id: locationId })],
                  () => resolve(),
                  (_, error) => {
                    reject(new Error(`Sync queue error: ${error.message}`));
                    return false;
                  }
                );
              } else {
                reject(new Error('Location not found'));
              }
            },
            (_, error) => {
              reject(new Error(`Database error: ${error.message}`));
              return false;
            }
          );
        },
        error => reject(new Error(`Transaction error: ${error.message}`))
      );
    });
  }

  static async updateSyncStatus(locationId: string, status: Location['sync_status']): Promise<void> {
    const now = new Date().toISOString();
    return new Promise<void>((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            `UPDATE locations 
             SET sync_status = ?, updated_at = ?
             WHERE id = ?`,
            [status, now, locationId],
            (_, result) => {
              if (result.rowsAffected > 0) {
                resolve();
              } else {
                reject(new Error('Location not found'));
              }
            },
            (_, error) => {
              reject(new Error(`Database error: ${error.message}`));
              return false;
            }
          );
        },
        error => reject(new Error(`Transaction error: ${error.message}`))
      );
    });
  }
}
