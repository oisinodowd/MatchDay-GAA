'use client';

import { useState, useMemo } from 'react';
import { useMatchStore, Player } from '@/stores/match-store';
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

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingScore, setPendingScore] = useState<'point' | 'two_point' | 'goal' | null>(null);
  
  // Interactive pitch map state for location selection
  const [showPitchMap, setShowPitchMap] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ x: number; y: number } | null>(null);

  // Get real team players from match store
  const teamPlayers = useMemo(() => {
    if (!match) return [];
    const team = teamSide === 'home' ? match.teamHome : match.teamAway;
    return team.players || [];
  }, [match, teamSide]);

  // Fallback to mock players if no real players exist (for backward compatibility)
  const players: Player[] = teamPlayers.length > 0 
    ? teamPlayers 
    : Array.from({ length: 21 }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Player ${i + 1}`,
        number: i + 1,
        isStarter: i < 15,
        goals: 0, points: 0, yellowCards: 0, blackCards: 0, redCards: 0, isSubstituted: false,
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

    // Store percentage coordinates directly (0-100) for display on pitch image
    addScore(teamSide, subtype, playerIndex, isTwoPoint, x, y);

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
    <div className="card-elevated p-5">
      {/* Team Header */}
      <h3 className={`mb-4 font-semibold ${rainMode ? 'text-rain-md' : 'text-base'} text-gaa-green`}>
        {teamName} <span className={`font-normal ${'text-gray-500'}`}>• {teamSide === 'home' ? 'Home' : 'Away'}</span>
      </h3>

      {/* Player Selector — tap to select, then tap score type (UR-004–5) */}
      <div className="mb-4">
        <label className={`block mb-1.5 text-xs font-medium ${rainMode ? 'text-rain-sm' : ''} text-gray-600`}>
          Select Player
        </label>
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className={`input-field ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        >
          <option value="">— Select a player —</option>
          {players.map((p, idx) => (
            <option key={p.id || idx} value={p.id || `p${idx + 1}`}>
              #{p.number} {p.name || `Player ${idx + 1}`} {p.isStarter ? '(S)' : '(Sub)'}
            </option>
          ))}
        </select>
      </div>

      {/* Score Type Buttons — one tap to record (UR-004–5) */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Point Button */}
        <button
          onClick={() => { setPendingScore('point'); handleScoreClick('point'); }}
          disabled={!selectedPlayer}
          className={`flex flex-col items-center justify-center rounded-xl py-5 transition ${
            selectedPlayer ? 'hover:bg-blue-100 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
          } ${rainMode ? 'min-h-[60px]' : ''}`}
        >
          <Target className={`mb-2 ${selectedPlayer ? 'text-blue-600' : 'text-gray-400'} ${rainMode ? 'w-8 h-8' : 'w-6 h-6'}`} />
          <span className={`font-semibold ${rainMode ? 'text-base' : 'text-sm'} ${selectedPlayer ? 'text-blue-700' : ''}`}>Point</span>
          <span className={`mt-1 ${'text-xs'} text-gray-500`}>+1 pt</span>
        </button>

        {/* Two-Point Button (2025 rule — UR-034) */}
        <button
          onClick={() => { setPendingScore('two_point'); handleScoreClick('two_point'); }}
          disabled={!selectedPlayer}
          className={`flex flex-col items-center justify-center rounded-xl py-5 transition ${
            selectedPlayer ? 'hover:bg-orange-100 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
          } ${rainMode ? 'min-h-[60px]' : ''}`}
        >
          <Crosshair className={`mb-2 ${selectedPlayer ? 'text-orange-600' : 'text-gray-400'} ${rainMode ? 'w-8 h-8' : 'w-6 h-6'}`} />
          <span className={`font-semibold ${rainMode ? 'text-base' : 'text-sm'} ${selectedPlayer ? 'text-orange-700' : ''}`}>2 Pt</span>
          <span className={`mt-1 ${'text-xs'} text-gray-500`}>40m+</span>
        </button>

        {/* Goal Button */}
        <button
          onClick={() => { setPendingScore('goal'); handleScoreClick('goal'); }}
          disabled={!selectedPlayer}
          className={`flex flex-col items-center justify-center rounded-xl py-5 transition ${
            selectedPlayer ? 'hover:bg-green-100 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
          } ${rainMode ? 'min-h-[60px]' : ''}`}
        >
          <Trophy className={`mb-2 ${selectedPlayer ? 'text-green-600' : 'text-gray-400'} ${rainMode ? 'w-8 h-8' : 'w-6 h-6'}`} />
          <span className={`font-semibold ${rainMode ? 'text-base' : 'text-sm'} ${selectedPlayer ? 'text-green-700' : ''}`}>Goal</span>
          <span className={`mt-1 ${'text-xs'} text-gray-500`}>+3 pts</span>
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
        className={`w-full text-center ${'text-xs'} font-medium ${rainMode ? 'text-rain-sm' : ''} text-gray-500 hover:text-gray-700 underline transition-colors`}
      >
        Score without player (assign later)
      </button>

      {/* Discipline Section — Cards (UR-063–71) */}
      <div className={`mt-5 pt-4 border-t ${'border-gray-200'}`}>
        <h4 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${rainMode ? 'text-rain-sm' : ''} text-gray-500`}>
          Discipline
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {/* Yellow Card */}
          <button
            onClick={() => {
              if (!selectedPlayer) return;
              const playerIndex = parseInt(selectedPlayer.replace('p', '')) - 1;
              addCard(teamSide, 'yellow', playerIndex);
              setSelectedPlayer('');
            }}
            disabled={!selectedPlayer}
            className={`flex flex-col items-center justify-center rounded-xl py-4 transition ${
              selectedPlayer ? 'hover:bg-yellow-50 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className={`w-7 h-10 rounded mb-2 ${selectedPlayer ? 'bg-yellow-400' : 'bg-gray-300'} border-2 border-black`}></div>
            <span className={`font-semibold text-sm ${rainMode ? 'text-rain-sm' : ''} ${selectedPlayer ? 'text-yellow-700' : ''}`}>Yellow</span>
            <span className={`mt-0.5 ${'text-xs'} text-gray-500`}>Caution</span>
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
            className={`flex flex-col items-center justify-center rounded-xl py-4 transition ${
              selectedPlayer ? 'hover:bg-gray-200 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className={`w-7 h-10 rounded mb-2 ${selectedPlayer ? 'bg-black' : 'bg-gray-300'} border-2 border-white`}></div>
            <span className={`font-semibold text-sm ${rainMode ? 'text-rain-sm' : ''} ${selectedPlayer ? 'text-gray-700' : ''}`}>Black</span>
            <span className={`mt-0.5 ${'text-xs'} text-gray-500`}>Send-off</span>
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
            className={`flex flex-col items-center justify-center rounded-xl py-4 transition ${
              selectedPlayer ? 'hover:bg-red-50 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className={`w-7 h-10 rounded mb-2 ${selectedPlayer ? 'bg-red-600' : 'bg-gray-300'} border-2 border-white`}></div>
            <span className={`font-semibold text-sm ${rainMode ? 'text-rain-sm' : ''} ${selectedPlayer ? 'text-red-700' : ''}`}>Red</span>
            <span className={`mt-0.5 ${'text-xs'} text-gray-500`}>Dismissal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
