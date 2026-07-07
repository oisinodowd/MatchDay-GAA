/**
 * Sync Queue Manager
 * Handles offline-first synchronization between IndexedDB and Supabase
 */

import { db, SyncQueueItem } from './matchday-db';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'queued';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt?: number;
  error?: string;
}

let syncState: SyncState = {
  status: 'idle',
  pendingCount: 0
};

// Check for pending items and update state
export async function checkPendingSync(): Promise<number> {
  const pending = await db.syncQueue.where('syncedAt').above(-1).toArray();
  syncState.pendingCount = pending.length;
  return pending.length;
}

// Sync a single item to Supabase
async function syncItem(item: SyncQueueItem): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    
    switch (item.type) {
      case 'match':
        if (item.action === 'create') {
          const { data, error } = await supabase
            .from('matches')
            .insert(transformMatchData(item.data))
            .select()
            .single();
          
          if (error) throw error;
          
          // Update local match with server ID
          await updateLocalMatchId(item.data.id, data.id);
        } else if (item.action === 'update') {
          const { error } = await supabase
            .from('matches')
            .update(transformMatchData(item.data))
            .eq('id', item.data.id);
          
          if (error) throw error;
        }
        break;
        
      case 'event':
        if (item.action === 'create') {
          const { error } = await supabase
            .from('events')
            .insert(transformEventData(item.data));
          
          if (error) throw error;
        }
        break;
    }
    
    // Mark as synced
    await db.syncQueue.update(item.id!, { syncedAt: Date.now() });
    return true;
  } catch (error) {
    console.error('Sync failed for item:', item.id, error);
    syncState.status = 'error';
    syncState.error = error instanceof Error ? error.message : 'Unknown error';
    return false;
  }
}

// Transform match data from local format to Supabase format
function transformMatchData(data: any) {
  return {
    team_home_id: data.teamHome.id,
    team_away_id: data.teamAway.id,
    status: data.status === 'draft' ? 'scheduled' : data.status,
    // Calculate total scores
    home_score_goals: data.teamHome.goals,
    home_score_points: data.teamHome.points,
    away_score_goals: data.teamAway.goals,
    away_score_points: data.teamAway.points,
    updated_at: new Date().toISOString()
  };
}

// Transform event data from local format to Supabase format
function transformEventData(data: any) {
  return {
    match_id: data.matchId,
    event_type: data.type,
    team_side: data.teamSide,
    minute: data.minute,
    half: data.half,
    // Add other fields as needed
    created_at: new Date().toISOString()
  };
}

// Update local match ID with server-generated ID
async function updateLocalMatchId(localId: string | undefined, serverId: string): Promise<void> {
  if (!localId) return;
  
  const match = await db.matches.get(localId);
  if (match) {
    // Note: Dexie doesn't support key updates easily, so we'd need to handle this differently
    // For now, we'll just update the data
    console.log('Match ID synced:', localId, '->', serverId);
  }
}

// Sync all pending items
export async function syncAllPending(): Promise<{ success: number; failed: number }> {
  const pending = await db.syncQueue.where('syncedAt').above(-1).sortBy('priority');
  
  if (pending.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  syncState.status = 'syncing';
  let success = 0;
  let failed = 0;
  
  for (const item of pending) {
    const result = await syncItem(item);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Update state
    syncState.pendingCount = pending.length - success - failed;
  }
  
  syncState.status = failed > 0 ? 'error' : 'idle';
  syncState.lastSyncedAt = Date.now();
  
  if (failed === 0) {
    syncState.error = undefined;
  }
  
  return { success, failed };
}

// Get current sync state
export function getSyncState(): SyncState {
  return { ...syncState };
}

// Initialize sync listener
export function initSyncListener(): void {
  // Check for pending items periodically
  setInterval(async () => {
    const count = await checkPendingSync();
    
    if (count > 0 && navigator.onLine) {
      console.log(`${count} items pending sync`);
    }
  }, 30000); // Every 30 seconds
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('🟢 Connection restored');
    syncState.status = 'idle';
    syncAllPending();
  });
  
  window.addEventListener('offline', () => {
    console.log('🔴 Connection lost - working offline');
    syncState.status = 'queued';
  });
}
