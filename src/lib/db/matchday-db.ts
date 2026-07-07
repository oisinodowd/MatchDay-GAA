import Dexie, { Table } from 'dexie';

// Types for offline storage
export interface MatchDraft {
  id?: string;
  competitionId?: string;
  teamHome: TeamData;
  teamAway: TeamData;
  status: 'draft' | 'active' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface TeamData {
  id?: string;
  name: string;
  shortCode?: string;
  goals: number;
  points: number;
  players: PlayerLineup[];
}

export interface PlayerLineup {
  id?: string;
  playerId?: string;
  name: string;
  number: number;
  position?: string;
  isStarter: boolean;
  goals: number;
  points: number;
  yellowCards: number;
  blackCards: number;
  redCards: number;
}

export interface MatchEvent {
  id?: string;
  matchId: string;
  type: 'score' | 'yellow_card' | 'black_card' | 'red_card' | 'substitution' | 'note';
  teamSide: 'home' | 'away';
  playerIndex?: number;
  minute: number;
  half: 'first-half' | 'second-half';
  details?: {
    subtype?: 'goal' | 'point' | 'free' | '65-meter' | '40m-point';
    isTwoPoint?: boolean;
    cardType?: 'yellow' | 'black' | 'red';
    playerOutIndex?: number;
  };
  timestamp: number;
}

export interface SyncQueueItem {
  id?: string;
  type: 'match' | 'event' | 'player';
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: number;
  syncedAt?: number;
  priority: number;
}

export interface MatchStats {
  homeGoals: number;
  homePoints: number;
  awayGoals: number;
  awayPoints: number;
  totalEvents: number;
  lastEventMinute?: number;
}

// Dexie Database Definition
class MatchDayDatabase extends Dexie {
  matches!: Table<MatchDraft, string>;
  events!: Table<MatchEvent, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  stats!: Table<MatchStats, string>;

  constructor() {
    super('MatchDayDB');
    
    this.version(1).stores({
      matches: 'id, status, createdAt, updatedAt',
      events: 'id, matchId, minute, half, type, timestamp',
      syncQueue: 'id, type, action, createdAt, syncedAt, priority',
      stats: 'id'
    });
  }
}

// Singleton instance
export const db = new MatchDayDatabase();

// Helper functions
export async function createMatch(teamHome: TeamData, teamAway: TeamData): Promise<string> {
  const matchId = crypto.randomUUID();
  
  await db.transaction('rw', db.matches, db.events, async () => {
    await db.matches.add({
      id: matchId,
      teamHome,
      teamAway,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // Add initial event
    await db.events.add({
      id: crypto.randomUUID(),
      matchId,
      type: 'note',
      teamSide: 'home',
      minute: 0,
      half: 'first-half',
      details: { subtype: 'goal' },
      timestamp: Date.now()
    });
  });
  
  return matchId;
}

export async function getMatch(matchId: string): Promise<MatchDraft | undefined> {
  return await db.matches.get(matchId);
}

export async function getEvents(matchId: string): Promise<MatchEvent[]> {
  return await db.events.where('matchId').equals(matchId).sortBy('minute');
}

export async function addEvent(event: Omit<MatchEvent, 'id' | 'timestamp'>): Promise<string> {
  const id = crypto.randomUUID();
  
  await db.transaction('rw', db.matches, db.events, db.syncQueue, async () => {
    await db.events.add({
      ...event,
      id,
      timestamp: Date.now()
    });
    
    // Queue for sync if online
    await db.syncQueue.add({
      type: 'event',
      action: 'create',
      data: event,
      createdAt: Date.now(),
      priority: 1
    });
  });
  
  return id;
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<void> {
  await db.syncQueue.add({
    ...item,
    createdAt: Date.now()
  });
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return await db.syncQueue.where('syncedAt').above(-1).sortBy('priority');
}

export async function markAsSynced(itemId: string): Promise<void> {
  await db.syncQueue.update(itemId, { syncedAt: Date.now() });
}

// Initialize database
export async function initDB(): Promise<void> {
  try {
    await db.open();
    console.log('✅ MatchDayDB initialized');
  } catch (error) {
    console.error('❌ Failed to initialize DB:', error);
  }
}
