'use client';

import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';

// Helper to calculate total points (goals * 3 + points)
function calculateTotalPoints(goals: number, points: number): number {
  return goals * 3 + points;
}

// Helper to format GAA notation (e.g., "1-15" for 1 goal, 15 points)
function getGAANotation(goals: number, points: number): string {
  return `${goals}-${points}`;
}

export default function Scoreboard() {
  const match = useMatchStore((state) => state.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  // Don't show scoreboard if no match is active
  if (!match || !match.teamHome.id && !match.teamAway.id) return null;

  const homeTeam = match.teamHome;
  const awayTeam = match.teamAway;
  
  const homeTotal = calculateTotalPoints(homeTeam.goals, homeTeam.points);
  const awayTotal = calculateTotalPoints(awayTeam.goals, awayTeam.points);
  const homeNotation = getGAANotation(homeTeam.goals, homeTeam.points);
  const awayNotation = getGAANotation(awayTeam.goals, awayTeam.points);

  // Determine which team is leading for visual emphasis
  const homeLeading = homeTotal > awayTotal;
  const awayLeading = awayTotal > homeTotal;
  const homeLead = homeTotal - awayTotal;
  const awayLead = awayTotal - homeTotal;

  // Check if rain mode is active
  const rainMode = accessibilityMode === 'rain-mode';

  // Map status to display text
  const getStatusText = () => {
    switch (match.status) {
      case 'draft': return 'DRAFT';
      case 'first-half': return '1H';
      case 'halftime': return 'HT';
      case 'second-half': return '2H';
      case 'completed': return 'FT';
      case 'postponed': return 'POSTP';
      case 'cancelled': return 'CANCEL';
      default: return '';
    }
  };

  // Format minute with apostrophe (e.g., "45'")
  const formatMinute = (minute: number): string => {
    if (!match || match.status === 'draft' || match.status === 'postponed' || match.status === 'cancelled') {
      return '';
    }
    return `${minute}'`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gaa-green-dark shadow-lg">
      {/* Main Score Row */}
      <div className={`mx-auto max-w-2xl px-3 py-1 ${rainMode ? 'py-2' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          {/* Home Team */}
          <div className={`flex flex-col items-start ${homeLeading && !rainMode ? 'scale-105' : ''} transition-transform`}>
            <span className={`${rainMode ? 'text-rain-md' : 'text-xs'} font-semibold text-white truncate max-w-[40%]`}>
              {homeTeam.name || 'HOME'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`${rainMode ? 'text-rain-xl' : 'text-xl'} font-bold text-gaa-gold tabular-nums`}>
                {homeNotation}
              </span>
              {!rainMode && (
                <span className="text-[10px] text-green-300">({homeTotal})</span>
              )}
            </div>
            {homeLead > 0 && !rainMode && (
              <span className="text-[9px] text-gaa-gold font-medium">+{homeLead}</span>
            )}
          </div>

          {/* Match Status / Time */}
          <div className="flex flex-col items-center">
            <span className={`${rainMode ? 'text-rain-md' : 'text-sm'} font-semibold text-white tabular-nums`}>
              {getStatusText()}
            </span>
            {!rainMode && (
              <span className="text-[9px] text-green-300 capitalize">{match.sport?.replace('-', ' ')}</span>
            )}
            {!rainMode && formatMinute(match.currentMinute) && (
              <span className="text-[10px] text-gaa-gold tabular-nums">{formatMinute(match.currentMinute)}</span>
            )}
          </div>

          {/* Away Team */}
          <div className={`flex flex-col items-end ${awayLeading && !rainMode ? 'scale-105' : ''} transition-transform`}>
            <span className={`${rainMode ? 'text-rain-md' : 'text-xs'} font-semibold text-white truncate max-w-[40%]`}>
              {awayTeam.name || 'AWAY'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`${rainMode ? 'text-rain-xl' : 'text-xl'} font-bold text-gaa-gold tabular-nums`}>
                {awayNotation}
              </span>
              {!rainMode && (
                <span className="text-[10px] text-green-300">({awayTotal})</span>
              )}
            </div>
            {awayLead > 0 && !rainMode && (
              <span className="text-[9px] text-gaa-gold font-medium">+{awayLead}</span>
            )}
          </div>
        </div>
      </div>

      {/* Divider line */}
      <div className="h-0.5 bg-gaa-gold" />
    </header>
  );
}
