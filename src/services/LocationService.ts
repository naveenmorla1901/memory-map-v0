import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  deleted?: number;
}

export class LocationService {
  private static db = SQLite.openDatabase('memorymap.db');

  static async saveLocation(location: { 
    name: string; 
    latitude: number; 
    longitude: number; 
    description?: string 
  }): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise<void>((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            `INSERT INTO locations (id, name, latitude, longitude, description, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, location.name, location.latitude, location.longitude, location.description || '', now, now, 'pending'],
            (_, result) => {
              if (result.rowsAffected > 0) {
                // Add to sync queue
                tx.executeSql(
                  `INSERT INTO sync_queue (id, entity_type, entity_id, operation, data)
                   VALUES (?, ?, ?, ?, ?)`,
                  [uuidv4(), 'locations', id, 'create', JSON.stringify(location)],
                  (_, syncResult) => {
                    if (syncResult.rowsAffected > 0) {
                      resolve();
                    } else {
                      reject(new Error('Failed to add to sync queue'));
                    }
                  },
                  (_, error) => {
                    reject(error);
                    return false;
                  }
                );
              } else {
                reject(new Error('Failed to save location'));
              }
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        error => reject(error)
      );
    });
  }

  static async getLocations(): Promise<Location[]> {
    return new Promise<Location[]>((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM locations WHERE deleted = 0 ORDER BY created_at DESC',
          [],
          (_, { rows }) => {
            resolve(rows._array as Location[]);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
}