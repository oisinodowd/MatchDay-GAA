'use client';

import { useMatchStore, type Player } from '@/stores/match-store';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TeamSheetViewProps {
  teamSide: 'home' | 'away';
}

// GAA formation positions: 1 GK, 6 backs, 2 midfield, 6 forwards
const FORMATION_LAYOUT = [
  // Row 0: Goalkeeper
  [{ label: 'GK' }],
  // Row 1: Full-back line (6 across)
  [
    { label: 'FB' }, { label: 'FB' }, { label: 'FB' },
    { label: 'FB' }, { label: 'FB' }, { label: 'FB' },
  ],
  // Row 2: Midfield (2)
  [
    { label: 'MID' }, { label: 'MID' },
  ],
  // Row 3: Half-forward line (3)
  [
    { label: 'FWD' }, { label: 'FWD' }, { label: 'FWD' },
  ],
  // Row 4: Full-forward line (3)
  [
    { label: 'FWD' }, { label: 'FWD' }, { label: 'FWD' },
  ],
];

export default function TeamSheetView({ teamSide }: TeamSheetViewProps) {
  const match = useMatchStore((s) => s.match);

  if (!match) return null;

  const team = teamSide === 'home' ? match.teamHome : match.teamAway;
  const players = team.players || [];

  const starters = players.filter(p => p.isStarter);
  const substitutes = players.filter(p => !p.isStarter);

  // Map starters to formation positions respecting their assigned positions
  const gk = starters.find(p => p.position === 'GK');
  const defs = starters.filter(p => p.position === 'DEF' && p.id !== gk?.id);
  const mids = starters.filter(p => p.position === 'MID');
  const fwds = starters.filter(p => p.position === 'FWD');
  
  // Build formation array: 1 GK, 6 DEF, 2 MID, 6 FWD
  const formationPlayers: (Player | null)[] = [
    gk || starters[0] || null,
    ...defs.slice(0, 6),
    ...Array(Math.max(0, 6 - defs.length)).fill(null),
    ...mids.slice(0, 2),
    ...Array(Math.max(0, 2 - mids.length)).fill(null),
    ...fwds.slice(0, 6),
    ...Array(Math.max(0, 6 - fwds.length)).fill(null),
  ].slice(0, 15);
  
  // Fill remaining slots from unassigned starters
  let remainingStarters = starters.filter(p => {
    return p.id !== gk?.id && !defs.find(d => d.id === p.id) && !mids.find(m => m.id === p.id) && !fwds.find(f => f.id === p.id);
  });
  for (let i = 0; i < formationPlayers.length && remainingStarters.length > 0; i++) {
    if (formationPlayers[i] === null) {
      formationPlayers[i] = remainingStarters.shift()!;
    }
  }

  const teamColor = teamSide === 'home' ? 'border-blue-500 text-blue-700' : 'border-red-500 text-red-700';
  const teamBg = teamSide === 'home' ? 'bg-blue-50' : 'bg-red-50';

  return (
    <div className="card-elevated p-5">
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${teamSide === 'home' ? 'text-blue-600' : 'text-red-600'}`}>
          {team.name}
        </h3>
        <span className="text-xs text-gray-500">
          {starters.length} starters · {substitutes.length} subs
        </span>
      </div>

      {/* GAA Formation Pitch View */}
      <div className="relative mb-6 p-4 bg-green-100 rounded-xl border-2 border-green-300">
        {/* Pitch markings */}
        <div className="absolute inset-2 border-2 border-green-400/40 rounded-lg pointer-events-none" />
        <div className="absolute left-2 right-2 top-[45%] border-t-2 border-green-400/40 pointer-events-none" />
        <div className="absolute left-[25%] right-[25%] top-[20%] bottom-[20%] border border-green-400/30 rounded-full pointer-events-none" />

        {/* Pitch label */}
        <p className="text-center text-xs text-green-700 font-semibold mb-4">← Attacking Direction</p>

        {/* Formation Grid */}
        <div className="relative" style={{ minHeight: '320px' }}>
          {FORMATION_LAYOUT.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1 mb-3">
              {row.map((pos, colIdx) => {
                const flatIndex = FORMATION_LAYOUT.slice(0, rowIdx).reduce((sum, r) => sum + r.length, 0) + colIdx;
                const player = formationPlayers[flatIndex];

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`w-[60px] flex flex-col items-center`}
                  >
                    {/* Player circle with number */}
                    {player ? (
                      <div className={`w-10 h-10 rounded-full border-2 ${teamColor} ${teamBg} flex items-center justify-center shadow-sm`}>
                        <span className="text-xs font-bold">{player.number}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center" />
                    )}
                    {/* Player name */}
                    {player && (
                      <span className="text-[10px] font-medium text-gray-800 text-center leading-tight mt-0.5 truncate w-full">
                        {player.name || `#${player.number}`}
                      </span>
                    )}
                    {/* Position label */}
                    <span className="text-[8px] text-gray-400 font-semibold uppercase">
                      {pos.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Starters List */}
      {starters.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Starting Lineup
          </h4>
          <div className="space-y-1">
            {starters.map((player, index) => (
              <PlayerRow key={player.id || index} player={player} />
            ))}
          </div>
        </div>
      )}

      {/* Substitutes List */}
      {substitutes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Substitutes
          </h4>
          <div className="space-y-1">
            {substitutes.map((player, index) => (
              <PlayerRow key={player.id || `sub-${index}`} player={player} />
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <button className="w-full mt-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
        Export Team Sheet
      </button>
    </div>
  );
}

interface PlayerRowProps {
  player: Player;
}

function PlayerRow({ player }: PlayerRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Photo */}
      {player.photoUrl ? (
        <img src={player.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">{player.number}</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-gray-500">#{player.number}</span>
          <span className={`text-sm font-medium truncate text-gray-900 ${!player.isStarter ? 'text-gray-500' : ''}`}>
            {player.name || 'Unnamed'}
          </span>
        </div>

        {expanded && (
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className={`px-1.5 py-0.5 rounded ${getPositionColor(player.position).bg} text-white`}>
              {player.position || 'SUB'}
            </span>
            {player.isStarter && <span className="text-green-600">Starter</span>}
          </div>
        )}
      </div>

      {/* Expand Button */}
      <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-200 rounded">
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </div>
  );
}

function getPositionColor(position?: string): { bg: string; border: string } {
  switch (position) {
    case 'GK': return { bg: 'bg-yellow-400', border: 'border-yellow-200' };
    case 'DEF': return { bg: 'bg-blue-500', border: 'border-blue-200' };
    case 'MID': return { bg: 'bg-green-500', border: 'border-green-200' };
    case 'FWD': return { bg: 'bg-red-500', border: 'border-red-200' };
    default: return { bg: 'bg-gray-400', border: 'border-gray-200' };
  }
}
