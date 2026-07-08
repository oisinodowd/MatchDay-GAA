import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type MatchStatus = 'draft' | 'first-half' | 'halftime' | 'second-half' | 'completed' | 'postponed' | 'cancelled';
export type SportType = 'gaelic-football' | 'hurling';
export type EventTypes = 'score' | 'yellow_card' | 'black_card' | 'red_card' | 'substitution' | 'note' | 'free_taken' | 'point_wide' | 'goal_wide';

export interface Team {
  id?: string;
  name: string;
  shortCode?: string;
  goals: number;
  points: number;
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
}

export interface MatchEvent {
  id?: string;
  type: EventTypes;
  teamSide: 'home' | 'away';
  playerIndex?: number;
  minute: number;
  half: 'first-half' | 'second-half' | 'extra-time-1' | 'extra-time-2';
  details?: {
    subtype?: 'goal' | 'point' | 'free' | '65-meter' | '40m-point';
    isTwoPoint?: boolean;
    cardType?: 'yellow' | 'black' | 'red';
    playerOutIndex?: number;
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
  createMatch: (homeTeam: Team, awayTeam: Team, sport: SportType) => void;
  startMatch: () => void;
  endHalf: () => void;
  completeMatch: () => void;
  
  // Scoring
  addScore: (teamSide: 'home' | 'away', subtype: 'goal' | 'point' | 'free' | '65-meter' | '40m-point', playerIndex?: number, isTwoPoint?: boolean) => void;
  
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

      createMatch: (homeTeam: Team, awayTeam: Team, sport: SportType) => {
        const newMatch: Match = {
          teamHome: { ...homeTeam, goals: 0, points: 0 },
          teamAway: { ...awayTeam, goals: 0, points: 0 },
          sport,
          status: 'draft',
          halfDuration: 30,
          currentMinute: 0,
          currentHalf: 'first-half',
          events: [],
        };
        
        set({ match: newMatch, isMatchActive: false });
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

      addScore: (teamSide: 'home' | 'away', subtype: 'goal' | 'point' | 'free' | '65-meter' | '40m-point', playerIndex?: number, isTwoPoint = false) => {
        set((state) => {
          if (!state.match) return state;
          
          const newMatch = { ...state.match };
          const homeTeam = { ...newMatch.teamHome };
          const awayTeam = { ...newMatch.teamAway };
          
          // Update scores based on subtype
          if (subtype === 'goal') {
            if (teamSide === 'home') homeTeam.goals++;
            else awayTeam.goals++;
          } else {
            // Points (including 40m two-point scores)
            const pointsValue = isTwoPoint ? 2 : 1;
            if (teamSide === 'home') homeTeam.points += pointsValue;
            else awayTeam.points += pointsValue;
          }
          
          newMatch.teamHome = homeTeam;
          newMatch.teamAway = awayTeam;
          
          // Add event
          const event: MatchEvent = {
            type: 'score',
            teamSide,
            playerIndex,
            minute: newMatch.currentMinute,
            half: newMatch.currentHalf,
            details: { subtype, isTwoPoint }
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
          
          // This is a simplified version - in reality you'd need proper player arrays
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
          
          const event: MatchEvent = {
            type: 'substitution',
            teamSide,
            playerIndex: playerOutIndex,
            minute: newMatch.currentMinute,
            half: newMatch.currentHalf,
            details: { playerOutIndex }
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
          const homeTeam = { ...newMatch.teamHome };
          const awayTeam = { ...newMatch.teamAway };
          
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
      partialize: (state) => ({ 
        match: state.match,
        isMatchActive: state.isMatchActive 
      }),
    }
  )
);

// Export undo stack for testing/debugging
export const getUndoStack = () => [...undoStack];
