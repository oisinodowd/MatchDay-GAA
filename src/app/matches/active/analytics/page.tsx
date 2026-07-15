'use client';

import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import type { MatchEvent, Player } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { TrendingUp, Target, Award, ArrowLeft, Flag, GitBranch, XCircle, Trophy, Crosshair, Users, ArrowUpRight, RefreshCw } from 'lucide-react';
import ScoreProgressionChart from '@/components/analytics-charts/ScoreProgressionChart';
import PitchMap from '@/components/analytics-charts/PitchMap';

export default function AnalyticsPage() {
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';
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
  
  // Score events
  const scoreEvents = events.filter(e => e.type === 'score');
  
  // Scores from play (point + goal subtypes, excluding free/65m/45m)
  const playScores = scoreEvents.filter(e => 
    e.details?.subtype === 'point' || e.details?.subtype === 'goal'
  );
  const playGoals = playScores.filter(e => e.details?.subtype === 'goal').length;
  const playPoints = playScores.filter(e => e.details?.subtype === 'point' && !e.details?.isTwoPoint).length;
  
  // Scores from frees
  const freeScores = scoreEvents.filter(e => e.details?.subtype === 'free');
  const freePoints = freeScores.length;
  
  // 45's / 65's
  const setPieceScores = scoreEvents.filter(e => 
    e.details?.subtype === '65-meter' || e.details?.subtype === '45-meter'
  );
  const setPieces = setPieceScores.length;
  
  // Two-point shots
  const twoPointShots = scoreEvents.filter(e => e.details?.isTwoPoint).length;
  
  // Miss events
  const missEvents = events.filter(e => e.type === 'miss');
  const pointWides = missEvents.filter(e => e.details?.missType === 'point_wide').length;
  const goalMisses = missEvents.filter(e => e.details?.missType === 'goal_wide').length;
  const totalWides = missEvents.length;
  
  // Legacy wide events (for backward compatibility)
  const legacyWides = events.filter(e => e.type === 'point_wide' || e.type === 'goal_wide');
  const allWides = totalWides + legacyWides.length;
  
  // Shot efficiency: scores / (scores + wides + goal misses)
  const totalScores = scoreEvents.length;
  const totalShots = totalScores + allWides;
  const shotEfficiency = totalShots > 0 ? Math.round((totalScores / totalShots) * 100) : 0;
  
  // Cards
  const cardEvents = events.filter(e => ['yellow_card', 'black_card', 'red_card'].includes(e.type));

  // Marks & Turnovers
  const markEvents = events.filter(e => e.type === 'mark');
  const turnoverEvents = events.filter(e => e.type === 'turnover');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back Button */}
      <Link href="/matches/active" className="mb-4 inline-flex items-center gap-2 text-sm text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Match
      </Link>

      <h1 className={`${rainMode ? 'text-rain-lg' : 'text-2xl'} font-bold text-gaa-green mb-6`}>
        Analytics Dashboard
      </h1>

      {/* Match Score */}
      <div className="mb-6 card-elevated p-4">
        <p className={`font-semibold text-center ${largeText ? 'text-lg' : ''}`}>
          {match.teamHome.name} {match.teamHome.goals}-{match.teamHome.points} — {match.teamAway.goals}-{match.teamAway.points} {match.teamAway.name}
        </p>
      </div>

      {/* ── Primary Stats Row ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <Target className="w-5 h-5" />, label: 'Total Scores', value: totalScores, color: 'text-blue-600' },
          { icon: <XCircle className="w-5 h-5" />, label: 'Wides', value: allWides, color: 'text-red-600' },
          { icon: <Trophy className="w-5 h-5" />, label: 'Goals', value: scoreEvents.filter(e => e.details?.subtype === 'goal').length, color: 'text-green-600' },
          { icon: <ArrowUpRight className="w-5 h-5" />, label: 'Marks', value: markEvents.length, color: 'text-emerald-600' },
          { icon: <RefreshCw className="w-5 h-5" />, label: 'Turnovers', value: turnoverEvents.length, color: 'text-blue-600' },
          { icon: <Award className="w-5 h-5" />, label: 'Cards', value: cardEvents.length, color: 'text-yellow-600' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className={`card-elevated p-4 ${rainMode ? 'p-4' : ''}`}>
            <div className={`${color} mb-2`}>{icon}</div>
            <div className={`font-bold ${largeText ? 'text-xl' : rainMode ? 'text-rain-md' : 'text-2xl'} ${color}`}>{value}</div>
            <div className={`text-xs font-medium uppercase tracking-wider text-gray-500`}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Scoring Breakdown ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: <Target className="w-5 h-5" />, label: 'Points (Play)', value: playPoints, color: 'text-blue-600' },
          { icon: <Trophy className="w-5 h-5" />, label: 'Goals (Play)', value: playGoals, color: 'text-green-600' },
          { icon: <Flag className="w-5 h-5" />, label: 'Frees Scored', value: freePoints, color: 'text-amber-600' },
          { icon: <GitBranch className="w-5 h-5" />, label: "45's / 65's", value: setPieces, color: 'text-purple-600' },
          { icon: <Crosshair className="w-5 h-5" />, label: '2-Point Shots', value: twoPointShots, color: 'text-orange-600' },
          { icon: <span className="text-lg leading-none">🥅</span>, label: 'Goal Misses', value: goalMisses, color: 'text-rose-600' },
          { icon: <XCircle className="w-5 h-5" />, label: 'Point Wides', value: pointWides, color: 'text-red-600' },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Shot Efficiency', value: `${shotEfficiency}%`, color: 'text-emerald-600' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className={`card-elevated p-4 ${rainMode ? 'p-4' : ''}`}>
            <div className={`${color} mb-2`}>{icon}</div>
            <div className={`font-bold ${largeText ? 'text-xl' : rainMode ? 'text-rain-md' : 'text-2xl'} ${color}`}>{value}</div>
            <div className={`text-xs font-medium uppercase tracking-wider text-gray-500`}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Team Breakdown ── */}
      <div className={`mb-6 card-elevated p-4 ${rainMode ? 'bg-rain-card' : ''}`}>
        <h3 className={`font-semibold mb-4 text-xs uppercase tracking-wider text-gray-500`}>Team Breakdown</h3>
        <div className="space-y-3">
          {/* Home Team */}
          <div>
            <p className={`text-sm font-semibold ${rainMode ? 'text-rain-md' : ''}`}>{match.teamHome.name}</p>
            <div className="flex gap-4 text-xs mt-1.5 text-gray-600">
              <span>{match.teamHome.goals}G</span>
              <span>{match.teamHome.points}P</span>
              <span className={`font-semibold`}>{match.teamHome.goals * 3 + match.teamHome.points} pts</span>
            </div>
          </div>
          {/* Away Team */}
          <div>
            <p className={`text-sm font-semibold ${rainMode ? 'text-rain-md' : ''}`}>{match.teamAway.name}</p>
            <div className="flex gap-4 text-xs mt-1.5 text-gray-600">
              <span>{match.teamAway.goals}G</span>
              <span>{match.teamAway.points}P</span>
              <span className={`font-semibold`}>{match.teamAway.goals * 3 + match.teamAway.points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Per-Team Shot Breakdown ── */}
      <div className={`mb-6 card-elevated p-4 ${rainMode ? 'bg-rain-card' : ''}`}>
        <h3 className={`font-semibold mb-3 text-xs uppercase tracking-wider text-gray-500`}>Per Team: Scores &amp; Wides</h3>
        {(['home', 'away'] as const).map((side) => {
          const sideScores = scoreEvents.filter(e => e.teamSide === side);
          const sideMisses = missEvents.filter(e => e.teamSide === side);
          const sidePlayScores = sideScores.filter(e => e.details?.subtype === 'point' || e.details?.subtype === 'goal');
          const sideFreeScores = sideScores.filter(e => e.details?.subtype === 'free');
          const sideSetPieces = sideScores.filter(e => e.details?.subtype === '65-meter' || e.details?.subtype === '45-meter');
          const sideWides = sideMisses.filter(e => e.details?.missType === 'point_wide');
          const sideGoalMisses = sideMisses.filter(e => e.details?.missType === 'goal_wide');
          const sideMarks = markEvents.filter(e => e.teamSide === side);
          const sideTurnovers = turnoverEvents.filter(e => e.teamSide === side);
          const name = side === 'home' ? match.teamHome.name : match.teamAway.name;
          const color = side === 'home' ? 'text-blue-600' : 'text-red-600';
          
          return (
            <div key={side} className="mb-3 last:mb-0">
              <p className={`text-sm font-semibold ${color} mb-1`}>{name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>Play: {sidePlayScores.length}</span>
                <span>Frees: {sideFreeScores.length}</span>
                <span>45&apos;s: {sideSetPieces.length}</span>
                <span>Wides: {sideWides.length}</span>
                <span>Goal misses: {sideGoalMisses.length}</span>
                <span className="font-medium" style={{ color: '#16a34a' }}>Marks: {sideMarks.length}</span>
                <span className="font-medium" style={{ color: '#2563eb' }}>TO: {sideTurnovers.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Per-Player Shot Breakdown ── */}
      <PerPlayerBreakdown
        events={events}
        homePlayers={match.teamHome.players}
        awayPlayers={match.teamAway.players}
        homeTeamName={match.teamHome.name}
        awayTeamName={match.teamAway.name}
        rainMode={rainMode}
        largeText={largeText}
      />

      {/* Score Progression Chart */}
      <ScoreProgressionChart />

      {/* Pitch Map */}
      <div className="mt-4">
        <PitchMap />
      </div>

      {/* ── Scoring Zone Breakdown ── */}
      <div className={`mt-4 card-elevated p-4 ${rainMode ? 'bg-rain-card' : ''}`}>
        <h3 className={`font-semibold mb-3 text-xs uppercase tracking-wider text-gray-500`}>Scoring Source Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: 'From Play', count: playScores.length, color: 'bg-blue-500' },
            { label: 'From Frees', count: freeScores.length, color: 'bg-amber-500' },
            { label: "45's / 65's", count: setPieces, color: 'bg-purple-500' },
            { label: '2-Point Shots', count: twoPointShots, color: 'bg-orange-500' },
            { label: 'Wides', count: allWides, color: 'bg-red-500' },
            { label: 'Goal Misses', count: goalMisses, color: 'bg-rose-500' },
            { label: 'Marks', count: markEvents.length, color: 'bg-emerald-500' },
            { label: 'Turnovers', count: turnoverEvents.length, color: 'bg-blue-500' },
          ].map(({ label, count, color }) => {
            const maxCount = Math.max(
              playScores.length, freeScores.length, setPieceScores.length, 
              twoPointShots, allWides, goalMisses, markEvents.length, turnoverEvents.length, 1
            );
            return (
              <div key={label} className="flex items-center gap-3">
                <span className={`text-xs w-24 font-medium ${rainMode ? 'text-rain-sm' : ''}`}>{label}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div className={`${color} h-full transition-all`} style={{ width: `${Math.min(100, (count / maxCount) * 100)}%` }} />
                </div>
                <span className={`text-xs font-mono w-6 text-right font-semibold ${rainMode ? 'text-rain-sm' : ''}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Per-Player Shot Breakdown Component ──

interface PlayerShotStats {
  name: string;
  number: number;
  scores: number;
  wides: number;
  goalMisses: number;
  marks: number;
  turnovers: number;
  totalShots: number;
  efficiency: number;
}

function PerPlayerBreakdown({
  events,
  homePlayers,
  awayPlayers,
  homeTeamName,
  awayTeamName,
  rainMode,
  largeText,
}: {
  events: MatchEvent[];
  homePlayers: Player[];
  awayPlayers: Player[];
  homeTeamName: string;
  awayTeamName: string;
  rainMode: boolean;
  largeText: boolean;
}) {
  function computePlayerStats(
    players: Player[],
    teamSide: 'home' | 'away'
  ): PlayerShotStats[] {
    return players
      .map((player, index) => {
        const playerEvents = events.filter(
          (e) => e.teamSide === teamSide && e.playerIndex === index
        );

        const scores = playerEvents.filter(
          (e) => e.type === 'score'
        ).length;

        const wides = playerEvents.filter(
          (e) => e.type === 'miss' && e.details?.missType === 'point_wide'
        ).length;

        const goalMisses = playerEvents.filter(
          (e) => e.type === 'miss' && e.details?.missType === 'goal_wide'
        ).length;

        const marks = playerEvents.filter(
          (e) => e.type === 'mark'
        ).length;

        const turnovers = playerEvents.filter(
          (e) => e.type === 'turnover'
        ).length;

        const totalShots = scores + wides + goalMisses;
        const efficiency = totalShots > 0 ? Math.round((scores / totalShots) * 100) : 0;

        return {
          name: player.name,
          number: player.number,
          scores,
          wides,
          goalMisses,
          marks,
          turnovers,
          totalShots,
          efficiency,
        };
      })
      .filter((p) => p.totalShots > 0)
      .sort((a, b) => b.totalShots - a.totalShots);
  }

  const homeStats = computePlayerStats(homePlayers, 'home');
  const awayStats = computePlayerStats(awayPlayers, 'away');

  if (homeStats.length === 0 && awayStats.length === 0) return null;

  return (
    <div className={`mb-6 card-elevated p-4 ${rainMode ? 'bg-rain-card' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gaa-green" />
        <h3 className={`font-semibold text-xs uppercase tracking-wider text-gray-500`}>
          Per-Player Shot Breakdown
        </h3>
      </div>

      {([
        { name: homeTeamName, stats: homeStats, color: 'text-blue-600', barColor: 'bg-blue-500' },
        { name: awayTeamName, stats: awayStats, color: 'text-red-600', barColor: 'bg-red-500' },
      ] as const).map(({ name, stats, color }) => {
        if (stats.length === 0) return null;

        return (
          <div key={name} className="mb-4 last:mb-0">
            <p className={`text-sm font-semibold ${color} mb-2`}>{name}</p>

            {/* Table header */}
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1 px-1">
              <span className="w-6 text-center">#</span>
              <span className="flex-1">Player</span>
              <span className="w-8 text-center">S</span>
              <span className="w-8 text-center">W</span>
              <span className="w-8 text-center">GM</span>
              <span className="w-7 text-center">M</span>
              <span className="w-7 text-center">T</span>
              <span className="w-12 text-right">Eff</span>
            </div>

            {stats.map((player) => (
              <div
                key={`${name}-${player.number}`}
                className="flex items-center gap-1 py-1.5 px-1 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded transition-colors"
              >
                {/* Jersey # */}
                <span
                  className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor:
                      player.number === 1
                        ? '#fbbf24'
                        : player.number <= 8
                        ? '#dbeafe'
                        : player.number <= 12
                        ? '#d1fae5'
                        : '#fee2e2',
                    color:
                      player.number === 1
                        ? '#92400e'
                        : player.number <= 8
                        ? '#1e40af'
                        : player.number <= 12
                        ? '#065f46'
                        : '#991b1b',
                  }}
                >
                  {player.number}
                </span>

                {/* Name */}
                <span
                  className={`flex-1 text-sm font-medium truncate ${rainMode ? 'text-rain-sm' : ''}`}
                  style={{ color: '#1f2937' }}
                >
                  {player.name}
                </span>

                {/* Scores */}
                <span
                  className="w-8 text-center text-xs font-semibold"
                  style={{ color: '#16a34a' }}
                >
                  {player.scores}
                </span>

                {/* Wides */}
                <span
                  className="w-8 text-center text-xs"
                  style={{ color: '#dc2626' }}
                >
                  {player.wides}
                </span>

                {/* Goal misses */}
                <span
                  className="w-8 text-center text-xs"
                  style={{ color: '#e11d48' }}
                >
                  {player.goalMisses}
                </span>

                {/* Marks */}
                <span
                  className="w-7 text-center text-xs font-medium"
                  style={{ color: '#16a34a' }}
                >
                  {player.marks}
                </span>

                {/* Turnovers */}
                <span
                  className="w-7 text-center text-xs font-medium"
                  style={{ color: '#2563eb' }}
                >
                  {player.turnovers}
                </span>

                {/* Efficiency bar */}
                <div className="w-12 flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        player.efficiency >= 66
                          ? 'bg-emerald-500'
                          : player.efficiency >= 33
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${player.efficiency}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      largeText ? 'text-xs' : ''
                    }`}
                    style={{
                      color:
                        player.efficiency >= 66
                          ? '#059669'
                          : player.efficiency >= 33
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  >
                    {player.efficiency}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-2 border-t border-gray-100">
        <span className="text-[10px] text-gray-400">
          <span style={{ color: '#16a34a', fontWeight: 700 }}>S</span> Scores
        </span>
        <span className="text-[10px] text-gray-400">
          <span style={{ color: '#dc2626', fontWeight: 700 }}>W</span> Wides
        </span>
        <span className="text-[10px] text-gray-400">
          <span style={{ color: '#e11d48', fontWeight: 700 }}>GM</span> Goal Misses
        </span>
        <span className="text-[10px] text-gray-400">
          <span style={{ color: '#16a34a', fontWeight: 700 }}>M</span> Marks
        </span>
        <span className="text-[10px] text-gray-400">
          <span style={{ color: '#2563eb', fontWeight: 700 }}>T</span> Turnovers
        </span>
        <span className="text-[10px] text-gray-400">
          <span style={{ color: '#059669', fontWeight: 700 }}>Eff</span> Efficiency
        </span>
      </div>
    </div>
  );
}
