import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { SyncService } from '../services/database/sync';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  startSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(!!state.isConnected);
    });

    // Initial network check
    NetInfo.fetch().then((state) => {
      setIsOnline(!!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Auto-sync when coming back online
    if (isOnline && lastSyncTime === null) {
      startSync();
    }
  }, [isOnline]);

  const startSync = async () => {
    if (isSyncing || !isOnline) return;

    try {
      setIsSyncing(true);
      setSyncError(null);

      const syncService = SyncService.getInstance();
      await syncService.syncToBackend();

      setLastSyncTime(new Date());
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const value = {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncError,
    startSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}
