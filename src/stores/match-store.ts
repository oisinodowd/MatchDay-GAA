import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type MatchStatus = 'draft' | 'first-half' | 'halftime' | 'second-half' | 'completed' | 'postponed' | 'cancelled';
export type SportType = 'gaelic-football' | 'hurling';
export type EventTypes = 'score' | 'yellow_card' | 'black_card' | 'red_card' | 'substitution' | 'note' | 'free_taken' | 'point_wide' | 'goal_wide' | 'miss' | 'mark' | 'turnover';

/**
 * Validate and sanitize a player object. Returns sanitized player or null if invalid.
 */
function validatePlayer(player: Partial<Player>, index: number): Player | null {
  const name = typeof player.name === 'string' && player.name.trim() ? player.name.trim() : `Player ${index + 1}`;
  const number = typeof player.number === 'number' && player.number > 0 ? Math.floor(player.number) : index + 1;
  
  // Validate photoUrl is a valid base64 string or empty
  let photoUrl: string | undefined = player.photoUrl;
  if (photoUrl && !photoUrl.startsWith('data:image/') && !photoUrl.startsWith('http')) {
    photoUrl = undefined; // Corrupted base64, discard it
  }
  
  return {
    id: typeof player.id === 'string' ? player.id : undefined,
    playerId: player.playerId,
    name,
    number,
    position: ['GK', 'DEF', 'MID', 'FWD', 'SUB'].includes(player.position || '') ? player.position : undefined,
    isStarter: typeof player.isStarter === 'boolean' ? player.isStarter : false,
    goals: Math.max(0, typeof player.goals === 'number' ? player.goals : 0),
    points: Math.max(0, typeof player.points === 'number' ? player.points : 0),
    yellowCards: Math.max(0, typeof player.yellowCards === 'number' ? player.yellowCards : 0),
    blackCards: Math.max(0, typeof player.blackCards === 'number' ? player.blackCards : 0),
    redCards: Math.max(0, typeof player.redCards === 'number' ? player.redCards : 0),
    isSubstituted: typeof player.isSubstituted === 'boolean' ? player.isSubstituted : false,
    photoUrl,
  };
}

/**
 * Migrate an old match (without players arrays) to the new format.
 */
function migrateMatchPlayers(match: Match): Match {
  const homeTeam = { ...match.teamHome };
  const awayTeam = { ...match.teamAway };
  
  // Generate default players if team has no players array (30 = 15 starters + 15 subs)
  if (!homeTeam.players || homeTeam.players.length === 0) {
    homeTeam.players = Array.from({ length: 30 }, (_, i) => ({
      id: undefined,
      playerId: undefined,
      name: `Player ${i + 1}`,
      number: i + 1,
      position: i === 0 ? 'GK' : i < 8 ? 'DEF' : i < 12 ? 'MID' : i < 15 ? 'FWD' : 'SUB',
      isStarter: i < 15,
      goals: 0,
      points: 0,
      yellowCards: 0,
      blackCards: 0,
      redCards: 0,
      isSubstituted: false,
      photoUrl: undefined,
    }));
  } else {
    // Validate existing players
    homeTeam.players = homeTeam.players.map((p, i) => validatePlayer(p, i)).filter(Boolean) as Player[];
  }
  
  if (!awayTeam.players || awayTeam.players.length === 0) {
    awayTeam.players = Array.from({ length: 30 }, (_, i) => ({
      id: undefined,
      playerId: undefined,
      name: `Player ${i + 1}`,
      number: i + 1,
      position: i === 0 ? 'GK' : i < 8 ? 'DEF' : i < 12 ? 'MID' : i < 15 ? 'FWD' : 'SUB',
      isStarter: i < 15,
      goals: 0,
      points: 0,
      yellowCards: 0,
      blackCards: 0,
      redCards: 0,
      isSubstituted: false,
      photoUrl: undefined,
    }));
  } else {
    awayTeam.players = awayTeam.players.map((p, i) => validatePlayer(p, i)).filter(Boolean) as Player[];
  }
  
  return { ...match, teamHome: homeTeam, teamAway: awayTeam };
}

