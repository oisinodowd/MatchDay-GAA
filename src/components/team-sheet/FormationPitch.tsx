'use client';

import { useState } from 'react';
import { type Player } from '@/stores/match-store';

// Correct GAA formation: 1 GK, 3 full-backs, 3 half-backs, 2 midfielders, 3 half-forwards, 3 full-forwards = 15 players
interface FormationSlot {
  label: string;
  top: string;   // % from top of pitch
  left: string;  // % from left of pitch
}

const FORMATION_SLOTS: FormationSlot[] = [
  // Row 0: Goalkeeper (near own goal, bottom of pitch when attacking upward)
  { label: 'GK', top: '90%', left: '50%' },
  // Row 1: Full-back line (3 players)
  { label: 'FB', top: '78%', left: '22%' },
  { label: 'FB', top: '78%', left: '50%' },
  { label: 'FB', top: '78%', left: '78%' },
  // Row 2: Half-back line (3 players)
  { label: 'HB', top: '62%', left: '22%' },
  { label: 'HB', top: '62%', left: '50%' },
  { label: 'HB', top: '62%', left: '78%' },
  // Row 3: Midfield (2 players)
  { label: 'MID', top: '46%', left: '33%' },
  { label: 'MID', top: '46%', left: '67%' },
  // Row 4: Half-forward line (3 players)
  { label: 'HF', top: '30%', left: '22%' },
  { label: 'HF', top: '30%', left: '50%' },
  { label: 'HF', top: '30%', left: '78%' },
  // Row 5: Full-forward line (3 players)
  { label: 'FF', top: '14%', left: '22%' },
  { label: 'FF', top: '14%', left: '50%' },
  { label: 'FF', top: '14%', left: '78%' },
];

interface FormationPitchProps {
  players: Player[];
  teamSide: 'home' | 'away';
  /** If true, show as a compact preview (smaller circles) */
  compact?: boolean;
  /** If true, slots become drop targets for drag-and-drop position assignment */
  interactive?: boolean;
  /** Called when a player is dropped on a formation slot */
  onDropPlayer?: (slotIndex: number, playerIndex: number) => void;
}

/**
 * Maps players to formation slots based on their position.
 * - GK → goalkeeper slot
 * - DEF → fills FB then HB slots (3 each = 6 total)
 * - MID → fills MID slots (2 total)
 * - FWD → fills HF then FF slots (3 each = 6 total)
 * Unassigned starters fill remaining empty slots.
 */
function mapPlayersToFormation(players: Player[]): (Player | null)[] {
  const starters = players.filter(p => p.isStarter);
  
  const gk = starters.find(p => p.position === 'GK');
  const defs = starters.filter(p => p.position === 'DEF' && p.id !== gk?.id);
  const mids = starters.filter(p => p.position === 'MID');
  const fwds = starters.filter(p => p.position === 'FWD');

  // 0: GK, 1-3: FB, 4-6: HB, 7-8: MID, 9-11: HF, 12-14: FF
  const formation: (Player | null)[] = new Array(15).fill(null);

  // Place GK
  formation[0] = gk || null;

  // Place DEF → first 3 go to FB (index 1-3), next 3 go to HB (index 4-6)
  for (let i = 0; i < defs.length && i < 6; i++) {
    formation[1 + i] = defs[i];
  }

  // Place MID → slots 7-8
  for (let i = 0; i < mids.length && i < 2; i++) {
    formation[7 + i] = mids[i];
  }

  // Place FWD → first 3 go to HF (index 9-11), next 3 go to FF (index 12-14)
  for (let i = 0; i < fwds.length && i < 6; i++) {
    formation[9 + i] = fwds[i];
  }

  // Fill remaining empty slots with unassigned starters
  const assigned = new Set([
    gk?.id,
    ...defs.map(d => d.id),
    ...mids.map(m => m.id),
    ...fwds.map(f => f.id),
  ]);
  const remaining = starters.filter(p => !assigned.has(p.id));
  
  for (let i = 0; i < formation.length && remaining.length > 0; i++) {
    if (formation[i] === null) {
      formation[i] = remaining.shift()!;
    }
  }

  // Fill any still-null slots from starters by list order
  const stillRemaining = starters.filter(p => !formation.find(fp => fp?.id === p.id));
  for (let i = 0; i < formation.length && stillRemaining.length > 0; i++) {
    if (formation[i] === null) {
      formation[i] = stillRemaining.shift()!;
    }
  }

  return formation;
}

