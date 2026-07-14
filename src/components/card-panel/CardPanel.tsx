'use client';

import { useState, useMemo } from 'react';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { AlertTriangle, ShieldAlert, XCircle } from 'lucide-react';

interface CardPanelProps {
  teamSide: 'home' | 'away';
  teamName: string;
}

type CardType = 'yellow' | 'black' | 'red';

const CARD_CONFIG: Record<CardType, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  yellow: {
    label: 'Yellow',
    color: 'bg-yellow-400 hover:bg-yellow-500 text-black',
    icon: <AlertTriangle className="w-8 h-8" />,
    description: 'Caution',
  },
  black: {
    label: 'Black (Sin Bin)',
    color: 'bg-gray-900 hover:bg-gray-800 text-white',
    icon: <ShieldAlert className="w-8 h-8" />,
    description: '10 min Sin Bin',
  },
  red: {
    label: 'Red',
    color: 'bg-red-600 hover:bg-red-700 text-white',
    icon: <XCircle className="w-8 h-8" />,
    description: 'Dismissal',
  },
};

export default function CardPanel({ teamSide, teamName }: CardPanelProps) {
  const addCard = useMatchStore((s) => s.addCard);
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [cardReason, setCardReason] = useState('');

  // Get real team players from match store
  const players = useMemo(() => {
    if (!match) return [];
    const team = teamSide === 'home' ? match.teamHome : match.teamAway;
    return team.players || [];
  }, [match, teamSide]);

  // Fallback to mock players if no real players exist (for backward compatibility)
  const displayPlayers = players.length > 0 
    ? players 
    : Array.from({ length: 21 }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Player ${i + 1}`,
        number: i + 1,
        isStarter: i < 15,
      }));

  const handleIssueCard = (type: CardType) => {
    if (!selectedPlayer) return;

    const playerIndex = parseInt(selectedPlayer.replace('p', '')) - 1;
    
    addCard(teamSide, type, playerIndex);

    // Check cumulative black cards for this player (UR-055: Two blacks = red)
    if (type === 'black' && match) {
      const blackCards = match.events.filter(
        (e) => e.teamSide === teamSide && e.type === 'black_card' && e.playerIndex === playerIndex
      );
      if (blackCards.length >= 1) {
        alert(`⚠️ ${teamName} player has received their second black card — automatic red card`);
      }
    }

    setSelectedPlayer('');
    setCardReason('');
  };

  return (
    <div className="rounded-xl border p-4">
      {/* Team Header */}
      <h3 className={`mb-3 font-bold text-gaa-green ${rainMode ? 'text-rain-md' : ''}`}>
        {teamName} ({teamSide === 'home' ? 'HOME' : 'AWAY'}) — Cards
      </h3>

      {/* Player Selector */}
      <div className="mb-3">
        <label className={`block mb-1 text-xs font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
          Select Player
        </label>
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className={`w-full rounded-lg border p-2 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        >
          <option value="">— Tap a player —</option>
          {displayPlayers.map((p, idx) => (
            <option key={p.id || `p${idx + 1}`} value={p.id || `p${idx + 1}`}>
              #{p.number} {p.name || `Player ${idx + 1}`} {p.isStarter ? '(S)' : '(Sub)'}
            </option>
          ))}
        </select>
      </div>

      {/* Card Reason */}
      <div className="mb-3">
        <label className={`block mb-1 text-xs font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
          Reason (optional)
        </label>
        <select
          value={cardReason}
          onChange={(e) => setCardReason(e.target.value)}
          className={`w-full rounded-lg border p-2 text-sm ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        >
          <option value="">Select reason...</option>
          <option value="aggressive_foul">Aggressive foul</option>
          <option value="dissent">Dissent</option>
          <option value="tactical_foul">Tactical foul</option>
          <option value="cynical_play">Cynical play</option>
        </select>
      </div>

      {/* Card Buttons — one tap to issue */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(CARD_CONFIG) as [CardType, typeof CARD_CONFIG[CardType]][]).map(
          ([type, config]) => (
            <button
              key={type}
              onClick={() => handleIssueCard(type)}
              disabled={!selectedPlayer}
              className={`flex flex-col items-center justify-center rounded-lg py-4 transition ${
                selectedPlayer ? 'active:scale-95' : 'bg-gray-100 cursor-not-allowed opacity-50'
              } ${rainMode ? 'min-h-[60px]' : ''} ${config.color}`}
            >
              {config.icon}
              <span className={`font-bold mt-1 ${rainMode ? 'text-lg' : ''}`}>{config.label}</span>
              <span className="text-[10px] opacity-75">{config.description}</span>
            </button>
          )
        )}
      </div>

      {/* Sin Bin Timer Display */}
      {selectedPlayer && (
        <div className="mt-3 rounded-lg bg-gray-100 p-2 text-center">
          <p className="text-xs font-semibold">Sin Bin Timer: 10:00</p>
          <p className="text-[10px] text-gray-500">Auto-resets at +10 minutes</p>
        </div>
      )}
    </div>
  );
}
