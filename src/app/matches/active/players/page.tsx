'use client';

import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ArrowLeft, User, Trophy } from 'lucide-react';

export default function PlayersPage() {
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';
  const highContrast = accessibilityMode === 'high-contrast';
  const largeText = accessibilityMode === 'large-text';

  if (!match) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 text-center">
        <h1 className="text-2xl font-black text-gaa-green mb-4">No Active Match</h1>
        <p className="mb-6 text-gray-600">Start a match to view player stats.</p>
        <Link href="/matches/new" className="inline-block rounded-xl bg-gaa-green px-6 py-3 font-bold text-white">
          Create New Match
        </Link>
      </div>
    );
  }

  const events = match.events;

  // Calculate per-player stats from events
  interface PlayerStats {
    goals: number;
    points: number;
    cards: number;
  }

  const homePlayerStats: Record<number, PlayerStats> = {};
  const awayPlayerStats: Record<number, PlayerStats> = {};

  events.forEach(event => {
    if (event.playerIndex === undefined) return;
    
    const stats = event.teamSide === 'home' ? homePlayerStats : awayPlayerStats;
    if (!stats[event.playerIndex]) {
      stats[event.playerIndex] = { goals: 0, points: 0, cards: 0 };
    }

    if (event.type === 'score') {
      const subtype = event.details?.subtype;
      if (subtype === 'goal') {
        stats[event.playerIndex].goals++;
      } else {
        stats[event.playerIndex].points += event.details?.isTwoPoint ? 2 : 1;
      }
    }

    if (['yellow_card', 'black_card', 'red_card'].includes(event.type)) {
      stats[event.playerIndex].cards++;
    }
  });

  // Generate player roster display
  const renderPlayerList = (teamName: string, teamSide: 'home' | 'away', isStarter: boolean) => {
    const stats = teamSide === 'home' ? homePlayerStats : awayPlayerStats;
    
    return (
      <div key={teamName} className="mb-4">
        <h3 className={`font-bold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>
          {isStarter ? `Starting 15 — ${teamName}` : `Substitutes — ${teamName}`}
        </h3>
        <div className="space-y-1">
          {Array.from({ length: isStarter ? 15 : 6 }, (_, i) => {
            const playerNumber = isStarter ? i + 1 : i + 16;
            const playerStats = stats[i];
            
            return (
              <div 
                key={playerNumber}
                className={`flex items-center gap-3 rounded-lg border p-2 ${rainMode ? 'min-h-[60px]' : ''} ${highContrast ? 'border-black' : ''}`}
              >
                <span className="font-mono font-bold w-8 text-gaa-green">#{playerNumber}</span>
                <span className={`flex-1 ${largeText ? 'text-base' : ''}`}>Player {playerNumber}</span>
                {playerStats && (
                  <div className="text-xs flex gap-2">
                    {playerStats.goals > 0 && (
                      <span className="font-bold text-green-600" title={`${playerStats.goals} goals`}>
                        {playerStats.goals}G
                      </span>
                    )}
                    {playerStats.points > 0 && (
                      <span className="font-bold text-blue-600" title={`${playerStats.points} points`}>
                        {playerStats.points}P
                      </span>
                    )}
                    {playerStats.cards > 0 && (
                      <span className="font-bold text-red-600" title={`${playerStats.cards} cards`}>
                        {playerStats.cards}C
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back Button */}
      <Link href="/matches/active" className="mb-4 inline-flex items-center gap-2 text-sm text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Match
      </Link>

      <h1 className={`${rainMode ? 'text-rain-lg' : 'text-2xl'} font-black text-gaa-green mb-6`}>
        Players & Squad
      </h1>

      {/* Unassigned Scores Warning */}
      {(() => {
        const unassignedScores = events.filter(
          e => !e.playerIndex && (e.type === 'score')
        );
        
        if (unassignedScores.length > 0) {
          return (
            <div className="mb-4 rounded-lg border border-orange-300 bg-orange-50 p-3">
              <h3 className="font-bold text-sm text-orange-700 mb-2 flex items-center gap-2">
                ⚠️ Unassigned Scores ({unassignedScores.length})
              </h3>
              {unassignedScores.slice(0, 5).map((e, idx) => (
                <div key={idx} className="text-xs flex justify-between py-1 border-b border-orange-200">
                  <span>{e.details?.subtype === 'goal' ? 'Goal' : e.details?.isTwoPoint ? '2-Point Shot' : 'Point'}</span>
                  <button className="text-blue-600 underline text-xs">Assign Player</button>
                </div>
              ))}
            </div>
          );
        }
        return null;
      })()}

      {/* Home Team */}
      {renderPlayerList(match.teamHome.name, 'home', true)}

      {/* Away Team */}
      {renderPlayerList(match.teamAway.name, 'away', true)}

      {/* Player Stats Summary */}
      <div className={`mt-6 rounded-lg border p-4 ${rainMode ? 'bg-rain-card' : ''}`}>
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gaa-green" />
          Player Stats Summary
        </h3>
        <p className={`text-xs text-gray-500 ${rainMode ? 'text-sm' : ''}`}>
          Goals, points, and cards tracked per player. Tap "Assign Player" to link unassigned scores.
        </p>

        {/* Top Scorers */}
        {(() => {
          const allStats = [...Object.entries(homePlayerStats).map(([k, v]) => ({ team: 'home', index: Number(k), ...v })), 
                            ...Object.entries(awayPlayerStats).map(([k, v]) => ({ team: 'away', index: Number(k), ...v }))];
          const topScorers = allStats
            .filter(s => s.goals > 0 || s.points > 0)
            .sort((a, b) => (b.goals * 3 + b.points) - (a.goals * 3 + a.points))
            .slice(0, 5);

          if (topScorers.length === 0) return null;

          return (
            <div className="mt-3">
              <p className={`text-sm font-semibold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>Top Scorers</p>
              {topScorers.map((s, idx) => (
                <div key={idx} className={`flex items-center gap-2 text-xs py-1 border-b ${highContrast ? 'border-gray-300' : 'border-gray-200'}`}>
                  <span className="font-bold w-6">#{idx + 1}</span>
                  <span className={`w-12 px-1 rounded text-xs ${s.team === 'home' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {s.team === 'home' ? match.teamHome.name.substring(0, 3).toUpperCase() : match.teamAway.name.substring(0, 3).toUpperCase()}
                  </span>
                  <span className="flex-1">Player {s.index + 1}</span>
                  <span className="font-bold text-green-600">{s.goals}G</span>
                  <span className="font-bold text-blue-600">{s.points}P</span>
                  <span className="font-black">{s.goals * 3 + s.points}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* UR-053: GAA Numbering Display */}
      <p className={`mt-4 text-center text-xs text-gray-400 ${rainMode ? 'text-sm' : ''}`}>
        GAA numbering: 1-15 starters, 16+ substitutes • Tap player numbers to view detailed stats
      </p>
    </div>
  );
}
