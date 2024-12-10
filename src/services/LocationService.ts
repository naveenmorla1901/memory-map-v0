import { openDatabaseSync, SQLiteRunResult } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { LocationInput, Location } from '../types/location';
import { locationInputSchema } from '../utils/validation';

// Define a type for the database row to ensure type safety
interface LocationRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string | null;
  address: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'failed';
  version: number;
  deleted: number;
}

export class LocationService {
  private static db = openDatabaseSync('memorymap.db');

  // Initialize database with table creation
  static initializeDatabase() {
    try {
      // Ensure the database is open
      if (!this.db) {
        throw new Error('Database connection failed');
      }

      // Create locations table with detailed schema
      this.db.execSync(`
        CREATE TABLE IF NOT EXISTS locations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          description TEXT,
          address TEXT,
          category TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT NOT NULL DEFAULT 'pending',
          version INTEGER NOT NULL DEFAULT 1,
          deleted INTEGER NOT NULL DEFAULT 0
        )
      `);

      console.log('Database and locations table initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error; // Rethrow to be caught by caller
    }
  }

  // Validate database connection before operations
  private static ensureDatabaseConnection() {
    if (!this.db) {
      throw new Error('Database connection is not established');
    }
  }

  // Type-safe method to convert database row to Location
  private static rowToLocation(row: LocationRow): Location {
    return {
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      description: row.description || '',
      address: row.address || '',
      category: row.category || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      sync_status: row.sync_status,
      version: row.version,
      deleted: row.deleted === 1
    };
  }

  static async saveLocation(location: LocationInput): Promise<string> {
    try {
      this.ensureDatabaseConnection();

      const validatedLocation = locationInputSchema.parse({
        ...location,
        name: location.name.slice(0, 100)
      });
      const id = uuidv4();
      const now = new Date().toISOString();

      try {
        const result = this.db.runSync(
          `INSERT INTO locations (
            id, name, latitude, longitude, description, 
            address, category, created_at, updated_at, 
            sync_status, version, deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            validatedLocation.name,
            validatedLocation.latitude,
            validatedLocation.longitude,
            validatedLocation.description || '',
            validatedLocation.address || '',
            validatedLocation.category || '',
            validatedLocation.created_at || now,
            validatedLocation.updated_at || now,
            'pending',
            1,
            0
          ]
        );
        return id;
      } catch (error) {
        console.error('Database save error:', error);
        throw new Error(`Failed to save location: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Location validation error:', error);
      throw new Error(`Invalid location data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getLocations(): Promise<Location[]> {
    try {
      this.ensureDatabaseConnection();

      const result = this.db.getAllSync(
        'SELECT id, name, latitude, longitude, description, address, category, created_at, updated_at, sync_status, version, deleted FROM locations WHERE deleted = 0 ORDER BY created_at DESC'
      ) as LocationRow[];
      
      // Convert result to Location array using type-safe method
      return result.map(this.rowToLocation);
    } catch (error) {
      console.error('Get locations error:', error);
      throw new Error(`Failed to retrieve locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateLocation(location: Location): Promise<void> {
    try {
      this.ensureDatabaseConnection();

      const now = new Date().toISOString();
      const result: SQLiteRunResult = this.db.runSync(
        `UPDATE locations SET 
          name = ?,
          description = ?,
          address = ?,
          category = ?,
          updated_at = ?,
          sync_status = ?
        WHERE id = ?`,
        [
          location.name,
          location.description || '',
          location.address || '',
          location.category || '',
          now,
          'pending',
          location.id
        ]
      );

      if (result.changes === 0) {
        throw new Error(`No location found with id: ${location.id}`);
      }
    } catch (error) {
      console.error('Update location error:', error);
      throw new Error(`Failed to update location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteLocation(id: string): Promise<void> {
    try {
      this.ensureDatabaseConnection();

      const result: SQLiteRunResult = this.db.runSync(
        `UPDATE locations SET deleted = 1, sync_status = 'pending' WHERE id = ?`,
        [id]
      );

      if (result.changes === 0) {
        throw new Error(`No location found with id: ${id}`);
      }
    } catch (error) {
      console.error('Delete location error:', error);
      throw new Error(`Failed to delete location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
