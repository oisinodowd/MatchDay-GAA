'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ReportGenerator from '@/components/report-generator/ReportGenerator';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { generateNarrative } from '@/lib/ai/narrative-generator';

export default function ReportsPage() {
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';
  const largeText = accessibilityMode === 'large-text';

  // Generate AI narrative if match exists and has events
  let narrative = null;
  if (match && match.events.length > 0) {
    narrative = generateNarrative(
      match.events,
      match.teamHome.name,
      match.teamAway.name,
      match.teamHome.goals,
      match.teamHome.points,
      match.teamAway.goals,
      match.teamAway.points
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back Button */}
      <Link href="/matches/active" className="mb-4 inline-flex items-center gap-2 text-sm text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Active Match
      </Link>

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className={`${rainMode ? 'text-rain-lg' : 'text-2xl'} font-black text-gaa-green`}>Match Reports</h1>
        <p className={`text-sm text-gray-500 mt-1`}>Generate and share match reports in various formats</p>
      </div>

      {/* AI Match Narrative — UR-026, UR-067–70 */}
      {narrative && (
        <div className="mb-6 rounded-xl border-2 p-4 border-purple-300 bg-purple-50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className={`font-bold ${rainMode ? 'text-rain-md' : ''}`}>AI Match Narrative</h2>
          </div>

          {/* Summary */}
          <p className={`mb-4 whitespace-pre-line ${largeText ? 'text-lg' : rainMode ? 'text-rain-sm' : 'text-sm text-gray-700'}`}>
            {narrative.summary}
          </p>

          {/* Turning Point */}
          <div className={`mb-3 p-3 rounded-lg bg-white ${rainMode ? 'p-4' : ''}`}>
            <h3 className="font-bold text-purple-700 mb-1">🔑 Turning Point</h3>
            <p className={`text-sm ${largeText ? 'text-base' : rainMode ? 'text-rain-sm' : ''}`}>{narrative.turningPoint}</p>
          </div>

          {/* Top Highlights */}
          <div className={`mb-3 p-3 rounded-lg bg-white ${rainMode ? 'p-4' : ''}`}>
            <h3 className="font-bold text-purple-700 mb-2">⭐ Key Moments</h3>
            <ul className="space-y-1">
              {narrative.highlights.map((highlight, index) => (
                <li key={index} className={`text-sm ${largeText ? 'text-base' : rainMode ? 'text-rain-sm' : ''}`}>
                  • {highlight}
                </li>
              ))}
            </ul>
          </div>

          {/* MOTM */}
          <div className={`p-3 rounded-lg bg-yellow-100 border border-yellow-300 ${rainMode ? 'p-4' : ''}`}>
            <h3 className="font-bold text-yellow-800 mb-1">🏆 Man of the Match</h3>
            <p className={`text-sm ${largeText ? 'text-base' : rainMode ? 'text-rain-sm' : ''}`}>{narrative.motmSuggestion}</p>
          </div>
        </div>
      )}

      {/* Report Generator */}
      <ReportGenerator />
    </div>
  );
}
