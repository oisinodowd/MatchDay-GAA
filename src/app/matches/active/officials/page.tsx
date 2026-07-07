'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ArrowLeft, UserCheck, Save } from 'lucide-react';

interface MatchOfficialsData {
  referee: string;
  linesman1: string;
  linesman2: string;
  fourthOfficial: string;
  venue: string;
}

export default function OfficialsPage() {
  const match = useMatchStore((s) => s.match);
  const setMatch = useMatchStore.setState;
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';
  const highContrast = accessibilityMode === 'high-contrast';
  const largeText = accessibilityMode === 'large-text';

  const [officials, setOfficials] = useState<MatchOfficialsData>({
    referee: match?.referee || '',
    linesman1: '',
    linesman2: '',
    fourthOfficial: '',
    venue: match?.venue || '',
  });

  if (!match) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 text-center">
        <h1 className="text-2xl font-black text-gaa-green mb-4">No Active Match</h1>
        <p className="mb-6 text-gray-600">Start a new match to record officials.</p>
        <Link href="/matches/new" className="inline-block rounded-xl bg-gaa-green px-6 py-3 font-bold text-white">
          Create New Match
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    setMatch({
      match: {
        ...match,
        referee: officials.referee,
        venue: officials.venue,
      },
    });
    
    // Show success feedback
    alert('Officials saved successfully!');
  };

  const inputClass = `w-full rounded-lg border-2 p-3 font-medium ${highContrast ? 'border-black text-lg' : ''} ${rainMode ? 'text-rain-md py-4' : ''}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back Button */}
      <Link href="/matches/active" className="mb-4 inline-flex items-center gap-2 text-sm text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Match
      </Link>

      <h1 className={`${rainMode ? 'text-rain-lg' : 'text-2xl'} font-black text-gaa-green mb-6`}>
        Match Officials
      </h1>

      {/* Match Info */}
      <div className={`mb-6 rounded-xl border-2 p-4 ${highContrast ? 'border-black' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${largeText ? 'text-lg' : 'text-sm'} text-gray-500`}>Match</p>
            <p className={`font-bold ${rainMode ? 'text-rain-md' : ''}`}>
              {match.teamHome.name} vs {match.teamAway.name}
            </p>
          </div>
          <UserCheck className="w-8 h-8 text-gaa-green" />
        </div>
      </div>

      {/* Officials Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
        {/* Referee (Required) */}
        <div>
          <label className={`block font-bold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>
            Referee <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={officials.referee}
            onChange={(e) => setOfficials({ ...officials, referee: e.target.value })}
            placeholder="Enter referee name"
            className={inputClass}
          />
        </div>

        {/* Venue */}
        <div>
          <label className={`block font-bold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>
            Venue
          </label>
          <input
            type="text"
            value={officials.venue}
            onChange={(e) => setOfficials({ ...officials, venue: e.target.value })}
            placeholder="Enter venue (e.g., Croke Park)"
            className={inputClass}
          />
        </div>

        {/* Linesmen */}
        <div className={`grid ${rainMode ? 'gap-4' : 'gap-3'} grid-cols-1 sm:grid-cols-2`}>
          <div>
            <label className={`block font-semibold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>
              Linesman 1
            </label>
            <input
              type="text"
              value={officials.linesman1}
              onChange={(e) => setOfficials({ ...officials, linesman1: e.target.value })}
              placeholder="Name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={`block font-semibold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>
              Linesman 2
            </label>
            <input
              type="text"
              value={officials.linesman2}
              onChange={(e) => setOfficials({ ...officials, linesman2: e.target.value })}
              placeholder="Name"
              className={inputClass}
            />
          </div>
        </div>

        {/* Fourth Official */}
        <div>
          <label className={`block font-semibold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>
            Fourth Official (Optional)
          </label>
          <input
            type="text"
            value={officials.fourthOfficial}
            onChange={(e) => setOfficials({ ...officials, fourthOfficial: e.target.value })}
            placeholder="Name"
            className={inputClass}
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={!officials.referee.trim()}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-black text-white transition-all ${
            officials.referee.trim()
              ? 'bg-gaa-green hover:bg-green-700 active:scale-[0.98]'
              : 'bg-gray-400 cursor-not-allowed'
          } ${rainMode ? 'text-rain-lg py-5' : ''} ${highContrast ? 'border-2 border-black' : ''}`}
        >
          <Save className="w-5 h-5" />
          Save Officials
        </button>
      </form>

      {/* Help Text */}
      <p className={`mt-4 text-center text-xs text-gray-400 ${rainMode ? 'text-sm' : ''}`}>
        Referee is required. Other officials are optional but recommended for official matches.
      </p>
    </div>
  );
}
