'use client';

import { useState } from 'react';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { RefreshCw, Target, Shield } from 'lucide-react';

type RestartType = 'kick-out' | '45-meter' | '65-meter' | 'free-kick';

interface RestartPanelProps {
  teamSide: 'home' | 'away';
}

export default function RestartPanel({ teamSide }: RestartPanelProps) {
  const match = useMatchStore((s) => s.match);
  const isMatchActive = useMatchStore((s) => s.isMatchActive);
  const addScore = useMatchStore((s) => s.addScore);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';
  const highContrast = accessibilityMode === 'high-contrast';
  const largeText = accessibilityMode === 'large-text';

  const [selectedRestart, setSelectedRestart] = useState<RestartType>('kick-out');
  const [playerIndex, setPlayerIndex] = useState<number>(0);

  // Get team players from match state (simplified - using first few players)
  const team = teamSide === 'home' ? match?.teamHome : match?.teamAway;
  const playerName = team ? `Player ${playerIndex + 1}` : '';

  if (!match || match.status === 'draft') {
    return (
      <div className={`rounded-xl border-2 p-4 text-center ${highContrast ? 'border-black' : 'border-gray-300'}`}>
        <p className="text-gray-500">Start the match to record restart events.</p>
      </div>
    );
  }

  const handleRestart = () => {
    // Record restart event based on type
    switch (selectedRestart) {
      case 'kick-out':
        // Kick-out is just a note event - no score change
        console.log(`Kick-out by ${teamSide} player ${playerIndex + 1}`);
        break;
      case '45-meter':
        // 45-meter penalty (Gaelic football) - counts as a point
        addScore(teamSide, 'free', playerIndex, false);
        break;
      case '65-meter':
        // 65-meter penalty (Hurling/Cork) - counts as a point
        addScore(teamSide, '65-meter', playerIndex, false);
        break;
      case 'free-kick':
        // Free kick taken - could result in goal/point
        addScore(teamSide, 'free', playerIndex, false);
        break;
    }
  };

  const restartOptions: { type: RestartType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      type: 'kick-out',
      label: 'Kick-Out',
      icon: <RefreshCw className="w-6 h-6" />,
      description: 'Goalkeeper restart',
    },
    {
      type: '45-meter',
      label: '45-Meter',
      icon: <Target className="w-6 h-6" />,
      description: '45m penalty (FF)',
    },
    {
      type: '65-meter',
      label: '65-Meter',
      icon: <Target className="w-6 h-6" />,
      description: '65m penalty (Hurling)',
    },
    {
      type: 'free-kick',
      label: 'Free Kick',
      icon: <Shield className="w-6 h-6" />,
      description: 'Free kick taken',
    },
  ];

  return (
    <div className={`rounded-xl border-2 p-4 ${highContrast ? 'border-black' : 'border-gray-300'} ${rainMode ? 'bg-rain-bg p-6' : ''}`}>
      <h3 className={`${largeText ? 'text-xl' : 'text-lg'} font-bold text-gaa-green mb-4`}>
        Restart Events — {teamSide === 'home' ? match.teamHome.name : match.teamAway.name}
      </h3>

      {/* Restart Type Selector */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {restartOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => setSelectedRestart(option.type)}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
              selectedRestart === option.type
                ? 'border-gaa-green bg-green-50 shadow-md'
                : highContrast
                ? 'border-black hover:bg-gray-100'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-gaa-green">{option.icon}</span>
            <span className={`font-bold ${largeText ? 'text-base' : 'text-sm'} text-gray-900`}>
              {option.label}
            </span>
            <span className={`text-xs text-gray-500 ${rainMode ? 'text-sm' : ''}`}>
              {option.description}
            </span>
          </button>
        ))}
      </div>

      {/* Player Selector */}
      <div className="mb-4">
        <label className={`block font-semibold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>
          Player
        </label>
        <select
          value={playerIndex}
          onChange={(e) => setPlayerIndex(Number(e.target.value))}
          className={`w-full rounded-lg border-2 p-3 font-medium ${highContrast ? 'border-black text-lg' : ''}`}
        >
          {Array.from({ length: 15 }, (_, i) => (
            <option key={i} value={i}>
              Player {i + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Current Minute Display */}
      <div className={`mb-4 rounded-lg bg-gray-50 p-3 text-center ${rainMode ? 'bg-rain-card' : ''}`}>
        <span className="font-mono text-2xl font-black text-gaa-green">
          {match.currentMinute}&apos;
        </span>
        <span className={`ml-2 font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
          {match.currentHalf === 'first-half' ? '1st Half' : '2nd Half'}
        </span>
      </div>

      {/* Record Button */}
      <button
        onClick={handleRestart}
        disabled={!isMatchActive}
        className={`w-full rounded-xl py-4 font-black text-white transition-all ${
          isMatchActive
            ? 'bg-gaa-green hover:bg-green-700 active:scale-[0.98]'
            : 'bg-gray-400 cursor-not-allowed'
        } ${rainMode ? 'text-rain-lg py-5' : ''} ${highContrast ? 'border-2 border-black' : ''}`}
      >
        Record {selectedRestart.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </button>

      {/* Help Text */}
      <p className={`mt-3 text-center text-xs text-gray-400 ${rainMode ? 'text-sm' : ''}`}>
        {selectedRestart === 'kick-out' && 'Records goalkeeper kick-out attempt'}
        {selectedRestart === '45-meter' && '45m penalty awarded — auto-records as point if scored'}
        {selectedRestart === '65-meter' && '65m penalty awarded — auto-records as point if scored'}
        {selectedRestart === 'free-kick' && 'Free kick taken — record outcome after attempt'}
      </p>
    </div>
  );
}
