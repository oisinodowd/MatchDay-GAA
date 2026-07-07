'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';

// GAA match durations by grade (minutes per half) — UR-042
const GRADE_DURATIONS: Record<string, number> = {
  senior: 35,        // Senior inter-county: 70 min total (35+35)
  intermediate: 30,  // Adult standard: 60 min total (30+30)
  junior: 25,        // Junior: 50 min total (25+25)
  under21: 30,       // Under-21: 60 min total
  minor: 25,         // Minor: 50 min total
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
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [venue, setVenue] = useState('');
  const [referee, setReferee] = useState('');
  const [competition, setCompetition] = useState('');

  const handleCreate = () => {
    if (!homeTeam || !awayTeam) return;

    // Initialize match state (UR-001: create in <60s)
    createMatch(
      { name: homeTeam, shortCode: homeTeam.substring(0, 3).toUpperCase(), goals: 0, points: 0 },
      { name: awayTeam, shortCode: awayTeam.substring(0, 3).toUpperCase(), goals: 0, points: 0 },
      sport
    );

    // Update venue and referee if provided
    if (venue || referee) {
      const { match } = useMatchStore.getState();
      if (match) {
        useMatchStore.setState({
          match: { ...match, venue, referee }
        });
      }
    }

    // Start the match and navigate to live screen
    const { startMatch } = useMatchStore.getState();
    startMatch();

    // Navigate to live match screen
    router.push('/matches/active');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back Button */}
      <Link href="/" className="mb-4 inline-block text-sm text-gaa-green hover:underline">
        ← Back to Home
      </Link>

      <h1 className={`${rainMode ? 'text-rain-lg' : 'text-2xl'} font-black text-gaa-green mb-6`}>
        New Match
      </h1>

      {/* Sport Selection (UR-031) */}
      <div className="mb-4">
        <label className={`block mb-1 font-semibold ${rainMode ? 'text-rain-md' : ''}`}>Sport</label>
        <div className="flex gap-2">
          {(['gaelic-football', 'hurling'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`flex-1 rounded-lg border p-4 text-center capitalize transition ${
                sport === s ? 'border-gaa-green bg-green-50 font-bold' : ''
              }`}
            >
              {s === 'gaelic-football' ? '⚽ Football' : '🏑 Hurling'}
            </button>
          ))}
        </div>
      </div>

      {/* Grade Selection (UR-031, UR-042) */}
      <div className="mb-4">
        <label className={`block mb-1 font-semibold ${rainMode ? 'text-rain-md' : ''}`}>Grade</label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className={`w-full rounded-lg border p-3 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        >
          {Object.keys(GRADE_DURATIONS).map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)} ({GRADE_DURATIONS[g]} min/half)
            </option>
          ))}
        </select>
      </div>

      {/* Competition Selection (UR-085) */}
      <div className="mb-4">
        <label className={`block mb-1 font-semibold ${rainMode ? 'text-rain-md' : ''}`}>Competition</label>
        <select
          value={competition}
          onChange={(e) => setCompetition(e.target.value)}
          className={`w-full rounded-lg border p-3 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        >
          {COMPETITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Venue (UR-002) */}
      <div className="mb-4">
        <label className={`block mb-1 font-semibold ${rainMode ? 'text-rain-md' : ''}`}>Venue</label>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Croke Park, Páirc Tailteann..."
          className={`w-full rounded-lg border p-3 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        />
      </div>

      {/* Referee (UR-002) */}
      <div className="mb-4">
        <label className={`block mb-1 font-semibold ${rainMode ? 'text-rain-md' : ''}`}>Referee</label>
        <input
          type="text"
          value={referee}
          onChange={(e) => setReferee(e.target.value)}
          placeholder="Enter referee name..."
          className={`w-full rounded-lg border p-3 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        />
      </div>

      {/* Team Selection */}
      <div className="mb-4">
        <label className={`block mb-1 font-semibold ${rainMode ? 'text-rain-md' : ''}`}>Home Team</label>
        <input
          type="text"
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          placeholder="Enter team name..."
          className={`w-full rounded-lg border p-3 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        />
      </div>

      <div className="mb-4">
        <label className={`block mb-1 font-semibold ${rainMode ? 'text-rain-md' : ''}`}>Away Team</label>
        <input
          type="text"
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          placeholder="Enter team name..."
          className={`w-full rounded-lg border p-3 ${rainMode ? 'min-h-[60px] text-xl' : ''}`}
        />
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!homeTeam || !awayTeam}
        className={`w-full rounded-xl bg-gaa-green py-4 font-bold text-white shadow-lg transition ${
          homeTeam && awayTeam ? 'hover:bg-gaa-green-light active:scale-[0.98]' : 'bg-gray-300 cursor-not-allowed'
        } ${rainMode ? 'text-rain-md min-h-[60px]' : ''}`}
      >
        Create Match
      </button>

      {/* Hint */}
      <p className="mt-3 text-center text-xs text-gray-500">
        Tip: Team names are auto-filled from your last 5 matches
      </p>
    </div>
  );
}
