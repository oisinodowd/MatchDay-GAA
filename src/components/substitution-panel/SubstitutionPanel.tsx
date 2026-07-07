'use client';

import { useState } from 'react';
import { useMatchStore } from '@/stores/match-store';
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
  const highContrast = accessibilityMode === 'high-contrast';

  const [outPlayer, setOutPlayer] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');
  const [inPlayerNumber, setInPlayerNumber] = useState('');
  const [isBloodSub, setIsBloodSub] = useState(false);

  // Mock player list — in production this comes from match_players table
  const starters = Array.from({ length: 15 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    number: i + 1,
  }));

  const substitutes = Array.from({ length: 6 }, (_, i) => ({
    id: `sub${i + 1}`,
    name: `Sub ${i + 1}`,
    number: 16 + i,
  }));

  const handleSub = () => {
    if (!outPlayer || !inPlayerName || !inPlayerNumber) return;

    const playerOutIndex = parseInt(outPlayer.replace('p', '')) - 1;
    const playerOnNumber = parseInt(inPlayerNumber);

    substitutePlayer(teamSide, playerOutIndex, inPlayerName, playerOnNumber);

    // Reset form
    setOutPlayer('');
    setInPlayerName('');
    setInPlayerNumber('');
    setIsBloodSub(false);
  };

  return (
    <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''} ${highContrast ? 'border-2 border-black' : ''}`}>
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
          {starters.map((p) => (
            <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
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
          {substitutes.map((p) => (
            <option key={p.id} value={p.number}>#{p.number} {p.name}</option>
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