export default function FormationPitch({ players, teamSide, compact = false, interactive = false, onDropPlayer }: FormationPitchProps) {
  const formationPlayers = mapPlayersToFormation(players);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const teamColor = teamSide === 'home'
    ? { border: 'border-blue-400', bg: 'bg-blue-500/90', text: 'text-blue-600' }
    : { border: 'border-red-400', bg: 'bg-red-500/90', text: 'text-red-600' };

  const circleSize = compact ? 'w-7 h-7' : 'w-10 h-10';
  const nameSize = compact ? 'text-[8px]' : 'text-[10px]';
  const numberSize = compact ? 'text-[9px]' : 'text-xs';

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    if (!interactive) return;
    if (!e.dataTransfer.types.includes('application/x-player-index')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredSlot(slotIndex);
  };

  const handleDragLeave = () => {
    setHoveredSlot(null);
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    if (!interactive || !onDropPlayer) return;
    e.preventDefault();
    setHoveredSlot(null);
    const playerIndex = parseInt(e.dataTransfer.getData('application/x-player-index'));
    if (!isNaN(playerIndex)) {
      onDropPlayer(slotIndex, playerIndex);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
      {/* Pitch Image Background */}
      <img
        src="/gaa-pitch.png"
        alt="GAA Pitch"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/15" />

      {/* Formation Overlay */}
      <div className="absolute inset-0">
        {/* Attacking direction arrow */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2">
          <span className="text-[9px] font-semibold text-white/70 drop-shadow-md">
            ↑ Attacking
          </span>
        </div>

        {FORMATION_SLOTS.map((slot, index) => {
          const player = formationPlayers[index];
          const isHovered = hoveredSlot === index;

          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ top: slot.top, left: slot.left }}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Player circle */}
              {player ? (
                <div
                  className={`${circleSize} rounded-full border-2 ${teamColor.border} ${teamColor.bg} flex items-center justify-center shadow-lg transition-all duration-150 pointer-events-none ${
                    isHovered ? 'scale-125 ring-4 ring-green-400/70' : ''
                  }`}
                  style={{
                    boxShadow: isHovered ? '0 0 16px rgba(34,197,94,0.6), 0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  <span className={`${numberSize} font-black text-white drop-shadow-md`}>
                    {player.number}
                  </span>
                </div>
              ) : (
                <div
                  className={`${circleSize} rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-150 pointer-events-none ${
                    isHovered
                      ? 'scale-125 border-green-400 border-solid bg-green-500/30 ring-4 ring-green-400/70'
                      : 'border-dashed border-white/30 bg-white/10'
                  }`}
                  style={{
                    boxShadow: isHovered ? '0 0 16px rgba(34,197,94,0.6)' : undefined,
                  }}
                >
                  {isHovered && (
                    <span className="text-[10px] font-bold text-green-300 drop-shadow-md">+</span>
                  )}
                </div>
              )}

              {/* Player name */}
              {player && (
                <span
                  className={`${nameSize} font-semibold text-white text-center leading-tight mt-0.5 max-w-[60px] truncate px-0.5 pointer-events-none`}
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)' }}
                >
                  {player.name || `#${player.number}`}
                </span>
              )}

              {/* Position label */}
              <span className="text-[7px] font-bold text-white/50 uppercase tracking-wider drop-shadow-sm pointer-events-none">
                {slot.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Maps players to formation slot indices (returns player array index at each slot, or null).
 * Used by TeamSheetBuilder for swap logic when drag-dropping onto slots.
 */
export function mapPlayersToFormationIndices(players: Player[]): (number | null)[] {
  const formation = mapPlayersToFormation(players);
  return formation.map(player => {
    if (!player) return null;
    return players.findIndex(p => p.id === player.id);
  });
}

export { FORMATION_SLOTS };
