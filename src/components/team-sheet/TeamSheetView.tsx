'use client';

import { useMatchStore, Player } from '@/stores/match-store';
import { useState } from 'react';
import { User, Shield, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface TeamSheetViewProps {
  teamSide: 'home' | 'away';
}

export default function TeamSheetView({ teamSide }: TeamSheetViewProps) {
  const match = useMatchStore((s) => s.match);
  
  if (!match) return null;
  
  const team = teamSide === 'home' ? match.teamHome : match.teamAway;
  const players = team.players || [];
  
  const starters = players.filter(p => p.isStarter);
  const substitutes = players.filter(p => !p.isStarter);
  
  return (
    <div className="card-elevated p-5">
      {/* Team Header */}
      <h3 className={`text-lg font-bold mb-4 ${teamSide === 'home' ? 'text-blue-600' : 'text-red-600'}`}>
        {team.name}
      </h3>

      {/* Formation Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider text-gray-500`}>Squad</span>
          <span className="text-xs text-gray-500">{starters.length} starters, {substitutes.length} subs</span>
        </div>
        
        {/* Visual Formation */}
        <div className="grid grid-cols-4 gap-1">
          {starters.slice(0, 15).map((player, index) => (
            <PlayerBadge key={player.id || index} player={player} isStarter />
          ))}
          {substitutes.map((player, index) => (
            <PlayerBadge key={player.id || `sub-${index}`} player={player} isStarter={false} />
          ))}
        </div>
      </div>

      {/* Starters List */}
      {starters.length > 0 && (
        <div className="mb-4">
          <h4 className={`text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2`}>
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
          <h4 className={`text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2`}>
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

interface PlayerBadgeProps {
  player: Player;
  isStarter: boolean;
}

function PlayerBadge({ player, isStarter }: PlayerBadgeProps) {
  const positionColor = getPositionColor(player.position);
  
  return (
    <div className={`flex flex-col items-center p-1.5 rounded text-xs ${isStarter ? 'bg-white border' : 'bg-gray-100'} ${positionColor.border}`}>
      {/* Photo or Initial */}
      {player.photoUrl ? (
        <img src={player.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover mb-0.5" />
      ) : (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${positionColor.bg}`}>
          {(player.number).toString()[0]}
        </div>
      )}
      
      {/* Number */}
      <span className="font-bold">{player.number}</span>
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
          <span className={`text-sm font-medium truncate ${!player.isStarter ? 'text-gray-500' : ''}`}>
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
