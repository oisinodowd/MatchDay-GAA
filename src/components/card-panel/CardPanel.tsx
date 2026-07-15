'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { AlertTriangle, ShieldAlert, XCircle, Timer, Bell, BellRing, User } from 'lucide-react';

type CardType = 'yellow' | 'black' | 'red';

const CARD_CONFIG: Record<CardType, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  yellow: {
    label: 'Yellow',
    color: 'bg-yellow-400 hover:bg-yellow-500 text-black',
    icon: <AlertTriangle className="w-6 h-6" />,
    description: 'Caution',
  },
  black: {
    label: 'Black',
    color: 'bg-gray-900 hover:bg-gray-800 text-white',
    icon: <ShieldAlert className="w-6 h-6" />,
    description: '10 min Sin Bin',
  },
  red: {
    label: 'Red',
    color: 'bg-red-600 hover:bg-red-700 text-white',
    icon: <XCircle className="w-6 h-6" />,
    description: 'Dismissal',
  },
};

// Sin bin timer entry
interface SinBinEntry {
  id: string;
  teamSide: 'home' | 'away';
  playerName: string;
  playerNumber: number;
  playerIndex: number;
  cardType: 'black' | 'yellow';
  durationSeconds: number;
  startMinute: number;
  remainingSeconds: number;
  finished: boolean;
}

