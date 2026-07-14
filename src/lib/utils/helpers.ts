import { Player, Team } from '@/stores/match-store';

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const DEFAULT_POSITIONS = ['GK', 'DEF', 'MID', 'FWD'] as const;

export type PositionType = typeof DEFAULT_POSITIONS[number];

export function createDefaultPlayer(name: string, number: number, position?: string): Player {
  return {
    id: generateId(),
    name,
    number,
    position: position || (number <= 11 ? 'DEF' : number <= 14 ? 'MID' : 'FWD'),
    isStarter: number <= 15,
    goals: 0,
    points: 0,
    yellowCards: 0,
    blackCards: 0,
    redCards: 0,
    isSubstituted: false,
    photoUrl: '',
  };
}

export function createDefaultTeam(name: string): Team {
  const players: Player[] = [];
  
  // Create 21 default players (15 starters + 6 subs)
  for (let i = 1; i <= 21; i++) {
    let position: string = 'SUB';
    if (i === 1) position = 'GK';
    else if (i <= 8) position = 'DEF';
    else if (i <= 12) position = 'MID';
    else position = 'FWD';
    
    players.push(createDefaultPlayer(`Player ${i}`, i, position));
  }
  
  return {
    id: generateId(),
    name,
    shortCode: name.substring(0, 3).toUpperCase(),
    goals: 0,
    points: 0,
    players,
  };
}

export function validateTeamPlayers(players: Player[]): string[] {
  const errors: string[] = [];
  
  if (players.length < 15) {
    errors.push('Need at least 15 players');
  }
  
  const numbers = new Set<number>();
  const names = new Set<string>();
  
  players.forEach((player, index) => {
    if (!player.name.trim()) {
      errors.push(`Player ${index + 1} has no name`);
    }
    
    if (numbers.has(player.number)) {
      errors.push(`Duplicate jersey number ${player.number}`);
    }
    numbers.add(player.number);
    
    if (player.number < 1 || player.number > 99) {
      errors.push(`Player ${player.name || index + 1} has invalid number ${player.number}`);
    }
    
    names.add(player.name.toLowerCase());
  });
  
  const starters = players.filter(p => p.isStarter);
  if (starters.length < 15) {
    errors.push(`Need at least 15 starters, have ${starters.length}`);
  }
  
  return errors;
}
