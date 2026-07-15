'use client';

import { useState, useMemo } from 'react';
import { useMatchStore, Player } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { Target, Crosshair, Trophy, Flag, GitBranch, XCircle, ArrowUpRight, RefreshCw } from 'lucide-react';
import InteractivePitchMap from './InteractivePitchMap';

interface ScoringPanelProps {
  teamSide: 'home' | 'away';
  teamName: string;
}

type PendingAction = 
  | { type: 'score'; subtype: 'point' | 'two_point' | 'goal' | 'free' | '45-meter' }
  | { type: 'miss'; missType: 'point_wide' | 'goal_wide' }
  | { type: 'mark' }
  | { type: 'turnover' };

export default function ScoringPanel({ teamSide, teamName }: ScoringPanelProps) {
  const addScore = useMatchStore((s) => s.addScore);
  const addMiss = useMatchStore((s) => s.addMiss);
  const addMark = useMatchStore((s) => s.addMark);
  const addTurnover = useMatchStore((s) => s.addTurnover);
  const addCard = useMatchStore((s) => s.addCard);
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  
  // Interactive pitch map state for location selection
  const [showPitchMap, setShowPitchMap] = useState(false);

  // Get real team players from match store
  const teamPlayers = useMemo(() => {
    if (!match) return [];
    const team = teamSide === 'home' ? match.teamHome : match.teamAway;
    return team.players || [];
  }, [match, teamSide]);

  // Fallback to mock players if no real players exist
  const players: Player[] = teamPlayers.length > 0 
    ? teamPlayers 
    : Array.from({ length: 21 }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Player ${i + 1}`,
        number: i + 1,
        isStarter: i < 15,
        goals: 0, points: 0, yellowCards: 0, blackCards: 0, redCards: 0, isSubstituted: false,
      }));

  const handleActionClick = (action: PendingAction) => {
    if (!selectedPlayer) return;
    setPendingAction(action);
    setShowPitchMap(true);
  };

  const executeAction = (x: number, y: number) => {
    if (!selectedPlayer || !pendingAction) return;

    const playerIndex = players.findIndex(p => p.id === selectedPlayer);
    const validIndex = playerIndex >= 0 ? playerIndex : undefined;

    if (pendingAction.type === 'score') {
      // Map UI action to store subtype
      let subtype: 'goal' | 'point' | 'free' | '65-meter' | '40m-point' | '45-meter';
      let isTwoPoint = false;

      switch (pendingAction.subtype) {
        case 'goal':
          subtype = 'goal';
          break;
        case 'two_point':
          subtype = '40m-point';
          isTwoPoint = true;
          break;
        case 'free':
          subtype = 'free';
          break;
        case '45-meter':
          subtype = '45-meter';
          break;
        case 'point':
        default:
          subtype = 'point';
          break;
      }

      addScore(teamSide, subtype, validIndex, isTwoPoint, x, y);
    } else if (pendingAction.type === 'miss') {
      addMiss(teamSide, pendingAction.missType, validIndex, x, y);
    } else if (pendingAction.type === 'mark') {
      addMark(teamSide, validIndex, x, y);
    } else if (pendingAction.type === 'turnover') {
      addTurnover(teamSide, validIndex, x, y);
    }

    // Reset
    setSelectedPlayer('');
    setShowPitchMap(false);
    setPendingAction(null);
  };

  const handleClosePitchMap = () => {
    setShowPitchMap(false);
    setPendingAction(null);
  };

  // Score without player (quick team-only score)
  const quickScore = (type: 'point' | 'goal') => {
    const subtype = type === 'goal' ? 'goal' as const : 'point' as const;
    addScore(teamSide, subtype, undefined, false);
  };

  return (
    <div className="card-elevated p-5">
      {/* Team Header */}
      <h3 className={`mb-4 font-semibold ${rainMode ? 'text-rain-md' : 'text-base'} text-gaa-green`}>
        {teamName} <span className={`font-normal text-gray-500`}>• {teamSide === 'home' ? 'Home' : 'Away'}</span>
      </h3>

      {/* Player Selector */}
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

      {/* ── Scores From Play ── */}
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400`}>
        Scores from Play
      </p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Point from Play */}
        <button
          onClick={() => handleActionClick({ type: 'score', subtype: 'point' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#eff6ff' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <Target style={{ width: '22px', height: '22px', color: '#2563eb', marginBottom: '4px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>Point</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>+1 pt</span>
        </button>

        {/* 2-Point (40m+) */}
        <button
          onClick={() => handleActionClick({ type: 'score', subtype: 'two_point' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#fff7ed' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <Crosshair style={{ width: '22px', height: '22px', color: '#ea580c', marginBottom: '4px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#9a3412' }}>2-Point</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>40m+ (+2)</span>
        </button>

        {/* Goal from Play */}
        <button
          onClick={() => handleActionClick({ type: 'score', subtype: 'goal' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#f0fdf4' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <Trophy style={{ width: '22px', height: '22px', color: '#16a34a', marginBottom: '4px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>Goal</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>+3 pts</span>
        </button>
      </div>

      {/* ── Placed Balls & Misses ── */}
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400`}>
        Placed Balls &amp; Misses
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Free (Point) */}
        <button
          onClick={() => handleActionClick({ type: 'score', subtype: 'free' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#fefce8' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <Flag style={{ width: '22px', height: '22px', color: '#ca8a04', marginBottom: '4px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#854d0e' }}>Free</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>+1 pt</span>
        </button>

        {/* 45' Kick */}
        <button
          onClick={() => handleActionClick({ type: 'score', subtype: '45-meter' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#f5f3ff' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <GitBranch style={{ width: '22px', height: '22px', color: '#7c3aed', marginBottom: '4px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#5b21b6' }}>45&apos;</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>Set piece</span>
        </button>

        {/* Wide (Point Miss) */}
        <button
          onClick={() => handleActionClick({ type: 'miss', missType: 'point_wide' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#fef2f2' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <XCircle style={{ width: '22px', height: '22px', color: '#ef4444', marginBottom: '4px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>Wide</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>Point miss</span>
        </button>

        {/* Goal Miss */}
        <button
          onClick={() => handleActionClick({ type: 'miss', missType: 'goal_wide' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#fff1f2' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1, marginBottom: '4px' }}>🥅</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#9f1239' }}>Goal Miss</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>Off target</span>
        </button>
      </div>

      {/* ── Possession & Defence ── */}
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400`}>
        Possession &amp; Defence
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Mark (clean catch) */}
        <button
          onClick={() => handleActionClick({ type: 'mark' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#f0fdf4' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <ArrowUpRight style={{ width: '22px', height: '22px', color: '#16a34a', marginBottom: '4px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>Mark</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>Clean catch</span>
        </button>

        {/* Turnover */}
        <button
          onClick={() => handleActionClick({ type: 'turnover' })}
          disabled={!selectedPlayer}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', borderRadius: '12px',
            background: selectedPlayer ? '#eff6ff' : '#f3f4f6',
            border: 'none', cursor: selectedPlayer ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', opacity: selectedPlayer ? 1 : 0.5,
          }}
        >
          <RefreshCw style={{ width: '22px', height: '22px', color: '#2563eb', marginBottom: '4px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>Turnover</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>Won / Lost</span>
        </button>
      </div>

      {/* Interactive Pitch Map Modal */}
      {showPitchMap && (
        <InteractivePitchMap
          onSelectLocation={executeAction}
          onClose={handleClosePitchMap}
        />
      )}

      {/* Quick team-only scores */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => quickScore('point')}
          style={{
            flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 500,
            color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline', padding: '4px',
          }}
        >
          +1 Team Point
        </button>
        <button
          onClick={() => quickScore('goal')}
          style={{
            flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 500,
            color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline', padding: '4px',
          }}
        >
          +3 Team Goal
        </button>
      </div>

      {/* Discipline Section — Cards */}
      <div className={`pt-4 border-t border-gray-200`}>
        <h4 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${rainMode ? 'text-rain-sm' : ''} text-gray-500`}>
          Discipline
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {/* Yellow Card */}
          <button
            onClick={() => {
              if (!selectedPlayer) return;
              const playerIndex = players.findIndex(p => p.id === selectedPlayer);
              if (playerIndex >= 0) addCard(teamSide, 'yellow', playerIndex);
              setSelectedPlayer('');
            }}
            disabled={!selectedPlayer}
            className={`flex flex-col items-center justify-center rounded-xl py-4 transition ${
              selectedPlayer ? 'hover:bg-yellow-50 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className={`w-7 h-10 rounded mb-2 ${selectedPlayer ? 'bg-yellow-400' : 'bg-gray-300'} border-2 border-black`}></div>
            <span className={`font-semibold text-sm ${rainMode ? 'text-rain-sm' : ''} ${selectedPlayer ? 'text-yellow-700' : ''}`}>Yellow</span>
          </button>

          {/* Black Card */}
          <button
            onClick={() => {
              if (!selectedPlayer) return;
              const playerIndex = players.findIndex(p => p.id === selectedPlayer);
              if (playerIndex >= 0) addCard(teamSide, 'black', playerIndex);
              setSelectedPlayer('');
            }}
            disabled={!selectedPlayer}
            className={`flex flex-col items-center justify-center rounded-xl py-4 transition ${
              selectedPlayer ? 'hover:bg-gray-200 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className={`w-7 h-10 rounded mb-2 ${selectedPlayer ? 'bg-black' : 'bg-gray-300'} border-2 border-white`}></div>
            <span className={`font-semibold text-sm ${rainMode ? 'text-rain-sm' : ''} ${selectedPlayer ? 'text-gray-700' : ''}`}>Black</span>
          </button>

          {/* Red Card */}
          <button
            onClick={() => {
              if (!selectedPlayer) return;
              const playerIndex = players.findIndex(p => p.id === selectedPlayer);
              if (playerIndex >= 0) addCard(teamSide, 'red', playerIndex);
              setSelectedPlayer('');
            }}
            disabled={!selectedPlayer}
            className={`flex flex-col items-center justify-center rounded-xl py-4 transition ${
              selectedPlayer ? 'hover:bg-red-50 active:scale-[0.98]' : 'bg-gray-100 cursor-not-allowed'
            } ${rainMode ? 'min-h-[60px]' : ''}`}
          >
            <div className={`w-7 h-10 rounded mb-2 ${selectedPlayer ? 'bg-red-600' : 'bg-gray-300'} border-2 border-white`}></div>
            <span className={`font-semibold text-sm ${rainMode ? 'text-rain-sm' : ''} ${selectedPlayer ? 'text-red-700' : ''}`}>Red</span>
          </button>
        </div>
      </div>
    </div>
  );
}
