'use client';

import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';

export default function HomePage() {
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);
  
  const rainMode = accessibilityMode === 'rain-mode';
  const highContrast = accessibilityMode === 'high-contrast';

  // Check if there's an active match in progress
  const hasActiveMatch = match && (match.status === 'draft' || match.status === 'first-half' || match.status === 'halftime' || match.status === 'second-half');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <h1 className={`${rainMode ? 'text-rain-lg' : 'text-2xl'} font-black text-gaa-green mb-6`}>
        MatchDay GAA
      </h1>

      {hasActiveMatch && (
        // Active match banner — link to current match screen
        <Link href="/matches/active" className="block">
          <div className={`mb-6 rounded-xl border-2 border-gaa-green bg-green-50 p-4 ${rainMode ? 'p-6' : ''}`}>
            <p className={`${rainMode ? 'text-rain-md' : 'text-lg'} font-bold text-gaa-green`}>
              Match in Progress
            </p>
            <p className="text-sm text-gray-600">Tap to continue recording</p>
          </div>
        </Link>
      )}

      {/* New Match Button — primary action */}
      <Link href="/matches/new" className="block mb-4">
        <button className={`w-full rounded-xl bg-gaa-green py-4 text-center font-bold text-white shadow-lg transition hover:bg-gaa-green-light ${rainMode ? 'text-rain-md min-h-[60px]' : ''}`}>
          + New Match
        </button>
      </Link>

      {/* Quick Settings */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => useSettingsStore.getState().setAccessibilityMode(accessibilityMode === 'rain-mode' ? 'standard' : 'rain-mode')}
          className={`rounded-lg border p-3 text-left ${rainMode ? 'border-gaa-green bg-green-50' : ''}`}
        >
          <span className="text-sm font-semibold">🌧️ Rain Mode</span>
          <p className="text-xs text-gray-500">{rainMode ? 'ON' : 'OFF'}</p>
        </button>

        <button
          onClick={() => useSettingsStore.getState().setAccessibilityMode(highContrast ? 'standard' : 'high-contrast')}
          className={`rounded-lg border p-3 text-left ${highContrast ? 'border-gaa-green bg-yellow-50' : ''}`}
        >
          <span className="text-sm font-semibold">☀️ High Contrast</span>
          <p className="text-xs text-gray-500">{highContrast ? 'ON' : 'OFF'}</p>
        </button>
      </div>

      {/* Volunteer Mode Selector */}
      <div className="mt-4">
        <h2 className={`mb-2 font-bold ${rainMode ? 'text-rain-md' : ''}`}>Volunteer Role</h2>
        <div className="flex gap-2">
          {(['volunteer', 'coach', 'administrator'] as const).map((role) => (
            <button
              key={role}
              onClick={() => useSettingsStore.getState().setVolunteerRole(role)}
              className={`flex-1 rounded-lg border p-3 text-center capitalize transition ${
                useSettingsStore.getState().volunteerRole === role
                  ? 'border-gaa-green bg-green-50 font-bold'
                  : ''
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 rounded-xl border p-4">
        <h3 className={`mb-2 font-bold ${rainMode ? 'text-rain-md' : ''}`}>Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/matches/new" className="rounded-lg bg-blue-50 p-3 text-center hover:bg-blue-100">
            <span className="text-sm font-semibold">📋 Record Match</span>
          </Link>
          <button 
            onClick={() => useSettingsStore.getState().setAccessibilityMode('large-text')}
            className="rounded-lg bg-purple-50 p-3 text-center hover:bg-purple-100"
          >
            <span className="text-sm font-semibold">🔍 Large Text</span>
          </button>
        </div>
      </div>
    </div>
  );
}
