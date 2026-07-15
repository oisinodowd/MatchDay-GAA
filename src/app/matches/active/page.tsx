'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import ScoringPanel from '@/components/scoring-panel/ScoringPanel';
import CardPanel from '@/components/card-panel/CardPanel';
import AccessibilityToggle from '@/components/accessibility/AccessibilityToggle';
import TeamSheetView from '@/components/team-sheet/TeamSheetView';
import { ArrowLeft, Play, SkipForward, RotateCcw, BarChart3, Users, FileText, Clock } from 'lucide-react';
import { useEffect } from 'react';

type TabType = 'scoring' | 'teamsheets' | 'cards';

export default function ActiveMatchPage() {
  const match = useMatchStore((s) => s.match);
  const advanceMinute = useMatchStore((s) => s.advanceMinute);
  const setCurrentHalf = useMatchStore((s) => s.setCurrentHalf);
  const endHalf = useMatchStore((s) => s.endHalf);
  const resetMatch = useMatchStore((s) => s.resetMatch);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('scoring');
  
  // Live timer state (seconds elapsed)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Run a live timer when match is active
  useEffect(() => {
    if (!match || match.status === 'draft' || match.status === 'completed' || match.status === 'postponed' || match.status === 'cancelled') {
      setElapsedSeconds(0);
      return;
    }
    
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [match?.status]);
  
  // Sync elapsed seconds when advancing minute or changing half
  useEffect(() => {
    if (match && match.status !== 'draft') {
      setElapsedSeconds(match.currentMinute * 60);
    }
  }, [match?.currentMinute, match?.currentHalf]);
  
  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Guard: redirect to home if no match exists
  if (!match) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <h1 className={`font-bold ${'text-3xl'} text-gaa-green mb-4`}>
          No Active Match
        </h1>
        <p className={`mb-6 ${'text-sm'} text-gray-500`}>Start a new match to begin recording.</p>
        <Link href="/matches/new" className="btn-primary inline-block">
          Create New Match
        </Link>
      </div>
    );
  }

  const homeTeam = match.teamHome;
  const awayTeam = match.teamAway;

  // Calculate total points for display
  const homeTotal = homeTeam.goals * 3 + homeTeam.points;
  const awayTotal = awayTeam.goals * 3 + awayTeam.points;
  const homeLead = homeTotal - awayTotal;
  const awayLead = awayTotal - homeTotal;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back Button */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Match Header */}
      <div className="mb-8 text-center">
        <h1 className={`font-bold tracking-tight ${'text-2xl'} text-gaa-green`}>
          Live Match
        </h1>
        <p className={`mt-0.5 ${'text-sm'} text-gray-500 capitalize`}>
          {match.sport?.replace('-', ' ')}
        </p>
        
        {/* Score Display */}
        <div className="mt-6 flex items-center justify-center gap-8">
          <div className="text-center">
            <p className={`font-semibold ${'text-base'} text-gray-700`}>{homeTeam.name}</p>
            <p className={`score-display font-black ${'text-5xl'} tabular-nums text-gaa-green leading-tight`}>
              {homeTeam.goals}-{homeTeam.points}
            </p>
            <p className={`mt-0.5 ${'text-xs'} text-gray-400`}>({homeTotal} pts)</p>
            {homeLead > 0 && (
              <p className="text-xs font-semibold text-green-600 mt-0.5">+{homeLead} ahead</p>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <span className={`font-bold tabular-nums ${'text-lg'} text-gaa-green`}>
              {match.currentMinute}&apos;
            </span>
            <p className={`mt-0.5 ${'text-xs'} font-medium capitalize text-gray-500`}>
              {match.status.replace('-', ' ')}
            </p>
          </div>
          
          <div className="text-center">
            <p className={`font-semibold ${'text-base'} text-gray-700`}>{awayTeam.name}</p>
            <p className={`score-display font-black ${'text-5xl'} tabular-nums text-gaa-green leading-tight`}>
              {awayTeam.goals}-{awayTeam.points}
            </p>
            <p className={`mt-0.5 ${'text-xs'} text-gray-400`}>({awayTotal} pts)</p>
            {awayLead > 0 && (
              <p className="text-xs font-semibold text-red-600 mt-0.5">+{awayLead} ahead</p>
            )}
          </div>
        </div>
      </div>

      {/* Match Timer Display */}
      <div className="mb-4 card-elevated p-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-5 h-5 text-gaa-green" />
          <span className="text-3xl font-black tabular-nums text-gaa-green tracking-tight">
            {formatTimer(elapsedSeconds)}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-xs text-gray-500 font-medium">
            {match.currentHalf === 'first-half' ? '1st Half' : '2nd Half'}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">
            {match.halfDuration} min half
          </span>
          {match.status === 'halftime' && (
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">HT</span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('scoring')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'scoring' 
              ? 'bg-gaa-green text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Scoring
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'cards' 
              ? 'bg-gaa-green text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Cards
        </button>
        <button
          onClick={() => setActiveTab('teamsheets')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'teamsheets' 
              ? 'bg-gaa-green text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Sheets
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'scoring' && (
        <div className="space-y-4">
          {/* Scoring Panels — one per team */}
          <ScoringPanel teamSide="home" teamName={homeTeam.name} />
          <ScoringPanel teamSide="away" teamName={awayTeam.name} />
        </div>
      )}
      
      {activeTab === 'cards' && (
        <CardPanel />
      )}
      
      {activeTab === 'teamsheets' && (
        <div className="space-y-4">
          <TeamSheetView teamSide="home" />
          <TeamSheetView teamSide="away" />
        </div>
      )}

      {/* Accessibility Settings Panel (UR-079–80) */}
      <div className="mt-6">
        <AccessibilityToggle />
      </div>

      {/* Match Controls */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        <button
          onClick={advanceMinute}
          className={`flex flex-col items-center rounded-xl ${'bg-blue-50'} p-3 hover:bg-blue-100 transition-colors`}
        >
          <Play className={`w-5 h-5 ${'text-blue-600'}`} />
          <span className={`mt-1.5 ${'text-xs'} font-medium ${'text-gray-700'}`}>+1 Min</span>
        </button>

        <button
          onClick={endHalf}
          className={`flex flex-col items-center rounded-xl ${'bg-green-50'} p-3 hover:bg-green-100 transition-colors`}
        >
          <SkipForward className={`w-5 h-5 ${'text-green-600'}`} />
          <span className={`mt-1.5 ${'text-xs'} font-medium ${'text-gray-700'}`}>
            {match.status === 'first-half' ? 'HT' : match.status === 'second-half' ? 'FT' : 'Next'}
          </span>
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          className={`flex flex-col items-center rounded-xl ${'bg-red-50'} p-3 hover:bg-red-100 transition-colors`}
        >
          <RotateCcw className={`w-5 h-5 ${'text-red-600'}`} />
          <span className={`mt-1.5 ${'text-xs'} font-medium ${'text-gray-700'}`}>Reset</span>
        </button>

        <div className={`flex flex-col items-center justify-center rounded-xl p-3 ${
          match.status === 'first-half' ? `${'bg-yellow-50'}` :
          match.status === 'halftime' ? `${'bg-blue-50'}` :
          match.status === 'second-half' ? `${'bg-orange-50'}` :
          match.status === 'completed' ? `${'bg-gray-100'}` : `${'bg-gray-50'}`
        }`}>
          <span className={`text-xs font-semibold ${'text-gray-700'}`}>
            {match.status === 'first-half' && '1H'}
            {match.status === 'halftime' && 'HT'}
            {match.status === 'second-half' && '2H'}
            {match.status === 'completed' && 'FT'}
            {match.status === 'draft' && 'Draft'}
          </span>
        </div>
      </div>

      {/* Phase 3 Navigation — Analytics, Players, Reports */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Link
          href="/matches/active/analytics"
          className={`flex flex-col items-center rounded-xl ${'bg-purple-50'} p-4 hover:bg-purple-100 transition-colors`}
        >
          <BarChart3 className={`w-6 h-6 ${'text-purple-600'}`} />
          <span className={`mt-2 ${'text-xs'} font-medium ${'text-purple-700'}`}>Analytics</span>
        </Link>

        <Link
          href="/matches/active/players"
          className={`flex flex-col items-center rounded-xl ${'bg-blue-50'} p-4 hover:bg-blue-100 transition-colors`}
        >
          <Users className={`w-6 h-6 ${'text-blue-600'}`} />
          <span className={`mt-2 ${'text-xs'} font-medium ${'text-blue-700'}`}>Players</span>
        </Link>

        <Link
          href="/matches/active/reports"
          className={`flex flex-col items-center rounded-xl ${'bg-green-50'} p-4 hover:bg-green-100 transition-colors`}
        >
          <FileText className={`w-6 h-6 ${'text-green-600'}`} />
          <span className={`mt-2 ${'text-xs'} font-medium ${'text-green-700'}`}>Reports</span>
        </Link>
      </div>

      {/* Event Timeline */}
      <MatchTimeline
        events={match.events}
        homeTeamName={homeTeam.name}
        awayTeamName={awayTeam.name}
        homePlayers={homeTeam.players}
        awayPlayers={awayTeam.players}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className={`mx-4 w-full max-w-sm rounded-xl ${'bg-white'} p-6 shadow-xl`}>
            <h3 className={`text-lg font-bold mb-2`}>Reset Match?</h3>
            <p className={`text-sm ${'text-gray-600'} mb-4`}>This will clear all match data. This action cannot be undone.</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetMatch();
                  setShowResetConfirm(false);
                }}
                className={`flex-1 rounded-xl ${'bg-red-600'} py-3 font-semibold text-white hover:bg-red-700 transition-colors`}
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`flex-1 rounded-xl ${'bg-gray-200'} py-3 font-semibold text-gray-800 hover:bg-gray-300 transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Match Timeline Component ──

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'scores', label: 'Scores' },
  { key: 'misses', label: 'Misses' },
  { key: 'cards', label: 'Cards' },
  { key: 'possession', label: 'Possession' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

interface TimelineEventConfig {
  icon: string;
  label: string;
  color: string;
  bg: string;
}

function getEventConfig(event: import('@/stores/match-store').MatchEvent): TimelineEventConfig {
  const t = event.type;
  if (t === 'score') {
    const sub = event.details?.subtype;
    if (sub === 'goal') return { icon: '⚽', label: 'Goal', color: '#16a34a', bg: '#f0fdf4' };
    if (sub === 'free') return { icon: '🎯', label: 'Free', color: '#ca8a04', bg: '#fefce8' };
    if (sub === '45-meter' || sub === '65-meter') return { icon: '📍', label: "45'", color: '#7c3aed', bg: '#f5f3ff' };
    if (event.details?.isTwoPoint) return { icon: '🎯', label: '2-Point', color: '#ea580c', bg: '#fff7ed' };
    return { icon: '🏐', label: 'Point', color: '#2563eb', bg: '#eff6ff' };
  }
  if (t === 'miss') {
    if (event.details?.missType === 'goal_wide') return { icon: '🥅', label: 'Goal Miss', color: '#e11d48', bg: '#fff1f2' };
    return { icon: '✗', label: 'Wide', color: '#dc2626', bg: '#fef2f2' };
  }
  if (t === 'mark') return { icon: '👐', label: 'Mark', color: '#16a34a', bg: '#f0fdf4' };
  if (t === 'turnover') return { icon: '🔄', label: 'Turnover', color: '#2563eb', bg: '#eff6ff' };
  if (t === 'yellow_card') return { icon: '🟨', label: 'Yellow', color: '#ca8a04', bg: '#fefce8' };
  if (t === 'black_card') return { icon: '⬛', label: 'Black', color: '#374151', bg: '#f3f4f6' };
  if (t === 'red_card') return { icon: '🟥', label: 'Red', color: '#dc2626', bg: '#fef2f2' };
  if (t === 'substitution') return { icon: '↔️', label: 'Sub', color: '#6b7280', bg: '#f9fafb' };
  return { icon: '📋', label: t, color: '#6b7280', bg: '#f9fafb' };
}

function getPlayerName(
  teamSide: 'home' | 'away',
  playerIndex: number | undefined,
  homePlayers: import('@/stores/match-store').Player[],
  awayPlayers: import('@/stores/match-store').Player[]
): string | null {
  if (playerIndex === undefined) return null;
  const players = teamSide === 'home' ? homePlayers : awayPlayers;
  const player = players[playerIndex];
  if (!player) return null;
  return player.name || `#${player.number}`;
}

function MatchTimeline({
  events,
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
}: {
  events: import('@/stores/match-store').MatchEvent[];
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: import('@/stores/match-store').Player[];
  awayPlayers: import('@/stores/match-store').Player[];
}) {
  const [filter, setFilter] = useState<FilterKey>('all');

  if (events.length === 0) {
    return (
      <div className="mt-6 card-elevated p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Event Timeline
        </h3>
        <p className="text-sm text-gray-500 italic">No events recorded yet.</p>
      </div>
    );
  }

  // Group events by half
  const firstHalf = events.filter(e => e.half === 'first-half');
  const secondHalf = events.filter(e => e.half === 'second-half');

  // Filter by type
  const filterEvents = (list: typeof events) => {
    if (filter === 'all') return list;
    if (filter === 'scores') return list.filter(e => e.type === 'score');
    if (filter === 'misses') return list.filter(e => e.type === 'miss');
    if (filter === 'cards') return list.filter(e => ['yellow_card', 'black_card', 'red_card'].includes(e.type));
    if (filter === 'possession') return list.filter(e => e.type === 'mark' || e.type === 'turnover');
    return list;
  };

  const filteredFirstHalf = filterEvents(firstHalf);
  const filteredSecondHalf = filterEvents(secondHalf);

  return (
    <div className="mt-6 card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Event Timeline
        </h3>
        <span className="text-xs text-gray-400 font-medium">{events.length} events</span>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterKey)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            background: filter === (key as FilterKey) ? '#166534' : '#f3f4f6',
            color: filter === (key as FilterKey) ? '#ffffff' : '#6b7280',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {/* First Half */}
        {filteredFirstHalf.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
                1st Half
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            {filteredFirstHalf.map((event, idx) => (
              <TimelineRow
                key={`1h-${idx}`}
                event={event}
                teamName={event.teamSide === 'home' ? homeTeamName : awayTeamName}
                playerName={getPlayerName(event.teamSide, event.playerIndex, homePlayers, awayPlayers)}
                config={getEventConfig(event)}
              />
            ))}
          </div>
        )}

        {/* Second Half */}
        {filteredSecondHalf.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
                2nd Half
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            {filteredSecondHalf.map((event, idx) => (
              <TimelineRow
                key={`2h-${idx}`}
                event={event}
                teamName={event.teamSide === 'home' ? homeTeamName : awayTeamName}
                playerName={getPlayerName(event.teamSide, event.playerIndex, homePlayers, awayPlayers)}
                config={getEventConfig(event)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineRow({
  event,
  teamName,
  playerName,
  config,
}: {
  event: import('@/stores/match-store').MatchEvent;
  teamName: string;
  playerName: string | null;
  config: TimelineEventConfig;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: '10px',
        background: config.bg,
        marginBottom: '4px',
        transition: 'background 0.15s ease',
      }}
    >
      {/* Minute badge */}
      <span
        style={{
          flexShrink: 0,
          width: '32px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'monospace',
          background: '#ffffff',
          color: config.color,
          border: `1px solid ${config.color}30`,
        }}
      >
        {event.minute}&apos;
      </span>

      {/* Event icon */}
      <span style={{ flexShrink: 0, fontSize: '16px', lineHeight: '22px' }}>
        {config.icon}
      </span>

      {/* Event label */}
      <span
        style={{
          flexShrink: 0,
          fontSize: '11px',
          fontWeight: 700,
          color: config.color,
          minWidth: '56px',
          lineHeight: '22px',
        }}
      >
        {config.label}
      </span>

      {/* Player name */}
      {playerName && (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#1f2937',
            lineHeight: '22px',
          }}
        >
          {playerName}
        </span>
      )}

      {/* Team name (right-aligned) */}
      <span
        style={{
          marginLeft: 'auto',
          fontSize: '10px',
          fontWeight: 600,
          color: event.teamSide === 'home' ? '#2563eb' : '#dc2626',
          lineHeight: '22px',
          flexShrink: 0,
        }}
      >
        {teamName}
      </span>

      {/* Substitution detail */}
      {event.type === 'substitution' && event.details?.playerOnName && (
        <span
          style={{
            fontSize: '10px',
            color: '#6b7280',
            lineHeight: '22px',
          }}
        >
          → {event.details.playerOnName}
        </span>
      )}
    </div>
  );
}
