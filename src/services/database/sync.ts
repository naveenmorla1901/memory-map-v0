//src/services/database/sync.ts
import { openDatabase } from 'expo-sqlite';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  Firestore 
} from 'firebase/firestore';
import { firebaseConfig } from '../../utils/firebaseConfig';

const app = initializeApp(firebaseConfig);
const firestore: Firestore = getFirestore(app);

// Define types for SQLite operations
interface SQLResultSet {
  rows: {
    _array: any[];
    length: number;
    item: (index: number) => any;
  };
  rowsAffected: number;
  insertId?: number;
}

interface SQLTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
    errorCallback?: (transaction: SQLTransaction, error: Error) => boolean
  ) => void;
}

export class SyncService {
  private db: any = null;
  private isInitialized = false;
  
  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    this.db = openDatabase('memorymap.db');
    this.isInitialized = true;
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeDatabase();
    }
  }

  async syncToBackend() {
    await this.ensureInitialized();
    try {
      const pendingItems = await this.getPendingSyncItems();
      
      for (const item of pendingItems) {
        try {
          switch (item.operation) {
            case 'create':
              await this.handleCreate(item);
              break;
            case 'update':
              await this.handleUpdate(item);
              break;
            case 'delete':
              await this.handleDelete(item);
              break;
          }
          
          await this.markSyncComplete(item.id);
        } catch (error) {
          await this.incrementSyncAttempt(item.id);
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  private async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    await this.ensureInitialized();
    return new Promise<SyncQueueItem[]>((resolve, reject) => {
      this.db.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            'SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC',
            ['pending'],
            (_: SQLTransaction, resultSet: SQLResultSet) => {
              resolve(resultSet.rows._array as SyncQueueItem[]);
            },
            (_: SQLTransaction, error: Error) => {
              reject(error);
              return false;
            }
          );
        },
        (error: Error) => reject(error)
      );
    });
  }

  private async handleCreate(item: SyncQueueItem) {
    await this.ensureInitialized();
    const data = JSON.parse(item.data);
    
    // Send to Firebase/Backend
    await setDoc(
      doc(firestore, item.entity_type, item.entity_id), 
      data
    );

    // Update local sync status
    await new Promise<void>((resolve, reject) => {
      this.db.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            `UPDATE ${item.entity_type} 
             SET sync_status = 'synced', 
             version = version + 1 
             WHERE id = ?`,
            [item.entity_id]
          );
        },
        (error: Error) => reject(error),
        () => resolve()
      );
    });
  }

  private async handleUpdate(item: SyncQueueItem) {
    await this.ensureInitialized();
    const data = JSON.parse(item.data);
    
    // Get current version from Firebase
    const docRef = doc(firestore, item.entity_type, item.entity_id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const serverData = docSnap.data();
      const serverVersion = serverData?.version || 0;
      const localVersion = data.version;

      if (serverVersion > localVersion) {
        // Handle conflict - server version is newer
        await this.handleConflict(item, serverData);
      } else {
        // Update server
        await updateDoc(docRef, data);
      }
    }
  }

  private async handleDelete(item: SyncQueueItem) {
    await this.ensureInitialized();
    const docRef = doc(firestore, item.entity_type, item.entity_id);
    await deleteDoc(docRef);

    // Mark as deleted locally
    await new Promise<void>((resolve, reject) => {
      this.db.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            `UPDATE ${item.entity_type} 
             SET deleted = 1, 
             sync_status = 'synced' 
             WHERE id = ?`,
            [item.entity_id]
          );
        },
        (error: Error) => reject(error),
        () => resolve()
      );
    });
  }

  private async handleConflict(item: SyncQueueItem, serverData: Record<string, any>) {
    await this.ensureInitialized();
    // Simple last-write-wins strategy
    const localData = JSON.parse(item.data);
    const mergedData = {
      ...localData,
      ...serverData,
      version: (serverData.version || 0) + 1
    };

    // Update both local and server
    await new Promise<void>((resolve, reject) => {
      this.db.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            `UPDATE ${item.entity_type} 
             SET sync_status = 'synced', 
             version = ?, 
             updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [mergedData.version, item.entity_id]
          );
        },
        (error: Error) => reject(error),
        () => resolve()
      );
    });

    const docRef = doc(firestore, item.entity_type, item.entity_id);
    await updateDoc(docRef, mergedData);
  }

  private async markSyncComplete(id: string) {
    await this.ensureInitialized();
    await new Promise<void>((resolve, reject) => {
      this.db.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            'UPDATE sync_queue SET status = ? WHERE id = ?',
            ['completed', id]
          );
        },
        (error: Error) => reject(error),
        () => resolve()
      );
    });
  }

  private async incrementSyncAttempt(id: string) {
    await this.ensureInitialized();
    await new Promise<void>((resolve, reject) => {
      this.db.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            'UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?',
            [id]
          );
        },
        (error: Error) => reject(error),
        () => resolve()
      );
    });
  }
}

// Types
interface SyncQueueItem {
  id: string;
  entity_type: 'locations' | 'user_locations';
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data: string;
  created_at: string;
  attempts: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}