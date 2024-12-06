//src/services/LocationService.ts
import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { LocationInput, Location } from '../types/location';
import { locationInputSchema } from '../utils/validation';

export class LocationService {
  private static db = SQLite.openDatabase('memorymap.db');

  static async saveLocation(location: LocationInput): Promise<string> {
    try {
      const validatedLocation = locationInputSchema.parse({
        ...location,
        name: location.name.slice(0, 100) // Ensure name is not longer than 100 characters
      });
      const id = uuidv4();
      const now = new Date().toISOString();

      return new Promise<string>((resolve, reject) => {
        this.db.transaction(
          tx => {
            tx.executeSql(
              `INSERT INTO locations (id, name, latitude, longitude, description, address, category, created_at, updated_at, sync_status, version, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                validatedLocation.name,
                validatedLocation.latitude,
                validatedLocation.longitude,
                validatedLocation.description,
                validatedLocation.address,
                validatedLocation.category,
                validatedLocation.created_at || now,
                validatedLocation.updated_at || now,
                'pending',
                1,
                0
              ],
              (_, result) => {
                if (result.rowsAffected > 0) {
                  resolve(id);
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
    } catch (error) {
      console.error('Validation error:', error);
      throw new Error('Invalid location data');
    }
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

  static async updateLocation(location: Location): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE locations SET name = ?, description = ?, address = ?, category = ?, updated_at = ?, sync_status = ? WHERE id = ?',
          [location.name, location.description, location.address, location.category, new Date().toISOString(), 'pending', location.id],
          (_, result) => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  static async deleteLocation(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE locations SET deleted = ?, sync_status = ? WHERE id = ?',
          [1, 'pending', id],
          (_, result) => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
}

