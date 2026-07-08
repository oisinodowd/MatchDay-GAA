'use client';

import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';

export default function PitchMap() {
  const match = useMatchStore((s) => s.match);
  const rainMode = useSettingsStore((s) => s.accessibilityMode === 'rain-mode');

  if (!match || match.events.length === 0) {
    return (
      <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''}`}>
        <h3 className={`font-bold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>Pitch Map — Scoring Locations</h3>
        <p className="text-sm text-gray-500">No events recorded yet.</p>
      </div>
    );
  }

  // Color mapping for event types
  const colorMap: Record<string, string> = {
    score: '#3B82F6',       // Blue (points)
    goal: '#10B981',        // Green
    yellow_card: '#EAB308',
    black_card: '#1F2937',
    red_card: '#EF4444',
  };

  return (
    <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''}`}>
      <h3 className={`font-bold mb-4 ${rainMode ? 'text-rain-md' : ''}`}>Pitch Map — Scoring Locations</h3>

      {/* SVG Pitch */}
      <svg viewBox="0 0 300 400" className="w-full max-w-xs mx-auto">
        {/* Pitch outline */}
        <rect x="10" y="10" width="280" height="380" fill="#2E7D32" stroke="white" strokeWidth="2" rx="4" />

        {/* Halfway line */}
        <line x1="10" y1="200" x2="290" y2="200" stroke="white" strokeWidth="1.5" />

        {/* Center circle */}
        <circle cx="150" cy="200" r="30" fill="none" stroke="white" strokeWidth="1.5" />

        {/* Penalty areas */}
        <rect x="60" y="10" width="180" height="60" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="60" y="330" width="180" height="60" fill="none" stroke="white" strokeWidth="1.5" />

        {/* Goal areas */}
        <rect x="90" y="10" width="120" height="25" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="90" y="365" width="120" height="25" fill="none" stroke="white" strokeWidth="1.5" />

        {/* 40m arc indicator (UR-034, 2025 rule) */}
        <path d="M 60 70 Q 150 100 240 70" fill="none" stroke="#F97316" strokeWidth="1.5" strokeDasharray="5 3" />
        <text x="150" y="85" textAnchor="middle" fill="#F97316" fontSize="8">40m Arc</text>

        {/* Scoring event dots */}
        {match.events.filter(e => e.type === 'score').map((event, index) => (
          <circle
            key={index}
            cx={150 + (Math.random() - 0.5) * 200} // Random position within pitch width
            cy={event.teamSide === 'home' 
              ? 30 + Math.random() * 170  // Home team scoring in their half (top)
              : 200 + Math.random() * 170  // Away team scoring in their half (bottom)
            }
            r="4"
            fill={event.details?.subtype === 'goal' ? '#10B981' : 
                  event.details?.isTwoPoint ? '#F97316' : '#3B82F6'}
            opacity="0.7"
          />
        ))}

        {/* Card event dots */}
        {match.events.filter(e => e.type.includes('_card')).map((event, index) => (
          <circle
            key={`card-${index}`}
            cx={150 + (Math.random() - 0.5) * 200}
            cy={200 + (Math.random() - 0.5) * 180}
            r="3"
            fill={event.details?.cardType === 'yellow' ? '#EAB308' : 
                  event.details?.cardType === 'black' ? '#1F2937' : '#EF4444'}
            opacity="0.7"
          />
        ))}

        {/* Legend */}
        <g transform="translate(10, 390)">
          <circle cx="0" cy="-2" r="3" fill="#3B82F6" />
          <text x="8" y="0" fontSize="7">Point</text>
          <circle cx="45" cy="-2" r="3" fill="#10B981" />
          <text x="53" y="0" fontSize="7">Goal</text>
          <circle cx="85" cy="-2" r="3" fill="#F97316" />
          <text x="93" y="0" fontSize="7">2-Point</text>
        </g>
      </svg>

      {/* Zone legend */}
      <div className="mt-3 flex justify-center gap-4 text-xs text-gray-500">
        <span>🔵 Point (1pt)</span>
        <span>🟢 Goal (3pts)</span>
        <span>🟠 2-Point Shot</span>
      </div>
    </div>
  );
}
