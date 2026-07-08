'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import ScoringPanel from '@/components/scoring-panel/ScoringPanel';
import { ArrowLeft, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

export default function ActiveMatchPage() {
  const match = useMatchStore((s) => s.match);
  const advanceMinute = useMatchStore((s) => s.advanceMinute);
  const setCurrentHalf = useMatchStore((s) => s.setCurrentHalf);
  const endHalf = useMatchStore((s) => s.endHalf);
  const resetMatch = useMatchStore((s) => s.resetMatch);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Guard: redirect to home if no match exists
  if (!match) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 text-center">
        <h1 className="text-2xl font-black text-gaa-green mb-4">No Active Match</h1>
        <p className="mb-6 text-gray-600">Start a new match to begin recording.</p>
        <Link href="/matches/new" className="inline-block rounded-xl bg-gaa-green px-6 py-3 font-bold text-white">
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back Button */}
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Match Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-black text-gaa-green">Live Match</h1>
        <p className="text-sm text-gray-500 capitalize">{match.sport?.replace('-', ' ')}</p>
        
        {/* Score Display */}
        <div className="mt-4 flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-lg font-bold text-gaa-green">{homeTeam.name}</p>
            <p className="text-3xl font-black tabular-nums">{homeTotal}</p>
            <p className="text-xs text-gray-500">{homeTeam.goals}-{homeTeam.points}</p>
          </div>
          
          <div className="text-center">
            <span className="text-sm font-bold text-gaa-green tabular-nums">{match.currentMinute}&apos;</span>
            <p className="text-xs text-gray-500 capitalize">{match.status.replace('-', ' ')}</p>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-bold text-gaa-green">{awayTeam.name}</p>
            <p className="text-3xl font-black tabular-nums">{awayTotal}</p>
            <p className="text-xs text-gray-500">{awayTeam.goals}-{awayTeam.points}</p>
          </div>
        </div>
      </div>

      {/* Scoring Panels — one per team (UR-004–7) */}
      <div className="space-y-4">
        <ScoringPanel teamSide="home" teamName={homeTeam.name} />
        <ScoringPanel teamSide="away" teamName={awayTeam.name} />
      </div>

      {/* Match Controls */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        {/* Advance Minute */}
        <button
          onClick={advanceMinute}
          className="flex flex-col items-center rounded-lg bg-blue-50 p-3 hover:bg-blue-100"
        >
          <Play className="w-6 h-6 text-blue-600" />
          <span className="text-xs font-semibold mt-1">+1 Min</span>
        </button>

        {/* End Half / Start Second Half */}
        <button
          onClick={endHalf}
          className="flex flex-col items-center rounded-lg bg-green-50 p-3 hover:bg-green-100"
        >
          <SkipForward className="w-6 h-6 text-green-600" />
          <span className="text-xs font-semibold mt-1">
            {match.status === 'first-half' ? 'HT' : match.status === 'second-half' ? 'FT' : 'Next'}
          </span>
        </button>

        {/* Reset Match */}
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex flex-col items-center rounded-lg bg-red-50 p-3 hover:bg-red-100"
        >
          <RotateCcw className="w-6 h-6 text-red-600" />
          <span className="text-xs font-semibold mt-1">Reset</span>
        </button>

        {/* Match Status Indicator */}
        <div className={`flex flex-col items-center justify-center rounded-lg p-3 ${
          match.status === 'first-half' ? 'bg-yellow-50' :
          match.status === 'halftime' ? 'bg-blue-50' :
          match.status === 'second-half' ? 'bg-orange-50' :
          match.status === 'completed' ? 'bg-gray-100' : 'bg-gray-50'
        }`}>
          <span className="text-xs font-bold text-gray-700">
            {match.status === 'first-half' && '🟡 1H'}
            {match.status === 'halftime' && '🔵 HT'}
            {match.status === 'second-half' && '🟠 2H'}
            {match.status === 'completed' && '✅ FT'}
            {match.status === 'draft' && '⚪ Draft'}
          </span>
        </div>
      </div>

      {/* Phase 3 Navigation — Analytics, Players, Reports */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Link
          href="/matches/active/analytics"
          className="flex flex-col items-center rounded-lg bg-purple-50 p-4 hover:bg-purple-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span className="text-xs font-semibold mt-2 text-purple-700">Analytics</span>
        </Link>

        <Link
          href="/matches/active/players"
          className="flex flex-col items-center rounded-lg bg-blue-50 p-4 hover:bg-blue-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span className="text-xs font-semibold mt-2 text-blue-700">Players</span>
        </Link>

        <Link
          href="/matches/active/reports"
          className="flex flex-col items-center rounded-lg bg-green-50 p-4 hover:bg-green-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span className="text-xs font-semibold mt-2 text-green-700">Reports</span>
        </Link>
      </div>

      {/* Event Timeline */}
      <div className="mt-6 rounded-xl border p-4">
        <h3 className={`mb-2 font-bold ${match ? '' : 'text-rain-md'}`}>Event Timeline</h3>
        {match.events.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No events recorded yet.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {[...match.events].reverse().map((event, index) => (
              <div key={index} className="flex items-center gap-2 text-sm border-b pb-1 last:border-0">
                <span className="text-xs font-mono text-gray-500 w-8">{event.minute}&apos;</span>
                <span className={`font-semibold ${event.teamSide === 'home' ? 'text-blue-600' : 'text-red-600'}`}>
                  {event.teamSide === 'home' ? homeTeam.name : awayTeam.name}
                </span>
                <span className="text-gray-700">
                  {event.type === 'score' && `Score (${event.details?.subtype || 'point'})`}
                  {event.type === 'yellow_card' && '🟨 Yellow Card'}
                  {event.type === 'black_card' && '🟧 Black Card'}
                  {event.type === 'red_card' && '🟥 Red Card'}
                  {event.type === 'substitution' && '🔄 Substitution'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Reset Match?</h3>
            <p className="text-sm text-gray-600 mb-4">This will clear all match data. This action cannot be undone.</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetMatch();
                  setShowResetConfirm(false);
                }}
                className="flex-1 rounded-lg bg-red-600 py-3 font-bold text-white hover:bg-red-700"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-lg bg-gray-200 py-3 font-bold text-gray-800 hover:bg-gray-300"
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
