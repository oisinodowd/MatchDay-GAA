'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMatchStore, Player, Team } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ArrowLeft, Trophy, MapPin, User, Shield, Users, FolderOpen, Trash2, Loader2 } from 'lucide-react';
import TeamSheetBuilder from '@/components/team-sheet/TeamSheetBuilder';
import { db, type SavedTeamSheet } from '@/lib/db/matchday-db';

// GAA match durations by grade (minutes per half) — UR-042
const GRADE_DURATIONS: Record<string, number> = {
  senior: 35,
  intermediate: 30,
  junior: 25,
  under21: 30,
  minor: 25,
};

// Common GAA competitions — UR-085
const COMPETITIONS = [
  { value: '', label: 'Select competition...' },
  { value: 'all_ireland_sfc', label: 'All-Ireland Senior Football Championship' },
  { value: 'national_league', label: 'National Football League' },
  { value: 'ulster_sfc', label: 'Ulster Senior Football Championship' },
  { value: 'leinster_sfc', label: 'Leinster Senior Football Championship' },
  { value: 'munster_sfc', label: 'Munster Senior Football Championship' },
  { value: 'connaught_sfc', label: 'Connacht Senior Football Championship' },
];

export default function NewMatchPage() {
  const router = useRouter();
  const createMatch = useMatchStore((s) => s.createMatch);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';

  const [sport, setSport] = useState<'gaelic-football' | 'hurling'>('gaelic-football');
  const [grade, setGrade] = useState<string>('senior');
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [venue, setVenue] = useState('');
  const [referee, setReferee] = useState('');
  const [competition, setCompetition] = useState('');
  
  // Team sheet state
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [showHomeSheet, setShowHomeSheet] = useState(false);
  const [showAwaySheet, setShowAwaySheet] = useState(false);

  // Load past team sheets state
  const [pastTeamSheets, setPastTeamSheets] = useState<SavedTeamSheet[]>([]);
  const [loadingTeamSheets, setLoadingTeamSheets] = useState(true);
  const [showLoadSheet, setShowLoadSheet] = useState(false);

  // Load past team sheets on mount
  useEffect(() => {
    async function loadTeamSheets() {
      try {
        const sheets = await db.teamsheets.toArray();
        setPastTeamSheets(sheets);
      } catch (error) {
        console.error('Failed to load team sheets:', error);
      } finally {
        setLoadingTeamSheets(false);
      }
    }
    loadTeamSheets();
  }, []);

  const handleLoadSheet = async (sheet: SavedTeamSheet, targetSide: 'home' | 'away') => {
    const players: Player[] = sheet.players.map(p => ({
      id: p.id,
      playerId: p.playerId,
      name: p.name,
      number: p.number,
      position: p.position,
      isStarter: p.isStarter,
      goals: 0,
      points: 0,
      yellowCards: 0,
      blackCards: 0,
      redCards: 0,
      isSubstituted: false,
    }));

    if (targetSide === 'home') {
      setHomePlayers(players);
      setHomeTeamName(sheet.name);
    } else {
      setAwayPlayers(players);
      setAwayTeamName(sheet.name);
    }
    setShowLoadSheet(false);
  };

  const handleDeleteSheet = async (sheetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.teamsheets.delete(sheetId);
    setPastTeamSheets(prev => prev.filter(s => s.id !== sheetId));
  };

  const handleCreate = () => {
    if (!homeTeamName || !awayTeamName) return;

    // Validate team sheets have at least 15 players each
    if (homePlayers.length < 15 || awayPlayers.length < 15) {
      alert('Please add at least 15 players to each team sheet before creating the match.');
      return;
    }

    const homeTeam: Team = {
      name: homeTeamName,
      shortCode: homeTeamName.substring(0, 3).toUpperCase(),
      goals: 0,
      points: 0,
      players: homePlayers,
    };

    const awayTeam: Team = {
      name: awayTeamName,
      shortCode: awayTeamName.substring(0, 3).toUpperCase(),
      goals: 0,
      points: 0,
      players: awayPlayers,
    };

    createMatch(homeTeam, awayTeam, sport);

    if (venue || referee) {
      const { match } = useMatchStore.getState();
      if (match) {
        useMatchStore.setState({
          match: { ...match, venue, referee }
        });
      }
    }

    const { startMatch } = useMatchStore.getState();
    startMatch();
    router.push('/matches/active');
  };

  const canCreateMatch = homeTeamName && awayTeamName && homePlayers.length >= 15 && awayPlayers.length >= 15;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back Button */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`font-bold tracking-tight ${rainMode ? 'text-rain-lg' : 'text-3xl'} text-gaa-green`}>
          New Match
        </h1>
        <p className={`mt-1 ${rainMode ? 'text-rain-sm' : 'text-sm'} text-gray-500`}>
          Set up a match in under 60 seconds
        </p>
      </div>

      {/* Sport Selection */}
      <div className="mb-6">
        <label className={`block mb-2 text-sm font-semibold ${rainMode ? 'text-rain-md' : ''}`}>Sport</label>
        <div className="flex gap-3">
          {(['gaelic-football', 'hurling'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`flex-1 rounded-xl border p-4 text-center transition ${
                sport === s
                  ? 'border-gaa-green bg-gaa-green-muted font-semibold'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Trophy className={`w-6 h-6 mx-auto mb-1 ${
                sport === s ? 'text-gaa-green' : 'text-gray-400'
              }`} />
              <span className={`capitalize text-sm ${rainMode ? 'text-rain-sm' : ''}`}>
                {s === 'gaelic-football' ? 'Football' : 'Hurling'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Match Details Card */}
      <div className="card-elevated p-5 mb-6">
        <h2 className={`text-sm font-semibold mb-4 ${rainMode ? 'text-rain-md' : ''}`}>Match Details</h2>
        
        <div className="space-y-4">
          {/* Grade */}
          <div>
            <label className={`block mb-1.5 text-xs font-medium text-gray-600 ${rainMode ? 'text-rain-sm' : ''}`}>Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={`input-field ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
            >
              {Object.keys(GRADE_DURATIONS).map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)} ({GRADE_DURATIONS[g]} min/half)
                </option>
              ))}
            </select>
          </div>

          {/* Competition */}
          <div>
            <label className={`block mb-1.5 text-xs font-medium text-gray-600 ${rainMode ? 'text-rain-sm' : ''}`}>Competition</label>
            <select
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              className={`input-field ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
            >
              {COMPETITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Venue */}
          <div className="relative">
            <label className={`block mb-1.5 text-xs font-medium text-gray-600 ${rainMode ? 'text-rain-sm' : ''}`}>Venue</label>
            <MapPin className="absolute left-3 top-[2.4rem] w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Croke Park, Páirc Tailteann..."
              className={`input-field pl-9 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
            />
          </div>

          {/* Referee */}
          <div className="relative">
            <label className={`block mb-1.5 text-xs font-medium text-gray-600 ${rainMode ? 'text-rain-sm' : ''}`}>Referee</label>
            <User className="absolute left-3 top-[2.4rem] w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={referee}
              onChange={(e) => setReferee(e.target.value)}
              placeholder="Enter referee name..."
              className={`input-field pl-9 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Teams Card */}
      <div className="card-elevated p-5 mb-4">
        <h2 className={`text-sm font-semibold mb-4 ${rainMode ? 'text-rain-md' : ''}`}>Teams</h2>
        
        <div className="space-y-4">
          {/* Home Team */}
          <div className="relative">
            <label className={`block mb-1.5 text-xs font-medium text-gray-600 ${rainMode ? 'text-rain-sm' : ''}`}>Home Team</label>
            <Shield className="absolute left-3 top-[2.4rem] w-4 h-4 text-blue-500" />
            <input
              type="text"
              value={homeTeamName}
              onChange={(e) => setHomeTeamName(e.target.value)}
              placeholder="Enter team name..."
              className={`input-field pl-9 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
            />
          </div>

          {/* Away Team */}
          <div className="relative">
            <label className={`block mb-1.5 text-xs font-medium text-gray-600 ${rainMode ? 'text-rain-sm' : ''}`}>Away Team</label>
            <Shield className="absolute left-3 top-[2.4rem] w-4 h-4 text-red-500" />
            <input
              type="text"
              value={awayTeamName}
              onChange={(e) => setAwayTeamName(e.target.value)}
              placeholder="Enter team name..."
              className={`input-field pl-9 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Load Past Team Sheet Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowLoadSheet(!showLoadSheet)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
            showLoadSheet ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <h3 className={`font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
                Load Past Team Sheet
              </h3>
              <p className={`text-xs text-gray-500`}>
                {loadingTeamSheets ? 'Loading...' : `${pastTeamSheets.length} saved sheets`}
              </p>
            </div>
          </div>
        </button>

        {showLoadSheet && (
          <div className="mt-3 space-y-2">
            {loadingTeamSheets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : pastTeamSheets.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No saved team sheets yet</p>
            ) : (
              pastTeamSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  onClick={() => handleLoadSheet(sheet, homePlayers.length === 0 ? 'home' : 'away')}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{sheet.name}</p>
                    <p className="text-xs text-gray-500">
                      {sheet.players.length} players • {new Date(sheet.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSheet(sheet.id, e)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Team Sheets Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowHomeSheet(!showHomeSheet)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
            showHomeSheet ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-500" />
            <div className="text-left">
              <h3 className={`font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
                {homeTeamName || 'Home Team'} Sheet
              </h3>
              <p className={`text-xs text-gray-500`}>
                {homePlayers.length}/15 players • {homePlayers.filter(p => p.isStarter).length} starters
              </p>
            </div>
          </div>
          <Users className="w-5 h-5 text-gray-400" />
        </button>

        {showHomeSheet && (
          <TeamSheetBuilder 
            teamName={homeTeamName || 'Home Team'} 
            teamSide="home"
            initialPlayers={homePlayers.length > 0 ? homePlayers : undefined}
            onPlayersChange={(players) => setHomePlayers(players)}
          />
        )}
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowAwaySheet(!showAwaySheet)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
            showAwaySheet ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-500" />
            <div className="text-left">
              <h3 className={`font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
                {awayTeamName || 'Away Team'} Sheet
              </h3>
              <p className={`text-xs text-gray-500`}>
                {awayPlayers.length}/15 players • {awayPlayers.filter(p => p.isStarter).length} starters
              </p>
            </div>
          </div>
          <Users className="w-5 h-5 text-gray-400" />
        </button>

        {showAwaySheet && (
          <TeamSheetBuilder 
            teamName={awayTeamName || 'Away Team'} 
            teamSide="away"
            initialPlayers={awayPlayers.length > 0 ? awayPlayers : undefined}
            onPlayersChange={(players) => setAwayPlayers(players)}
          />
        )}
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!canCreateMatch}
        className={`btn-primary w-full py-3.5 text-center ${
          canCreateMatch ? '' : 'bg-gray-300 cursor-not-allowed'
        } ${rainMode ? 'text-rain-md min-h-[60px]' : ''}`}
      >
        Create Match {canCreateMatch && `(${homePlayers.length + awayPlayers.length} players)`}
      </button>

      {!canCreateMatch && (
        <p className="mt-2 text-center text-xs text-gray-500">
          {!homeTeamName && '• Enter home team name'}
          {homeTeamName && !awayTeamName && ' • Enter away team name'}
          {homeTeamName && awayTeamName && homePlayers.length < 15 && ` • Add ${15 - homePlayers.length} more players to ${homeTeamName}`}
          {homeTeamName && awayTeamName && homePlayers.length >= 15 && awayPlayers.length < 15 && ` • Add ${15 - awayPlayers.length} more players to ${awayTeamName}`}
        </p>
      )}
    </div>
  );
}