export default function CardPanel() {
  const addCard = useMatchStore((s) => s.addCard);
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);
  const rainMode = accessibilityMode === 'rain-mode';

  const [activeTeam, setActiveTeam] = useState<'home' | 'away' | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [cardReason, setCardReason] = useState('');
  
  // Sin bin timers state
  const [sinBinTimers, setSinBinTimers] = useState<SinBinEntry[]>([]);
  const [alarmActive, setAlarmActive] = useState<string | null>(null);

  // Get players for both teams
  const homePlayers = useMemo(() => {
    if (!match) return [];
    return match.teamHome.players || [];
  }, [match]);

  const awayPlayers = useMemo(() => {
    if (!match) return [];
    return match.teamAway.players || [];
  }, [match]);

  const getDisplayPlayers = (teamSide: 'home' | 'away') => {
    const players = teamSide === 'home' ? homePlayers : awayPlayers;
    if (players.length > 0) return players;
    return Array.from({ length: 21 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      number: i + 1,
      isStarter: i < 15,
    }));
  };

  const handlePlayerSelect = (teamSide: 'home' | 'away', playerId: string) => {
    setActiveTeam(teamSide);
    setSelectedPlayer(playerId);
    setCardReason('');
  };

  const handleIssueCard = (type: CardType) => {
    if (!selectedPlayer || !activeTeam) return;

    const players = activeTeam === 'home' ? homePlayers : awayPlayers;
    const playerIndex = players.findIndex(p => p.id === selectedPlayer);
    
    if (playerIndex === -1) return;
    
    addCard(activeTeam, type, playerIndex);

    // If black card, start 10-minute sin bin timer (always)
    if (type === 'black') {
      const player = players[playerIndex];
      const timerId = `sinbin-${Date.now()}`;
      
      const newTimer: SinBinEntry = {
        id: timerId,
        teamSide: activeTeam,
        playerName: player?.name || `Player ${playerIndex + 1}`,
        playerNumber: player?.number || playerIndex + 1,
        playerIndex,
        cardType: 'black',
        durationSeconds: 600, // 10 minutes
        startMinute: match?.currentMinute || 0,
        remainingSeconds: 600,
        finished: false,
      };
      
      setSinBinTimers(prev => [...prev, newTimer]);
    }

    // Yellow card sin bin is opt-in via a separate toggle below for ladies/camogie

    setSelectedPlayer('');
    setActiveTeam(null);
    setCardReason('');
  };

  // Sin bin timer countdown
  useEffect(() => {
    if (sinBinTimers.length === 0) return;
    
    const interval = setInterval(() => {
      setSinBinTimers(prev => {
        const updated = prev.map(timer => {
          if (timer.finished) return timer;
          const newRemaining = timer.remainingSeconds - 1;
          if (newRemaining <= 0) {
            return { ...timer, remainingSeconds: 0, finished: true };
          }
          return { ...timer, remainingSeconds: newRemaining };
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sinBinTimers.length]);

  // Alarm when timer finishes - use visual alarm primarily (AudioContext may be blocked by autoplay policy)
  useEffect(() => {
    const justFinished = sinBinTimers.find(t => t.finished && !alarmActive);
    if (justFinished) {
      setAlarmActive(justFinished.id);
      
      // Try audio alarm (may be blocked by browser autoplay policy)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => { oscillator.frequency.value = 1000; }, 200);
        setTimeout(() => { oscillator.frequency.value = 800; }, 400);
        setTimeout(() => { oscillator.frequency.value = 1000; }, 600);
        setTimeout(() => {
          try { oscillator.stop(); audioCtx.close(); } catch (e) { /* cleanup */ }
        }, 1000);
      } catch (e) {
        // Audio not available - visual alarm is sufficient
      }

      // Auto-dismiss alarm after 5 seconds
      setTimeout(() => setAlarmActive(null), 5000);
    }
  }, [sinBinTimers, alarmActive]);

  const dismissTimer = (timerId: string) => {
    setSinBinTimers(prev => prev.filter(t => t.id !== timerId));
    if (alarmActive === timerId) setAlarmActive(null);
  };

  const activeTimers = sinBinTimers.filter(t => !t.finished);
  const finishedTimers = sinBinTimers.filter(t => t.finished);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!match) return null;

  return (
    <div className="rounded-xl border p-4">
      <h3 className={`mb-3 font-bold text-gaa-green ${rainMode ? 'text-rain-md' : ''}`}>
        Cards &amp; Discipline
      </h3>

      {/* Sin Bin Timers */}
      {(activeTimers.length > 0 || finishedTimers.length > 0) && (
        <div className="mb-4 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Timer className="w-3 h-3 inline mr-1" />
            Sin Bin Timers
          </h4>
          {activeTimers.map(timer => (
            <div
              key={timer.id}
              className="flex items-center justify-between p-2 rounded-lg bg-orange-50 border border-orange-200"
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${timer.cardType === 'black' ? 'bg-gray-900' : 'bg-yellow-400'}`} />
                <span className="text-sm font-medium">
                  #{timer.playerNumber} {timer.playerName}
                </span>
                <span className="text-xs text-gray-500">
                  ({timer.teamSide === 'home' ? match.teamHome.name : match.teamAway.name})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-orange-700">{formatTime(timer.remainingSeconds)}</span>
                <button
                  onClick={() => dismissTimer(timer.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {finishedTimers.map(timer => (
            <div
              key={timer.id}
              className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200 animate-pulse"
            >
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  #{timer.playerNumber} {timer.playerName} — Time up!
                </span>
              </div>
              <button
                onClick={() => dismissTimer(timer.id)}
                className="text-xs text-green-600 hover:text-green-800 font-bold"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Two Team Panels Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Home Team */}
        <TeamCardSection
          teamSide="home"
          teamName={match.teamHome.name}
          players={getDisplayPlayers('home')}
          isActive={activeTeam === 'home'}
          selectedPlayer={activeTeam === 'home' ? selectedPlayer : ''}
          onSelectPlayer={(id) => handlePlayerSelect('home', id)}
          rainMode={rainMode}
        />

        {/* Away Team */}
        <TeamCardSection
          teamSide="away"
          teamName={match.teamAway.name}
          players={getDisplayPlayers('away')}
          isActive={activeTeam === 'away'}
          selectedPlayer={activeTeam === 'away' ? selectedPlayer : ''}
          onSelectPlayer={(id) => handlePlayerSelect('away', id)}
          rainMode={rainMode}
        />
      </div>

      {/* Card buttons — only visible when a player is selected */}
      {activeTeam && selectedPlayer && (
        <div className="mt-4 pt-4 border-t">
          {/* Player info */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold">
              {(() => {
                const players = activeTeam === 'home' ? getDisplayPlayers('home') : getDisplayPlayers('away');
                const idx = parseInt(selectedPlayer.replace('p', '')) - 1;
                const player = players[idx];
                return `#${player?.number} ${player?.name}`;
              })()}
            </span>
            <span className="text-xs text-gray-500">
              ({activeTeam === 'home' ? match.teamHome.name : match.teamAway.name})
            </span>
          </div>

          {/* Card Reason */}
          <div className="mb-3">
            <select
              value={cardReason}
              onChange={(e) => setCardReason(e.target.value)}
              className={`w-full rounded-lg border p-2 text-sm ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
            >
              <option value="">Reason (optional)...</option>
              <option value="aggressive_foul">Aggressive foul</option>
              <option value="dissent">Dissent</option>
              <option value="tactical_foul">Tactical foul</option>
              <option value="cynical_play">Cynical play</option>
              <option value="abusive_language">Abusive language</option>
            </select>
          </div>

          {/* Card Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(CARD_CONFIG) as [CardType, typeof CARD_CONFIG[CardType]][]).map(
              ([type, config]) => (
                <button
                  key={type}
                  onClick={() => handleIssueCard(type)}
                  className={`flex flex-col items-center justify-center rounded-lg py-3 transition active:scale-95 ${
                    rainMode ? 'min-h-[60px]' : ''
                  } ${config.color}`}
                >
                  {config.icon}
                  <span className={`font-bold mt-1 ${rainMode ? 'text-lg' : 'text-xs'}`}>{config.label}</span>
                  <span className="text-[10px] opacity-75">{config.description}</span>
                </button>
              )
            )}
          </div>

          {/* Cancel button */}
          <button
            onClick={() => { setSelectedPlayer(''); setActiveTeam(null); }}
            className="w-full mt-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-component for each team's player selector
function TeamCardSection({
  teamSide,
  teamName,
  players,
  isActive,
  selectedPlayer,
  onSelectPlayer,
  rainMode,
}: {
  teamSide: 'home' | 'away';
  teamName: string;
  players: any[];
  isActive: boolean;
  selectedPlayer: string;
  onSelectPlayer: (playerId: string) => void;
  rainMode: boolean;
}) {
  const teamColor = teamSide === 'home' ? 'text-blue-600 border-blue-200' : 'text-red-600 border-red-200';
  
  return (
    <div className={`rounded-lg border p-3 ${isActive ? 'ring-2 ring-gaa-green bg-green-50/50' : ''}`}>
      <h4 className={`text-xs font-bold mb-2 ${teamSide === 'home' ? 'text-blue-600' : 'text-red-600'}`}>
        {teamName}
      </h4>
      {!isActive ? (
        <select
          value=""
          onChange={(e) => e.target.value && onSelectPlayer(e.target.value)}
          className={`w-full rounded-lg border p-1.5 text-xs ${rainMode ? 'min-h-[50px] text-base' : ''}`}
        >
          <option value="">Tap player...</option>
          {players.map((p: any, idx: number) => (
            <option key={p.id || `p${idx + 1}`} value={p.id || `p${idx + 1}`}>
              #{p.number} {p.name || `P${idx + 1}`}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-xs text-green-700 font-medium text-center py-1">
          ✓ Player selected
        </div>
      )}
    </div>
  );
}
