'use client';

import { useState } from 'react';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { Target, Crosshair, Trophy, Square, SquareSlash, ShieldAlert, MapPin } from 'lucide-react';
import InteractivePitchMap from './InteractivePitchMap';

interface ScoringPanelProps {
  teamSide: 'home' | 'away';
  teamName: string;
}

export default function ScoringPanel({ teamSide, teamName }: ScoringPanelProps) {
  const addScore = useMatchStore((s) => s.addScore);
  const addCard = useMatchStore((s) => s.addCard);
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';
  const highContrast = accessibilityMode === 'high-contrast';

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingScore, setPendingScore] = useState<'point' | 'two_point' | 'goal' | null>(null);
  
  // Interactive pitch map state for location selection
  const [showPitchMap, setShowPitchMap] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ x: number; y: number } | null>(null);

  // Mock player list — in production this comes from match_players table
  const players = Array.from({ length: 21 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    number: i + 1,
    isStarter: i < 15,
  }));

  const handleScoreClick = (type: 'point' | 'two_point' | 'goal') => {
    if (!selectedPlayer) {
      return; // Need player selection for individual scores
    }
    
    // Show pitch map for location selection before recording
    setPendingLocation(null);
    setShowPitchMap(true);
  };

  const handleScore = (type: 'point' | 'two_point' | 'goal') => {
    if (!selectedPlayer) {
      return; // Need player selection for individual scores
    }

    let subtype: 'goal' | 'point' | 'free' | '65-meter' | '40m-point' = 'point';
    let isTwoPoint = false;

    if (type === 'goal') {
      subtype = 'goal';
    } else if (type === 'two_point') {
      subtype = '40m-point';
      isTwoPoint = true;
    } else {
      subtype = 'point';
    }

    const playerIndex = selectedPlayer ? parseInt(selectedPlayer.replace('p', '')) - 1 : undefined;

    addScore(teamSide, subtype, playerIndex, isTwoPoint);

    // Reset selection after scoring (one-tap flow: select player → tap score type)
    setSelectedPlayer('');
  };

  const handleLocationSelect = (x: number, y: number) => {
    setPendingLocation({ x, y });
    
    if (!selectedPlayer || !pendingScore) return;
    
    let subtype: 'goal' | 'point' | 'free' | '65-meter' | '40m-point' = 'point';
    let isTwoPoint = false;

    if (pendingScore === 'goal') {
      subtype = 'goal';
    } else if (pendingScore === 'two_point') {
      subtype = '40m-point';
      isTwoPoint = true;
    } else {
      subtype = 'point';
    }

    const playerIndex = selectedPlayer ? parseInt(selectedPlayer.replace('p', '')) - 1 : undefined;

    // Convert percentage to SVG coordinates (300x400)
    const svgX = (x / 100) * 290 + 5;
    const svgY = (y / 100) * 390 + 5;

    addScore(teamSide, subtype, playerIndex, isTwoPoint, svgX, svgY);

    // Reset selection after scoring (one-tap flow: select player → tap score type)
    setSelectedPlayer('');
    setShowPitchMap(false);
    setPendingLocation(null);
    setPendingScore(null);
  };

  const handleClosePitchMap = () => {
    setShowPitchMap(false);
    setPendingLocation(null);
    setPendingScore(null);
  };

  return (
    <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''} ${highContrast ? 'border-2 border-black' : ''}`}>
      {/* Team Header */}
      <h3 className={`mb-3 font-bold text-gaa-green ${rainMode ? 'text-rain-md' : ''}`}>
        {teamName} ({teamSide === 'home' ? 'HOME' : 'AWAY'})
      </h3>

      {/* Player Selector — tap to select, then tap score type (UR-004–5) */}
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
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.number} {p.name} {p.isStarter ? '(S)' : '(Sub)'}
            </option>
          ))}
        </select>
      </div>

      {/* Score Type Buttons — one tap to record (UR-004–5) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Point Button */}
        <button
          onClick={() => { setPendingScore('point'); handleScoreClick('point'); }}
          disabled={!selectedPlayer}
          className={`flex flex-col items-center justify-center rounded-lg bg-blue-100 py-4 transition ${
            selectedPlayer ? 'hover:bg-blue-200 active:scale-95' : 'bg-gray-100 cursor-not-allowed'
          } ${rainMode ? 'min-h-[60px]' : ''}`}
        >
          <Target className={rainMode ? 'w-8 h-8' : 'w-6 h-6'} />
          <span className={`font-bold ${rainMode ? 'text-lg' : ''}`}>Point</span>
          <span className="text-xs text-gray-500">+1 pt</span>
        </button>

        {/* Two-Point Button (2025 rule — UR-034) */}
        <button
          onClick={() => { setPendingScore('two_point'); handleScoreClick('two_point'); }}
          disabled={!selectedPlayer}
          className={`flex flex-col items-center justify-center rounded-lg bg-orange-100 py-4 transition ${
            selectedPlayer ? 'hover:bg-orange-200 active:scale-95' : 'bg-gray-100 cursor-not-allowed'
          } ${rainMode ? 'min-h-[60px]' : ''}`}
        >
          <Crosshair className={rainMode ? 'w-8 h-8' : 'w-6 h-6'} />
          <span className={`font-bold text-orange-700 ${rainMode ? 'text-lg' : ''}`}>2 Pt</span>
          <span className="text-xs text-gray-500">Outside 40m arc</span>
        </button>

        {/* Goal Button */}
        <button
          onClick={() => { setPendingScore('goal'); handleScoreClick('goal'); }}
          disabled={!selectedPlayer}
          className={`flex flex-col items-center justify-center rounded-lg bg-green-100 py-4 transition ${
            selectedPlayer ? 'hover:bg-green-200 active:scale-95' : 'bg-gray-100 cursor-not-allowed'
          } ${rainMode ? 'min-h-[60px]' : ''}`}
        >
          <Trophy className={rainMode ? 'w-8 h-8' : 'w-6 h-6'} />
          <span className={`font-bold text-green-700 ${rainMode ? 'text-lg' : ''}`}>Goal</span>
          <span className="text-xs text-gray-500">+3 pts</span>
        </button>
      </div>

      {/* Interactive Pitch Map Modal */}
      {showPitchMap && (
        <InteractivePitchMap
          onSelectLocation={handleLocationSelect}
          onClose={handleClosePitchMap}
        />
      )}

      {/* UR-038: Team-only score (no player assigned) */}
      <button
        onClick={() => {
          addScore(teamSide, 'point', undefined, false);
        }}
        className={`mt-2 w-full text-center text-xs text-gray-500 underline ${rainMode ? 'text-sm' : ''}`}
      >
        Score without player (assign later)
      </button>

      {/* Discipline Section — Cards (UR-063–71) */}
      <div className="mt-4 pt-3 border-t">
        <h4 className={`mb-2 text-xs font-semibold uppercase ${rainMode ? 'text-rain-md' : ''}`}>Discipline</h4>
        <div className="grid grid-cols-3 gap-2">
          {/* Yellow Card */}
          <button
            onClick={() => {
              if (!selectedPlayer) return;
              const playerIndex = parseInt(selectedPlayer.replace('p', '')) - 1;
              addCard(teamSide, 'yellow', playerIndex);
              setSelectedPlayer('');
            }}
            disabled={!selectedPlayer}
            className={`flex flex-col items-center justify-center rounded-lg py-4 transition ${
              selectedPlayer ? 'hover:bg-yellow-50 active:scale-95' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className="w-8 h-10 bg-yellow-400 rounded border-2 border-black mb-1"></div>
            <span className={`font-bold text-yellow-700 ${rainMode ? 'text-lg' : ''}`}>Yellow</span>
            <span className="text-xs text-gray-500">Caution</span>
          </button>

          {/* Black Card */}
          <button
            onClick={() => {
              if (!selectedPlayer) return;
              const playerIndex = parseInt(selectedPlayer.replace('p', '')) - 1;
              addCard(teamSide, 'black', playerIndex);
              setSelectedPlayer('');
            }}
            disabled={!selectedPlayer}
            className={`flex flex-col items-center justify-center rounded-lg py-4 transition ${
              selectedPlayer ? 'hover:bg-gray-200 active:scale-95' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className="w-8 h-10 bg-black rounded border-2 border-white mb-1"></div>
            <span className={`font-bold text-gray-700 ${rainMode ? 'text-lg' : ''}`}>Black</span>
            <span className="text-xs text-gray-500">Send-off</span>
          </button>

          {/* Red Card */}
          <button
            onClick={() => {
              if (!selectedPlayer) return;
              const playerIndex = parseInt(selectedPlayer.replace('p', '')) - 1;
              addCard(teamSide, 'red', playerIndex);
              setSelectedPlayer('');
            }}
            disabled={!selectedPlayer}
            className={`flex flex-col items-center justify-center rounded-lg py-4 transition ${
              selectedPlayer ? 'hover:bg-red-50 active:scale-95' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className="w-8 h-10 bg-red-600 rounded border-2 border-white mb-1"></div>
            <span className={`font-bold text-red-700 ${rainMode ? 'text-lg' : ''}`}>Red</span>
            <span className="text-xs text-gray-500">Dismissal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
