'use client';

import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { BarChart3, TrendingUp, Target, Award, ArrowLeft } from 'lucide-react';
import ScoreProgressionChart from '@/components/analytics-charts/ScoreProgressionChart';
import PitchMap from '@/components/analytics-charts/PitchMap';

export default function AnalyticsPage() {
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';
  const highContrast = accessibilityMode === 'high-contrast';
  const largeText = accessibilityMode === 'large-text';

  if (!match) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 text-center">
        <h1 className="text-2xl font-black text-gaa-green mb-4">No Active Match</h1>
        <p className="mb-6 text-gray-600">Start a match to view analytics.</p>
        <Link href="/matches/new" className="inline-block rounded-xl bg-gaa-green px-6 py-3 font-bold text-white">
          Create New Match
        </Link>
      </div>
    );
  }

  const events = match.events;
  
  // Compute basic stats from events
  const scoreEvents = events.filter(e => e.type === 'score');
  const homeScores = scoreEvents.filter(e => e.teamSide === 'home').length;
  const awayScores = scoreEvents.filter(e => e.teamSide === 'away').length;
  const cardEvents = events.filter(e => ['yellow_card', 'black_card', 'red_card'].includes(e.type));
  const subEvents = events.filter(e => e.type === 'substitution');

  // Count two-point shots (outside 40m arc)
  const twoPointShots = scoreEvents.filter(e => e.details?.isTwoPoint).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back Button */}
      <Link href="/matches/active" className="mb-4 inline-flex items-center gap-2 text-sm text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Match
      </Link>

      <h1 className={`${rainMode ? 'text-rain-lg' : 'text-2xl'} font-black text-gaa-green mb-6`}>
        Analytics Dashboard
      </h1>

      {/* Match Info */}
      <div className={`mb-6 rounded-xl border-2 p-4 ${highContrast ? 'border-black' : 'border-gray-300'}`}>
        <p className={`font-bold text-center ${largeText ? 'text-lg' : ''}`}>
          {match.teamHome.name} {match.teamHome.goals}-{match.teamHome.points} — {match.teamAway.goals}-{match.teamAway.points} {match.teamAway.name}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: <Target className="w-5 h-5" />, label: 'Total Scores', value: scoreEvents.length },
          { icon: <Award className="w-5 h-5" />, label: 'Cards', value: cardEvents.length },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Substitutions', value: Math.floor(subEvents.length / 2) || subEvents.length },
          { icon: <BarChart3 className="w-5 h-5" />, label: '2-Point Shots', value: twoPointShots },
        ].map(({ icon, label, value }) => (
          <div key={label} className={`rounded-lg border p-3 ${rainMode ? 'p-4' : ''}`}>
            <div className="text-gaa-green mb-1">{icon}</div>
            <div className={`font-bold ${largeText ? 'text-xl' : rainMode ? 'text-rain-md' : ''}`}>{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Team Breakdown */}
      <div className={`mb-6 rounded-lg border p-4 ${rainMode ? 'bg-rain-card' : ''}`}>
        <h3 className="font-bold mb-3">Team Breakdown</h3>
        <div className="space-y-2">
          {/* Home Team */}
          <div>
            <p className={`text-sm font-semibold ${rainMode ? 'text-rain-md' : ''}`}>{match.teamHome.name}</p>
            <div className="flex gap-4 text-xs mt-1">
              <span>{match.teamHome.goals}G</span>
              <span>{match.teamHome.points}P</span>
              <span className="font-bold">{match.teamHome.goals * 3 + match.teamHome.points} pts</span>
            </div>
          </div>
          {/* Away Team */}
          <div>
            <p className={`text-sm font-semibold ${rainMode ? 'text-rain-md' : ''}`}>{match.teamAway.name}</p>
            <div className="flex gap-4 text-xs mt-1">
              <span>{match.teamAway.goals}G</span>
              <span>{match.teamAway.points}P</span>
              <span className="font-bold">{match.teamAway.goals * 3 + match.teamAway.points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Progression Chart */}
      <ScoreProgressionChart />

      {/* Pitch Map */}
      <div className="mt-4">
        <PitchMap />
      </div>

      {/* Scoring Zone Breakdown */}
      <div className={`mt-4 rounded-lg border p-4 ${rainMode ? 'bg-rain-card' : ''}`}>
        <h3 className="font-bold mb-2">Scoring Zones</h3>
        <div className="space-y-2">
          {[
            { label: 'Inside 20m', count: scoreEvents.filter(e => !e.details?.isTwoPoint).length, color: 'bg-green-500' },
            { label: 'Outside 40m Arc (2pt)', count: twoPointShots, color: 'bg-orange-500' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={`text-xs w-32 ${rainMode ? 'text-rain-sm' : ''}`}>{label}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className={`${color} h-full transition-all`} style={{ width: `${scoreEvents.length > 0 ? Math.min(100, (count / scoreEvents.length) * 100) : 0}%` }} />
              </div>
              <span className={`text-xs font-mono w-6 text-right ${rainMode ? 'text-rain-sm' : ''}`}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
