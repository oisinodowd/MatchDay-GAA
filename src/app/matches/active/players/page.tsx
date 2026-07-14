'use client';

import Link from 'next/link';
import { useMatchStore, Player } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ArrowLeft, User, Trophy, Search, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function PlayersPage() {
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';
  const largeText = accessibilityMode === 'large-text';

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'starter' | 'substitute'>('all');

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

  // Get team players with their stats
  const getTeamPlayersWithStats = (teamSide: 'home' | 'away') => {
    const team = teamSide === 'home' ? match.teamHome : match.teamAway;
    const stats = teamSide === 'home' ? homePlayerStats : awayPlayerStats;
    
    return team.players.map((player, index) => ({
      player,
      stats: stats[index] || { goals: 0, points: 0, cards: 0 },
      teamSide,
    }));
  };

  const homePlayersWithStats = getTeamPlayersWithStats('home');
  const awayPlayersWithStats = getTeamPlayersWithStats('away');

  // Filter players based on search and filters
  const filteredPlayers = useMemo(() => {
    const allPlayers = [
      ...homePlayersWithStats.map(p => ({ ...p, teamName: match.teamHome.name })),
      ...awayPlayersWithStats.map(p => ({ ...p, teamName: match.teamAway.name })),
    ];

    return allPlayers.filter(({ player, teamSide }) => {
      // Team filter
      if (filterTeam !== 'all' && teamSide !== filterTeam) return false;
      
      // Role filter
      if (filterRole === 'starter' && !player.isStarter) return false;
      if (filterRole === 'substitute' && player.isStarter) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          player.name.toLowerCase().includes(search) ||
          player.number.toString().includes(search) ||
          (player.position || '').toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }, [homePlayersWithStats, awayPlayersWithStats, filterTeam, filterRole, searchTerm]);

  // Render player row with photo and stats
  const renderPlayerRow = (player: Player, stats: PlayerStats, teamSide: 'home' | 'away', index: number) => {
    const teamName = teamSide === 'home' ? match.teamHome.name : match.teamAway.name;
    const teamColor = teamSide === 'home' ? 'blue' : 'red';
    
    return (
      <div 
        key={player.id || index}
        className={`flex items-center gap-3 p-3 rounded-lg border ${rainMode ? 'min-h-[70px]' : ''} ${
          player.isStarter ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'
        }`}
      >
        {/* Player Photo */}
        <div className="relative flex-shrink-0">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.name || `Player ${index + 1}`}
              className={`w-10 h-10 rounded-full object-cover border-2 border-${teamColor}-300`}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-${teamColor}-100 flex items-center justify-center border-2 border-${teamColor}-300`}>
              <span className={`text-sm font-bold text-${teamColor}-700`}>{player.number}</span>
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-${teamColor}-600`}>#{player.number}</span>
            <span className={`font-semibold truncate ${largeText ? 'text-base' : ''}`}>
              {player.name || `Player ${index + 1}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`px-1.5 py-0.5 rounded ${getPositionColor(player.position)}`}>
              {player.position || 'SUB'}
            </span>
            {player.isStarter ? (
              <span className="text-green-600 font-medium">Starter</span>
            ) : (
              <span className="text-orange-600 font-medium">Substitute</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm">
          {stats.goals > 0 && (
            <div className="text-center" title={`${stats.goals} goals`}>
              <span className="font-bold text-green-600">{stats.goals}</span>
              <span className="text-xs text-gray-500 block">G</span>
            </div>
          )}
          {stats.points > 0 && (
            <div className="text-center" title={`${stats.points} points`}>
              <span className="font-bold text-blue-600">{stats.points}</span>
              <span className="text-xs text-gray-500 block">P</span>
            </div>
          )}
          {stats.cards > 0 && (
            <div className="text-center" title={`${stats.cards} cards`}>
              <span className="font-bold text-red-600">{stats.cards}</span>
              <span className="text-xs text-gray-500 block">C</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case 'GK': return 'bg-yellow-100 text-yellow-700';
      case 'DEF': return 'bg-blue-100 text-blue-700';
      case 'MID': return 'bg-green-100 text-green-700';
      case 'FWD': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Get top scorers from all players
  const topScorers = useMemo(() => {
    const allPlayers = [
      ...homePlayersWithStats.map((p, i) => ({ team: 'home' as const, index: i, player: p.player, stats: homePlayerStats[i] || { goals: 0, points: 0 } })),
      ...awayPlayersWithStats.map((p, i) => ({ team: 'away' as const, index: i, player: p.player, stats: awayPlayerStats[i] || { goals: 0, points: 0 } })),
    ];

    return allPlayers
      .filter(p => p.stats.goals > 0 || p.stats.points > 0)
      .sort((a, b) => (b.stats.goals * 3 + b.stats.points) - (a.stats.goals * 3 + a.stats.points))
      .slice(0, 5);
  }, [homePlayersWithStats, awayPlayersWithStats]);

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

      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search players by name, number, or position..."
            className={`input-field pl-9 ${rainMode ? 'min-h-[50px] text-lg' : ''}`}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value as 'all' | 'home' | 'away')}
            className={`input-field text-sm ${rainMode ? 'min-h-[40px] text-base' : ''}`}
          >
            <option value="all">All Teams</option>
            <option value="home">{match.teamHome.name}</option>
            <option value="away">{match.teamAway.name}</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as 'all' | 'starter' | 'substitute')}
            className={`input-field text-sm ${rainMode ? 'min-h-[40px] text-base' : ''}`}
          >
            <option value="all">All Players</option>
            <option value="starter">Starters Only</option>
            <option value="substitute">Substitutes Only</option>
          </select>
        </div>
      </div>

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

      {/* Filtered Players List */}
      {filteredPlayers.length > 0 ? (
        <div className="space-y-2 mb-6">
          {filteredPlayers.map(({ player, stats, teamSide }, index) => (
            renderPlayerRow(player, stats, teamSide, index)
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No players match your filters.
        </div>
      )}

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
        {topScorers.length > 0 && (
          <div className="mt-3">
            <p className={`text-sm font-semibold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>Top Scorers</p>
            {topScorers.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-200">
                <span className="font-bold w-6">#{idx + 1}</span>
                <span className={`w-16 px-1.5 rounded text-xs font-medium ${s.team === 'home' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {s.team === 'home' ? match.teamHome.shortCode || match.teamHome.name.substring(0, 3).toUpperCase() : match.teamAway.shortCode || match.teamAway.name.substring(0, 3).toUpperCase()}
                </span>
                <span className="flex-1 truncate">
                  {s.player.name || `Player ${s.index + 1}`}
                </span>
                <span className="font-bold text-green-600">{s.stats.goals}G</span>
                <span className="font-bold text-blue-600">{s.stats.points}P</span>
                <span className="font-black">{s.stats.goals * 3 + s.stats.points}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GAA Numbering Display */}
      <p className={`mt-4 text-center text-xs text-gray-400 ${rainMode ? 'text-sm' : ''}`}>
        GAA numbering: 1-15 starters, 16+ substitutes • Tap player numbers to view detailed stats
      </p>
    </div>
  );
}