export interface Team {
  id?: string;
  name: string;
  shortCode?: string;
  goals: number;
  points: number;
  players: Player[];
}

export interface Player {
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
  isSubstituted: boolean;
  photoUrl?: string;
}

export interface MatchEvent {
  id?: string;
  type: EventTypes;
  teamSide: 'home' | 'away';
  playerIndex?: number;
  playerId?: string;
  minute: number;
  half: 'first-half' | 'second-half' | 'extra-time-1' | 'extra-time-2';
  details?: {
    subtype?: 'goal' | 'point' | 'free' | '65-meter' | '40m-point' | '45-meter';
    isTwoPoint?: boolean;
    missType?: 'point_wide' | 'goal_wide';
    cardType?: 'yellow' | 'black' | 'red';
    playerOutIndex?: number;
    playerOnName?: string;
    playerOnNumber?: number;
    locationX?: number; // 0-100 percentage on pitch width
    locationY?: number; // 0-100 percentage on pitch height
  };
}

export interface Match {
  id?: string;
  competitionId?: string;
  teamHome: Team;
  teamAway: Team;
  sport: SportType;
  status: MatchStatus;
  halfDuration: number; // in minutes
  currentMinute: number;
  currentHalf: 'first-half' | 'second-half';
  events: MatchEvent[];
  venue?: string;
  referee?: string;
}

interface MatchState {
  match: Match | null;
  isMatchActive: boolean;
  
  // Actions
  createMatch: (homeTeam: Team, awayTeam: Team, sport: SportType, halfDuration?: number) => void;
  startMatch: () => void;
  endHalf: () => void;
  completeMatch: () => void;
  
  // Player Management
  updateTeamPlayers: (teamSide: 'home' | 'away', players: Player[]) => void;
  updatePlayerStats: (teamSide: 'home' | 'away', playerIndex: number, updates: Partial<Player>) => void;
  updatePlayerByName: (teamSide: 'home' | 'away', playerName: string, updates: Partial<Player>) => void;
  
  // Scoring
  addScore: (teamSide: 'home' | 'away', subtype: 'goal' | 'point' | 'free' | '65-meter' | '40m-point' | '45-meter', playerIndex?: number, isTwoPoint?: boolean, locationX?: number, locationY?: number) => void;
  
  // Missed shots (wides)
  addMiss: (teamSide: 'home' | 'away', missType: 'point_wide' | 'goal_wide', playerIndex?: number, locationX?: number, locationY?: number) => void;
  
  // Possession metrics
  addMark: (teamSide: 'home' | 'away', playerIndex?: number, locationX?: number, locationY?: number) => void;
  addTurnover: (teamSide: 'home' | 'away', playerIndex?: number, locationX?: number, locationY?: number) => void;
  
  // Cards
  addCard: (teamSide: 'home' | 'away', cardType: 'yellow' | 'black' | 'red', playerIndex: number) => void;
  
  // Substitutions
  substitutePlayer: (teamSide: 'home' | 'away', playerOutIndex: number, playerOnName: string, playerOnNumber: number) => void;
  
  // Undo
  undoLastEvent: () => MatchEvent | null;
  clearUndoStack: () => void;
  
  // Timing
  advanceMinute: () => void;
  setCurrentHalf: (half: 'first-half' | 'second-half') => void;
  
  // Reset
  resetMatch: () => void;
}

// Undo stack for undo functionality
const undoStack: MatchEvent[] = [];

