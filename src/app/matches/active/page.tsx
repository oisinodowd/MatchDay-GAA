'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import ScoringPanel from '@/components/scoring-panel/ScoringPanel';
import AccessibilityToggle from '@/components/accessibility/AccessibilityToggle';
import TeamSheetView from '@/components/team-sheet/TeamSheetView';
import { ArrowLeft, Play, SkipForward, RotateCcw, BarChart3, Users, FileText, Sheet } from 'lucide-react';

type TabType = 'scoring' | 'teamsheets';

export default function ActiveMatchPage() {
  const match = useMatchStore((s) => s.match);
  const advanceMinute = useMatchStore((s) => s.advanceMinute);
  const setCurrentHalf = useMatchStore((s) => s.setCurrentHalf);
  const endHalf = useMatchStore((s) => s.endHalf);
  const resetMatch = useMatchStore((s) => s.resetMatch);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('scoring');

  // Guard: redirect to home if no match exists
  if (!match) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <h1 className={`font-bold ${'text-3xl'} text-gaa-green mb-4`}>
          No Active Match
        </h1>
        <p className={`mb-6 ${'text-sm'} text-gray-500`}>Start a new match to begin recording.</p>
        <Link href="/matches/new" className="btn-primary inline-block">
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back Button */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Match Header */}
      <div className="mb-8 text-center">
        <h1 className={`font-bold tracking-tight ${'text-2xl'} text-gaa-green`}>
          Live Match
        </h1>
        <p className={`mt-0.5 ${'text-sm'} text-gray-500 capitalize`}>
          {match.sport?.replace('-', ' ')}
        </p>
        
        {/* Score Display */}
        <div className="mt-6 flex items-center justify-center gap-12">
          <div className="text-center">
            <p className={`font-semibold ${'text-base'} text-gray-700`}>{homeTeam.name}</p>
            <p className={`score-display font-black ${'text-4xl'} tabular-nums text-gaa-green`}>
              {homeTotal}
            </p>
            <p className={`mt-0.5 ${'text-xs'} text-gray-500`}>{homeTeam.goals}-{homeTeam.points}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <span className={`font-bold tabular-nums ${'text-lg'} text-gaa-green`}>
              {match.currentMinute}&apos;
            </span>
            <p className={`mt-0.5 ${'text-xs'} font-medium capitalize text-gray-500`}>
              {match.status.replace('-', ' ')}
            </p>
          </div>
          
          <div className="text-center">
            <p className={`font-semibold ${'text-base'} text-gray-700`}>{awayTeam.name}</p>
            <p className={`score-display font-black ${'text-4xl'} tabular-nums text-gaa-green`}>
              {awayTotal}
            </p>
            <p className={`mt-0.5 ${'text-xs'} text-gray-500`}>{awayTeam.goals}-{awayTeam.points}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('scoring')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'scoring' 
              ? 'bg-gaa-green text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Scoring
        </button>
        <button
          onClick={() => setActiveTab('teamsheets')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'teamsheets' 
              ? 'bg-gaa-green text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Team Sheets
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'scoring' ? (
        <div className="space-y-4">
          {/* Scoring Panels — one per team (UR-004–7, UR-076–8) */}
          <ScoringPanel teamSide="home" teamName={homeTeam.name} />
          <ScoringPanel teamSide="away" teamName={awayTeam.name} />
        </div>
      ) : (
        /* Team Sheets Tab */
        <div className="space-y-4">
          <TeamSheetView teamSide="home" />
          <TeamSheetView teamSide="away" />
        </div>
      )}

      {/* Accessibility Settings Panel (UR-079–80) */}
      <div className="mt-6">
        <AccessibilityToggle />
      </div>

      {/* Match Controls */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        <button
          onClick={advanceMinute}
          className={`flex flex-col items-center rounded-xl ${'bg-blue-50'} p-3 hover:bg-blue-100 transition-colors`}
        >
          <Play className={`w-5 h-5 ${'text-blue-600'}`} />
          <span className={`mt-1.5 ${'text-xs'} font-medium ${'text-gray-700'}`}>+1 Min</span>
        </button>

        <button
          onClick={endHalf}
          className={`flex flex-col items-center rounded-xl ${'bg-green-50'} p-3 hover:bg-green-100 transition-colors`}
        >
          <SkipForward className={`w-5 h-5 ${'text-green-600'}`} />
          <span className={`mt-1.5 ${'text-xs'} font-medium ${'text-gray-700'}`}>
            {match.status === 'first-half' ? 'HT' : match.status === 'second-half' ? 'FT' : 'Next'}
          </span>
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          className={`flex flex-col items-center rounded-xl ${'bg-red-50'} p-3 hover:bg-red-100 transition-colors`}
        >
          <RotateCcw className={`w-5 h-5 ${'text-red-600'}`} />
          <span className={`mt-1.5 ${'text-xs'} font-medium ${'text-gray-700'}`}>Reset</span>
        </button>

        <div className={`flex flex-col items-center justify-center rounded-xl p-3 ${
          match.status === 'first-half' ? `${'bg-yellow-50'}` :
          match.status === 'halftime' ? `${'bg-blue-50'}` :
          match.status === 'second-half' ? `${'bg-orange-50'}` :
          match.status === 'completed' ? `${'bg-gray-100'}` : `${'bg-gray-50'}`
        }`}>
          <span className={`text-xs font-semibold ${'text-gray-700'}`}>
            {match.status === 'first-half' && '1H'}
            {match.status === 'halftime' && 'HT'}
            {match.status === 'second-half' && '2H'}
            {match.status === 'completed' && 'FT'}
            {match.status === 'draft' && 'Draft'}
          </span>
        </div>
      </div>

      {/* Phase 3 Navigation — Analytics, Players, Reports */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Link
          href="/matches/active/analytics"
          className={`flex flex-col items-center rounded-xl ${'bg-purple-50'} p-4 hover:bg-purple-100 transition-colors`}
        >
          <BarChart3 className={`w-6 h-6 ${'text-purple-600'}`} />
          <span className={`mt-2 ${'text-xs'} font-medium ${'text-purple-700'}`}>Analytics</span>
        </Link>

        <Link
          href="/matches/active/players"
          className={`flex flex-col items-center rounded-xl ${'bg-blue-50'} p-4 hover:bg-blue-100 transition-colors`}
        >
          <Users className={`w-6 h-6 ${'text-blue-600'}`} />
          <span className={`mt-2 ${'text-xs'} font-medium ${'text-blue-700'}`}>Players</span>
        </Link>

        <Link
          href="/matches/active/reports"
          className={`flex flex-col items-center rounded-xl ${'bg-green-50'} p-4 hover:bg-green-100 transition-colors`}
        >
          <FileText className={`w-6 h-6 ${'text-green-600'}`} />
          <span className={`mt-2 ${'text-xs'} font-medium ${'text-green-700'}`}>Reports</span>
        </Link>
      </div>

      {/* Event Timeline */}
      <div className="mt-6 card-elevated p-5">
        <h3 className={`mb-3 ${'text-sm'} font-semibold uppercase tracking-wider text-gray-500`}>
          Event Timeline
        </h3>
        {match.events.length === 0 ? (
          <p className={`text-sm ${'text-gray-500'} italic`}>No events recorded yet.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {[...match.events].reverse().map((event, index) => (
              <div key={index} className={`flex items-center gap-2 text-sm border-b last:border-0 pb-1.5 ${'border-gray-100'}`}>
                <span className={`text-xs font-mono ${'text-gray-400'} w-8`}>{event.minute}&apos;</span>
                <span className={`font-medium flex-1 truncate ${event.teamSide === 'home' ? `${'text-blue-600'}` : `${'text-red-600'}`} `}>
                  {event.teamSide === 'home' ? homeTeam.name : awayTeam.name}
                </span>
                <span className={`text-xs ${'text-gray-600'} font-medium`}>
                  {event.type === 'score' && `Score (${event.details?.subtype || 'point'})`}
                  {event.type === 'yellow_card' && 'Yellow Card'}
                  {event.type === 'black_card' && 'Black Card'}
                  {event.type === 'red_card' && 'Red Card'}
                  {event.type === 'substitution' && 'Substitution'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className={`mx-4 w-full max-w-sm rounded-xl ${'bg-white'} p-6 shadow-xl`}>
            <h3 className={`text-lg font-bold mb-2`}>Reset Match?</h3>
            <p className={`text-sm ${'text-gray-600'} mb-4`}>This will clear all match data. This action cannot be undone.</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetMatch();
                  setShowResetConfirm(false);
                }}
                className={`flex-1 rounded-xl ${'bg-red-600'} py-3 font-semibold text-white hover:bg-red-700 transition-colors`}
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`flex-1 rounded-xl ${'bg-gray-200'} py-3 font-semibold text-gray-800 hover:bg-gray-300 transition-colors`}
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
