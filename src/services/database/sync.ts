import { openDatabase, SQLTransaction, WebSQLDatabase } from 'expo-sqlite';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, getDoc, Firestore } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { app } from '../../utils/firebaseConfig';

interface SQLError {
  message: string;
}

interface SyncQueueItem {
  id: string;
  entity_type: 'locations' | 'user_locations';
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data: string;
  created_at: string;
  attempts: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
  version?: number;
}

export class SyncService {
  private static instance: SyncService;
  private db: WebSQLDatabase;
  private firestore: Firestore;
  private isSyncing: boolean = false;
  private maxRetryAttempts = 3;
  private batchSize = 10;
  private retryDelayMs = 5000;
  private networkStateUnsubscribe?: () => void;

  private constructor() {
    this.db = openDatabase('memorymap.db');
    this.firestore = getFirestore(app);
    this.initSyncQueue().catch(console.error);
    this.setupNetworkStateListener();
  }

  private setupNetworkStateListener() {
    this.networkStateUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected) {
        this.syncToBackend().catch(console.error);
      }
    });
  }

  public dispose() {
    this.networkStateUnsubscribe?.();
  }

  private async initSyncQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS sync_queue (
              id TEXT PRIMARY KEY,
              entity_type TEXT NOT NULL,
              entity_id TEXT NOT NULL,
              operation TEXT NOT NULL,
              data TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              attempts INTEGER DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'pending',
              error TEXT,
              version INTEGER DEFAULT 1
            )`,
            [],
            () => resolve(),
            (_: unknown, error: SQLError) => {
              reject(new Error(`Failed to create sync queue table: ${error.message}`));
              return false;
            }
          );
        },
        (error: SQLError) => reject(new Error(`Transaction error: ${error.message}`))
      );
    });
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async syncToBackend(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('No network connection available');
      return;
    }

    this.isSyncing = true;

    try {
      await this.cleanupCompletedItems();
      const pendingItems = await this.getPendingSyncItems();
      
      // Process items in batches
      for (let i = 0; i < pendingItems.length; i += this.batchSize) {
        const batch = pendingItems.slice(i, i + this.batchSize);
        await Promise.all(batch.map(item => this.processSyncItem(item)));
      }
    } catch (error) {
      console.error('Sync failed:', error);
      throw new Error('Failed to sync with backend');
    } finally {
      this.isSyncing = false;
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < this.maxRetryAttempts) {
      try {
        await this.markItemAsProcessing(item.id);
        
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
          default:
            throw new Error(`Unknown operation: ${item.operation}`);
        }
        
        await this.markSyncComplete(item.id);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Sync attempt ${retryCount + 1} failed for item ${item.id}:`, error);
        retryCount++;
        
        if (retryCount < this.maxRetryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
        }
      }
    }

    if (lastError) {
      await this.handleSyncError(item.id, lastError);
    }
  }

  private async cleanupCompletedItems(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: SQLTransaction) => {
        tx.executeSql(
          `DELETE FROM sync_queue WHERE status = ? AND created_at < datetime('now', '-7 days')`,
          ['completed'],
          () => resolve(),
          (_: unknown, error: SQLError) => {
            reject(new Error(`Failed to cleanup sync queue: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  private async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: SQLTransaction) => {
        tx.executeSql(
          `SELECT * FROM sync_queue WHERE status IN (?, ?) AND attempts < 3 ORDER BY created_at ASC`,
          ['pending', 'failed'],
          (_: unknown, { rows }: { rows: { _array: SyncQueueItem[] } }) => {
            resolve(rows._array);
          },
          (_: unknown, error: SQLError) => {
            reject(new Error(`Failed to get pending sync items: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  private async markItemAsProcessing(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE sync_queue 
           SET status = ?, attempts = attempts + 1 
           WHERE id = ?`,
          ['processing', id],
          () => resolve(),
          (_, error) => {
            reject(new Error(`Failed to mark item as processing: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  private async handleCreate(item: SyncQueueItem) {
    let parsedData: any;
    try {
      parsedData = JSON.parse(item.data);
    } catch (error: any) {
      throw this.handleFirebaseError(new Error(`Invalid JSON data for item ${item.id}: ${error.message}`));
    }

    return this.runInTransaction(async () => {
      const docRef = doc(this.firestore, item.entity_type, item.entity_id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await this.handleConflict(item, docSnap.data());
      } else {
        const timestamp = new Date().toISOString();
        await setDoc(docRef, {
          ...parsedData,
          created_at: new Date(parsedData.created_at || timestamp),
          updated_at: new Date(timestamp),
          version: 1,
          sync_status: 'synced'
        });
        await this.updateLocalSyncStatus(item.entity_type, item.entity_id, 'synced');
      }
    });
  }

  private async handleUpdate(item: SyncQueueItem) {
    let parsedData: any;
    try {
      parsedData = JSON.parse(item.data);
    } catch (error: any) {
      throw new Error(`Invalid JSON data for item ${item.id}: ${error.message}`);
    }

    return this.runInTransaction(async () => {
      const docRef = doc(this.firestore, item.entity_type, item.entity_id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const serverData = docSnap.data();
        const serverVersion = serverData?.version || 0;
        const localVersion = parsedData.version || 0;

        if (serverVersion > localVersion) {
          await this.handleConflict(item, serverData);
        } else {
          const timestamp = new Date().toISOString();
          await updateDoc(docRef, {
            ...parsedData,
            updated_at: new Date(timestamp),
            version: serverVersion + 1,
            sync_status: 'synced'
          });
          await this.updateLocalSyncStatus(item.entity_type, item.entity_id, 'synced');
        }
      } else if (item.entity_type === 'user_locations') {
        await this.handleCreate(item);
      } else {
        throw new Error('Document does not exist and cannot be updated');
      }
    });
  }

  private async handleDelete(item: SyncQueueItem) {
    return this.runInTransaction(async () => {
      const docRef = doc(this.firestore, item.entity_type, item.entity_id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await deleteDoc(docRef);
      }
      await this.updateLocalSyncStatus(item.entity_type, item.entity_id, 'synced', true);
    });
  }

  private async handleConflict(item: SyncQueueItem, serverData: any) {
    let localData: any;
    try {
      localData = JSON.parse(item.data);
    } catch (error: any) {
      throw new Error(`Invalid JSON data for conflict resolution: ${error.message}`);
    }

    return this.runInTransaction(async () => {
      const mergedData = this.mergeData(localData, serverData);
      const timestamp = new Date().toISOString();

      const docRef = doc(this.firestore, item.entity_type, item.entity_id);
      await updateDoc(docRef, {
        ...mergedData,
        updated_at: new Date(timestamp),
        version: (serverData.version || 0) + 1,
        sync_status: 'synced'
      });
      
      await this.updateLocalData(item.entity_type, item.entity_id, {
        ...mergedData,
        updated_at: timestamp,
        version: (serverData.version || 0) + 1,
        sync_status: 'synced'
      });
    });
  }

  private mergeData(localData: any, serverData: any): any {
    const result = { ...serverData };
    
    // Fields that should always use local values
    const localPriorityFields = ['name', 'description', 'tags'];
    for (const field of localPriorityFields) {
      if (localData[field] !== undefined) {
        result[field] = localData[field];
      }
    }

    // Merge arrays by concatenating and removing duplicates
    const arrayFields = ['photos', 'comments'];
    for (const field of arrayFields) {
      if (Array.isArray(localData[field]) || Array.isArray(serverData[field])) {
        const localArray = Array.isArray(localData[field]) ? localData[field] : [];
        const serverArray = Array.isArray(serverData[field]) ? serverData[field] : [];
        result[field] = [...new Set([...localArray, ...serverArray])];
      }
    }

    // Use most recent non-null values for other fields
    for (const key in localData) {
      if (!localPriorityFields.includes(key) && !arrayFields.includes(key)) {
        if (localData[key] != null) {
          result[key] = localData[key];
        }
      }
    }

    return result;
  }

  private async runInTransaction<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx) => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          // Removed rollback logic as SQLite transactions are automatically rolled back on error
          reject(error);
        }
      }, 
      (error) => {
        reject(new Error(`Transaction failed: ${error.message}`));
      });
    });
  }

  private async updateLocalSyncStatus(
    entityType: string, 
    entityId: string, 
    status: 'synced' | 'pending', 
    isDeleted: boolean = false
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE ${entityType} 
           SET sync_status = ?, 
               deleted = ?,
               version = COALESCE(version, 0) + 1,
               updated_at = ? 
           WHERE id = ?`,
          [status, isDeleted ? 1 : 0, timestamp, entityId],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve();
            } else {
              reject(new Error(`No rows updated for ${entityType} ${entityId}`));
            }
          },
          (_, error) => {
            reject(new Error(`Failed to update local sync status: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  private async updateLocalData(entityType: string, entityId: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        const fields = Object.keys(data).filter(key => key !== 'id');
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(field => data[field]);

        tx.executeSql(
          `UPDATE ${entityType} 
           SET ${fields.map(field => `${field} = ?`).join(', ')} 
           WHERE id = ?`,
          [...values, entityId],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve();
            } else {
              reject(new Error(`No rows updated for ${entityType} ${entityId}`));
            }
          },
          (_, error) => {
            reject(new Error(`Failed to update local data: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  private async markSyncComplete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE sync_queue 
           SET status = ?, 
               error = NULL 
           WHERE id = ?`,
          ['completed', id],
          () => resolve(),
          (_, error) => {
            reject(new Error(`Failed to mark sync complete: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  private async handleSyncError(id: string, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE sync_queue 
           SET status = ?, 
               error = ? 
           WHERE id = ?`,
          ['failed', errorMessage, id],
          () => resolve(),
          (_, error) => {
            reject(new Error(`Failed to handle sync error: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  private handleFirebaseError(error: unknown): Error {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'permission-denied':
          return new Error('You do not have permission to perform this operation');
        case 'not-found':
          return new Error('The requested document was not found');
        case 'already-exists':
          return new Error('The document already exists');
        case 'unavailable':
          return new Error('The service is currently unavailable. Please try again later');
        case 'resource-exhausted':
          return new Error('Too many requests. Please try again later');
        case 'cancelled':
          return new Error('Operation was cancelled');
        case 'deadline-exceeded':
          return new Error('Operation timed out');
        case 'unauthenticated':
          return new Error('Authentication is required for this operation');
        default:
          return new Error(`Firebase error: ${error.message}`);
      }
    }
    return error instanceof Error ? error : new Error(String(error));
  }

  private async rollbackTransaction(tx: SQLTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        'ROLLBACK',
        [],
        () => resolve(),
        (_, error) => {
          console.error('Failed to rollback transaction:', error);
          reject(new Error(`Failed to rollback transaction: ${error.message}`));
          return false;
        }
      );
    });
  }
}