export const useMatchStore = create<MatchState>()(
  persist(
    (set, get) => ({
      match: null,
      isMatchActive: false,

      createMatch: (homeTeam: Team, awayTeam: Team, sport: SportType, halfDuration?: number) => {
        // Validate teams have players arrays
        const validatedHomePlayers = homeTeam.players && homeTeam.players.length > 0 
          ? homeTeam.players.map((p, i) => validatePlayer(p, i)).filter(Boolean) as Player[]
          : Array.from({ length: 21 }, (_, i) => ({
              id: undefined, playerId: undefined, name: `Player ${i + 1}`, number: i + 1,
              position: i === 0 ? 'GK' : i < 8 ? 'DEF' : i < 12 ? 'MID' : i < 15 ? 'FWD' : 'SUB',
              isStarter: i < 15, goals: 0, points: 0, yellowCards: 0, blackCards: 0, redCards: 0,
              isSubstituted: false, photoUrl: undefined,
            }));

        const validatedAwayPlayers = awayTeam.players && awayTeam.players.length > 0 
          ? awayTeam.players.map((p, i) => validatePlayer(p, i)).filter(Boolean) as Player[]
          : Array.from({ length: 21 }, (_, i) => ({
              id: undefined, playerId: undefined, name: `Player ${i + 1}`, number: i + 1,
              position: i === 0 ? 'GK' : i < 8 ? 'DEF' : i < 12 ? 'MID' : i < 15 ? 'FWD' : 'SUB',
              isStarter: i < 15, goals: 0, points: 0, yellowCards: 0, blackCards: 0, redCards: 0,
              isSubstituted: false, photoUrl: undefined,
            }));

        const newMatch: Match = {
          teamHome: { ...homeTeam, goals: 0, points: 0, players: validatedHomePlayers },
          teamAway: { ...awayTeam, goals: 0, points: 0, players: validatedAwayPlayers },
          sport,
          status: 'draft',
          halfDuration: halfDuration || 30,
          currentMinute: 0,
          currentHalf: 'first-half',
          events: [],
        };
        
        set({ match: newMatch, isMatchActive: false });
      },

      updateTeamPlayers: (teamSide: 'home' | 'away', players: Player[]) => {
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          if (teamSide === 'home') {
            newMatch.teamHome = { ...newMatch.teamHome, players };
          } else {
            newMatch.teamAway = { ...newMatch.teamAway, players };
          }
          
          return { match: newMatch };
        });
      },

      updatePlayerStats: (teamSide: 'home' | 'away', playerIndex: number, updates: Partial<Player>) => {
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          const players = [...(teamSide === 'home' ? newMatch.teamHome.players : newMatch.teamAway.players)];
          
          if (players[playerIndex]) {
            players[playerIndex] = { ...players[playerIndex], ...updates };
          }
          
          if (teamSide === 'home') {
            newMatch.teamHome = { ...newMatch.teamHome, players };
          } else {
            newMatch.teamAway = { ...newMatch.teamAway, players };
          }
          
          return { match: newMatch };
        });
      },

      updatePlayerByName: (teamSide: 'home' | 'away', playerName: string, updates: Partial<Player>) => {
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          const players = [...(teamSide === 'home' ? newMatch.teamHome.players : newMatch.teamAway.players)];
          const index = players.findIndex(p => p.name.toLowerCase() === playerName.toLowerCase());
          
          if (index !== -1) {
            players[index] = { ...players[index], ...updates };
          }
          
          if (teamSide === 'home') {
            newMatch.teamHome = { ...newMatch.teamHome, players };
          } else {
            newMatch.teamAway = { ...newMatch.teamAway, players };
          }
          
          return { match: newMatch };
        });
      },

      startMatch: () => {
        const { match } = get();
        if (!match) return;
        
        set({
          match: { ...match, status: 'first-half', currentMinute: 1 },
          isMatchActive: true
        });
      },

      endHalf: () => {
        const { match } = get();
        if (!match) return;

        // Check halftime status FIRST (before checking currentHalf)
        if (match.status === 'halftime') {
          set({
            match: { ...match, status: 'second-half', currentHalf: 'second-half', currentMinute: 0 }
          });
        } else if (match.currentHalf === 'first-half') {
          set({
            match: { ...match, status: 'halftime', currentMinute: match.halfDuration }
          });
        } else {
          set({
            match: { ...match, status: 'completed' },
            isMatchActive: false
          });
        }
      },

      completeMatch: () => {
        set((state) => ({
          match: state.match ? { ...state.match, status: 'completed' } : null,
          isMatchActive: false
        }));
      },

      addScore: (teamSide: 'home' | 'away', subtype: 'goal' | 'point' | 'free' | '65-meter' | '40m-point' | '45-meter', playerIndex?: number, isTwoPoint = false, locationX?: number, locationY?: number) => {
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          const homeTeam = { ...newMatch.teamHome };
          const awayTeam = { ...newMatch.teamAway };
          
          // Validate playerIndex is within bounds before updating player stats
          const players = teamSide === 'home' ? [...homeTeam.players] : [...awayTeam.players];
          const validPlayerIndex = playerIndex !== undefined && playerIndex >= 0 && playerIndex < players.length 
            ? playerIndex 
            : undefined;
          
          // Update team scores
          if (subtype === 'goal') {
            if (teamSide === 'home') homeTeam.goals++;
            else awayTeam.goals++;
          } else {
            const pointsValue = isTwoPoint ? 2 : 1;
            if (teamSide === 'home') homeTeam.points += pointsValue;
            else awayTeam.points += pointsValue;
          }
          
          // Update player stats if valid playerIndex provided
          if (validPlayerIndex !== undefined) {
            if (subtype === 'goal') {
              players[validPlayerIndex].goals++;
            } else {
              players[validPlayerIndex].points += isTwoPoint ? 2 : 1;
            }
            if (teamSide === 'home') homeTeam.players = players;
            else awayTeam.players = players;
          }
          
          newMatch.teamHome = homeTeam;
          newMatch.teamAway = awayTeam;
          
          const event: MatchEvent = {
            type: 'score',
            teamSide,
            playerIndex: validPlayerIndex,
            minute: newMatch.currentMinute,
            half: newMatch.currentHalf,
            details: { 
              subtype, 
              isTwoPoint,
              locationX,
              locationY
            }
          };
          
          newMatch.events = [...newMatch.events, event];
          undoStack.push(event);
          
          return { match: newMatch };
        });
      },

      addMiss: (teamSide: 'home' | 'away', missType: 'point_wide' | 'goal_wide', playerIndex?: number, locationX?: number, locationY?: number) => {
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          
          // Validate playerIndex
          const players = teamSide === 'home' ? [...newMatch.teamHome.players] : [...newMatch.teamAway.players];
          const validPlayerIndex = playerIndex !== undefined && playerIndex >= 0 && playerIndex < players.length 
            ? playerIndex 
            : undefined;
          
          const event: MatchEvent = {
            type: 'miss',
            teamSide,
            playerIndex: validPlayerIndex,
            minute: newMatch.currentMinute,
            half: newMatch.currentHalf,
            details: { 
              missType,
              locationX,
              locationY
            }
          };
          
          newMatch.events = [...newMatch.events, event];
          undoStack.push(event);
          
          return { match: newMatch };
        });
      },

      addMark: (teamSide, playerIndex, locationX, locationY) => {
        set((state) => {
          if (!state.match) return state;
          const newMatch = { ...state.match };
          const players = teamSide === 'home' ? [...newMatch.teamHome.players] : [...newMatch.teamAway.players];
          const validPlayerIndex = playerIndex !== undefined && playerIndex >= 0 && playerIndex < players.length ? playerIndex : undefined;

          const event: MatchEvent = {
            type: 'mark',
            teamSide,
            playerIndex: validPlayerIndex,
            minute: newMatch.currentMinute,
            half: newMatch.currentHalf,
            details: { locationX, locationY },
          };

          newMatch.events = [...newMatch.events, event];
          undoStack.push(event);
          return { match: newMatch };
        });
      },

      addTurnover: (teamSide, playerIndex, locationX, locationY) => {
        set((state) => {
          if (!state.match) return state;
          const newMatch = { ...state.match };
          const players = teamSide === 'home' ? [...newMatch.teamHome.players] : [...newMatch.teamAway.players];
          const validPlayerIndex = playerIndex !== undefined && playerIndex >= 0 && playerIndex < players.length ? playerIndex : undefined;

          const event: MatchEvent = {
            type: 'turnover',
            teamSide,
            playerIndex: validPlayerIndex,
            minute: newMatch.currentMinute,
            half: newMatch.currentHalf,
            details: { locationX, locationY },
          };

          newMatch.events = [...newMatch.events, event];
          undoStack.push(event);
          return { match: newMatch };
        });
      },

      addCard: (teamSide: 'home' | 'away', cardType: 'yellow' | 'black' | 'red', playerIndex: number) => {
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          const homeTeam = { ...newMatch.teamHome };
          const awayTeam = { ...newMatch.teamAway };
          
          // Validate playerIndex is within bounds
          const players = teamSide === 'home' ? [...homeTeam.players] : [...awayTeam.players];
          if (playerIndex >= 0 && playerIndex < players.length) {
            if (cardType === 'yellow') players[playerIndex].yellowCards++;
            else if (cardType === 'black') players[playerIndex].blackCards++;
            else players[playerIndex].redCards++;
            
            if (teamSide === 'home') homeTeam.players = players;
            else awayTeam.players = players;
          } else {
            console.warn(`[matchday-gaa] addCard: playerIndex ${playerIndex} out of bounds for ${teamSide} team`);
          }
          
          newMatch.teamHome = homeTeam;
          newMatch.teamAway = awayTeam;
          
          const event: MatchEvent = {
            type: cardType === 'yellow' ? 'yellow_card' : cardType === 'black' ? 'black_card' : 'red_card',
            teamSide,
            playerIndex,
            minute: newMatch.currentMinute,
            half: newMatch.currentHalf,
            details: { cardType }
          };
          
          newMatch.events = [...newMatch.events, event];
          undoStack.push(event);
          
          return { match: newMatch };
        });
      },

      substitutePlayer: (teamSide: 'home' | 'away', playerOutIndex: number, playerOnName: string, playerOnNumber: number) => {
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          const homeTeam = { ...newMatch.teamHome };
          const awayTeam = { ...newMatch.teamAway };
          const players = teamSide === 'home' ? [...homeTeam.players] : [...awayTeam.players];
          
          // Validate playerOutIndex is within bounds
          if (playerOutIndex < 0 || playerOutIndex >= players.length) {
            console.warn(`[matchday-gaa] substitutePlayer: playerOutIndex ${playerOutIndex} out of bounds for ${teamSide} team`);
            return { match: newMatch };
          }
          
          // Mark outgoing player as substituted
          if (players[playerOutIndex]) {
            players[playerOutIndex].isSubstituted = true;
          }
          
          // Find or create the incoming player on the bench
          const existingSubIndex = players.findIndex(p => p.number === playerOnNumber && !p.isStarter && !p.isSubstituted);
          if (existingSubIndex !== -1) {
            players[existingSubIndex].isStarter = true;
          } else {
            // Add new player to roster
            players.push({
              name: playerOnName,
              number: playerOnNumber,
              position: 'SUB',
              isStarter: true,
              goals: 0,
              points: 0,
              yellowCards: 0,
              blackCards: 0,
              redCards: 0,
              isSubstituted: false,
            });
          }
          
          if (teamSide === 'home') homeTeam.players = players;
          else awayTeam.players = players;
          
          newMatch.teamHome = homeTeam;
          newMatch.teamAway = awayTeam;
          
          const event: MatchEvent = {
            type: 'substitution',
            teamSide,
            playerIndex: playerOutIndex,
            minute: newMatch.currentMinute,
            half: newMatch.currentHalf,
            details: { playerOutIndex, playerOnName, playerOnNumber }
          };
          
          newMatch.events = [...newMatch.events, event];
          undoStack.push(event);
          
          return { match: newMatch };
        });
      },

      undoLastEvent: () => {
        const { match } = get();
        if (!match || undoStack.length === 0) return null;
        
        const lastEvent = undoStack.pop()!;
        
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          let homeTeam = { ...newMatch.teamHome };
          let awayTeam = { ...newMatch.teamAway };
          
          // Reverse the event
          if (lastEvent.type === 'score') {
            if (lastEvent.details?.subtype === 'goal') {
              if (lastEvent.teamSide === 'home') homeTeam.goals--;
              else awayTeam.goals--;
            } else {
              const pointsValue = lastEvent.details?.isTwoPoint ? 2 : 1;
              if (lastEvent.teamSide === 'home') homeTeam.points -= pointsValue;
              else awayTeam.points -= pointsValue;
            }
            
            // Reverse player stats
            if (lastEvent.playerIndex !== undefined) {
              const players = lastEvent.teamSide === 'home' ? [...homeTeam.players] : [...awayTeam.players];
              if (players[lastEvent.playerIndex]) {
                if (lastEvent.details?.subtype === 'goal') {
                  players[lastEvent.playerIndex].goals--;
                } else {
                  players[lastEvent.playerIndex].points -= lastEvent.details?.isTwoPoint ? 2 : 1;
                }
                if (lastEvent.teamSide === 'home') homeTeam.players = players;
                else awayTeam.players = players;
              }
            }
          } else if (['yellow_card', 'black_card', 'red_card'].includes(lastEvent.type)) {
            // Reverse card stats
            if (lastEvent.playerIndex !== undefined) {
              const players = lastEvent.teamSide === 'home' ? [...homeTeam.players] : [...awayTeam.players];
              if (players[lastEvent.playerIndex]) {
                if (lastEvent.details?.cardType === 'yellow') players[lastEvent.playerIndex].yellowCards--;
                else if (lastEvent.details?.cardType === 'black') players[lastEvent.playerIndex].blackCards--;
                else players[lastEvent.playerIndex].redCards--;
                if (lastEvent.teamSide === 'home') homeTeam.players = players;
                else awayTeam.players = players;
              }
            }
          } else if (lastEvent.type === 'miss') {
            // Reverse a miss/wide — just remove the event, no stat changes needed
          } else if (lastEvent.type === 'mark') {
            // Reverse a mark — just remove the event, no stat changes needed
          } else if (lastEvent.type === 'turnover') {
            // Reverse a turnover — just remove the event, no stat changes needed
          } else if (lastEvent.type === 'substitution' && lastEvent.details?.playerOnName !== undefined) {
            // Reverse substitution - mark incoming player as sub again, outgoing as not substituted
            const players = lastEvent.teamSide === 'home' ? [...homeTeam.players] : [...awayTeam.players];
            const incomingIndex = players.findIndex(p => p.name.toLowerCase() === lastEvent.details!.playerOnName!.toLowerCase());
            if (incomingIndex !== -1) {
              players[incomingIndex].isStarter = false;
            }
            if (lastEvent.playerIndex !== undefined && players[lastEvent.playerIndex]) {
              players[lastEvent.playerIndex].isSubstituted = false;
            }
            if (lastEvent.teamSide === 'home') homeTeam.players = players;
            else awayTeam.players = players;
          }
          
          newMatch.teamHome = homeTeam;
          newMatch.teamAway = awayTeam;
          newMatch.events = newMatch.events.slice(0, -1);
          
          return { match: newMatch };
        });
        
        return lastEvent;
      },

      clearUndoStack: () => {
        undoStack.length = 0;
      },

      advanceMinute: () => {
        set((state) => {
          if (!state.match) return state;
          
          const newMinute = Math.min(state.match.currentMinute + 1, state.match.halfDuration);
          
          return {
            match: {
              ...state.match,
              currentMinute: newMinute
            }
          };
        });
      },

      setCurrentHalf: (half) => {
        set((state) => {
          if (!state.match) return state;
          
          return {
            match: {
              ...state.match,
              currentHalf: half,
              currentMinute: 1,
              status: half === 'first-half' ? 'first-half' : 'second-half'
            }
          };
        });
      },

      resetMatch: () => {
        undoStack.length = 0;
        set({ match: null, isMatchActive: false });
      }
    }),
    {
      name: 'matchday-match-storage',
      version: 2, // Incremented to trigger migration from v1 (no players) to v2 (with players)
      migrate: (persistedState: unknown, _version: number) => {
        // Migrate from v1 (no players arrays) to v2 (with players arrays)
        if (typeof persistedState === 'object' && persistedState !== null) {
          const state = persistedState as Record<string, unknown>;
          if (state.match && typeof state.match === 'object') {
            const match = state.match as Match;
            return migrateMatchPlayers(match);
          }
        }
        return persistedState;
      },
      partialize: (state) => ({ 
        match: state.match,
        isMatchActive: state.isMatchActive 
      }),
    }
  )
);

// Export undo stack for testing/debugging
export const getUndoStack = () => [...undoStack];
