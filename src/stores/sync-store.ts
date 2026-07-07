import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'queued' | 'connected';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt?: number;
  error?: string;
  
  // Actions
  setStatus: (status: SyncStatus) => void;
  setPendingCount: (count: number) => void;
  setError: (error?: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      status: 'idle',
      pendingCount: 0,
      lastSyncedAt: undefined,
      error: undefined,

      setStatus: (status) => set({ status }),
      setPendingCount: (pendingCount) => set({ pendingCount }),
      setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
      clearError: () => set({ error: undefined, status: 'idle' }),
      
      reset: () => set({
        status: 'idle',
        pendingCount: 0,
        lastSyncedAt: undefined,
        error: undefined
      })
    }),
    {
      name: 'matchday-sync-storage'
    }
  )
);
