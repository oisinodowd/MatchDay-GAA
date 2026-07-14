'use client';

import { useState, useMemo } from 'react';
import { useMatchStore, Player } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ArrowDownUp, HeartPulse } from 'lucide-react';

interface SubstitutionPanelProps {
  teamSide: 'home' | 'away';
  teamName: string;
}

export default function SubstitutionPanel({ teamSide, teamName }: SubstitutionPanelProps) {
  const substitutePlayer = useMatchStore((s) => s.substitutePlayer);
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';

  const [outPlayer, setOutPlayer] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');
  const [inPlayerNumber, setInPlayerNumber] = useState('');
  const [isBloodSub, setIsBloodSub] = useState(false);

  // Get real team players from match store
  const teamPlayers = useMemo(() => {
    if (!match) return [];
    const team = teamSide === 'home' ? match.teamHome : match.teamAway;
    return team.players || [];
  }, [match, teamSide]);

  // Split into starters and substitutes from real data
  const starters: Player[] = useMemo(() => {
    if (teamPlayers.length > 0) {
      return teamPlayers.filter(p => p.isStarter);
    }
    // Fallback mock data
    return Array.from({ length: 15 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      number: i + 1,
      isStarter: true,
    } as Player));
  }, [teamPlayers]);

  const substitutes: Player[] = useMemo(() => {
    if (teamPlayers.length > 0) {
      return teamPlayers.filter(p => !p.isStarter);
    }
    // Fallback mock data
    return Array.from({ length: 6 }, (_, i) => ({
      id: `sub${i + 1}`,
      name: `Sub ${i + 1}`,
      number: 16 + i,
      isStarter: false,
    } as Player));
  }, [teamPlayers]);

  const handleSub = () => {
    if (!outPlayer || !inPlayerName || !inPlayerNumber) return;

    // Find the actual player index from starters
    let playerOutIndex = -1;
    if (outPlayer.startsWith('p')) {
      playerOutIndex = parseInt(outPlayer.replace('p', '')) - 1;
    } else {
      // Match by name/number in real players
      const selectedStarter = starters.find(p => p.id === outPlayer);
      if (selectedStarter) {
        playerOutIndex = teamPlayers.findIndex(tp => tp.id === selectedStarter.id || 
          (tp.name.toLowerCase() === selectedStarter.name.toLowerCase() && tp.number === selectedStarter.number));
      }
    }

    const actualOutIndex = playerOutIndex >= 0 ? playerOutIndex : 0;
    const playerOnNumber = parseInt(inPlayerNumber);

    substitutePlayer(teamSide, actualOutIndex, inPlayerName, playerOnNumber);

    // Reset form
    setOutPlayer('');
    setInPlayerName('');
    setInPlayerNumber('');
    setIsBloodSub(false);
  };

  return (
    <div className="rounded-xl border p-4">
      {/* Team Header */}
      <h3 className={`mb-3 font-bold text-gaa-green ${rainMode ? 'text-rain-md' : ''}`}>
        {teamName} ({teamSide === 'home' ? 'HOME' : 'AWAY'}) — Substitutions
      </h3>

      {/* Outgoing Player */}
      <div className="mb-3">
        <label className={`block mb-1 text-xs font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
          Player OFF
        </label>
        <select
          value={outPlayer}
          onChange={(e) => setOutPlayer(e.target.value)}
          className={`w-full rounded-lg border p-2 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        >
          <option value="">Select player off...</option>
          {starters.map((p, idx) => (
            <option key={p.id || `p${idx + 1}`} value={p.id || `p${idx + 1}`}>#{p.number} {p.name || `Player ${idx + 1}`}</option>
          ))}
        </select>
      </div>

      {/* Swap Arrow */}
      <div className="flex justify-center my-2">
        <ArrowDownUp className={`w-8 h-8 text-gaa-green ${rainMode ? 'w-10 h-10' : ''}`} />
      </div>

      {/* Incoming Player Name */}
      <div className="mb-3">
        <label className={`block mb-1 text-xs font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
          Player ON — Name
        </label>
        <input
          type="text"
          value={inPlayerName}
          onChange={(e) => setInPlayerName(e.target.value)}
          placeholder="Enter player name..."
          className={`w-full rounded-lg border p-2 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        />
      </div>

      {/* Incoming Player Number */}
      <div className="mb-3">
        <label className={`block mb-1 text-xs font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
          Player ON — Number
        </label>
        <select
          value={inPlayerNumber}
          onChange={(e) => setInPlayerNumber(e.target.value)}
          className={`w-full rounded-lg border p-2 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        >
          <option value="">Select number...</option>
          {substitutes.map((p, idx) => (
            <option key={p.id || `sub${idx + 1}`} value={p.number}>#{p.number} {p.name || `Sub ${idx + 1}`}</option>
          ))}
        </select>
      </div>

      {/* Blood Substitution Toggle */}
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isBloodSub}
          onChange={(e) => setIsBloodSub(e.target.checked)}
          className="w-5 h-5 accent-red-600"
        />
        <HeartPulse className={`w-4 h-4 text-red-600 ${rainMode ? 'w-5 h-5' : ''}`} />
        <span className={`text-sm font-semibold ${rainMode ? 'text-lg' : ''}`}>Blood Substitution</span>
      </label>

      {/* Confirm Button */}
      <button
        onClick={handleSub}
        disabled={!outPlayer || !inPlayerName || !inPlayerNumber}
        className={`w-full rounded-lg bg-gaa-green py-3 font-bold text-white transition ${
          outPlayer && inPlayerName && inPlayerNumber ? 'hover:bg-gaa-green-light active:scale-[0.98]' : 'bg-gray-300 cursor-not-allowed'
        } ${rainMode ? 'text-rain-md min-h-[60px]' : ''}`}
      >
        Confirm Substitution
      </button>
    </div>
  );
}
