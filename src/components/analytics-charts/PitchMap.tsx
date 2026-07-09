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

  return (
    <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''}`}>
      <h3 className={`font-bold mb-4 ${rainMode ? 'text-rain-md' : ''}`}>Pitch Map — Scoring Locations</h3>

      {/* SVG Pitch - Standard GAA Layout */}
      <svg viewBox="0 0 300 400" className="w-full max-w-xs mx-auto">
        {/* Pitch background with gradient */}
        <defs>
          <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2E7D32', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#388E3C', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#2E7D32', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Pitch outline */}
        <rect x="5" y="5" width="290" height="390" fill="url(#pitchGrad)" stroke="white" strokeWidth="2.5" rx="4" />

        {/* Halfway line */}
        <line x1="5" y1="200" x2="295" y2="200" stroke="white" strokeWidth="2" />

        {/* Center circle */}
        <circle cx="150" cy="200" r="35" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="150" cy="200" r="4" fill="white" />

        {/* Penalty areas - larger rectangle (13m box equivalent) */}
        <rect x="60" y="5" width="180" height="80" fill="none" stroke="white" strokeWidth="2" />
        <rect x="60" y="315" width="180" height="80" fill="none" stroke="white" strokeWidth="2" />

        {/* Goal areas - smaller rectangle (6m box equivalent) */}
        <rect x="95" y="5" width="110" height="30" fill="none" stroke="white" strokeWidth="2" />
        <rect x="95" y="365" width="110" height="30" fill="none" stroke="white" strokeWidth="2" />

        {/* Penalty spots */}
        <circle cx="150" cy="70" r="3" fill="white" />
        <circle cx="150" cy="330" r="3" fill="white" />

        {/* Penalty arcs (semicircles from penalty spot) */}
        <path d="M 115 70 A 35 35 0 0 1 185 70" fill="none" stroke="white" strokeWidth="2" />
        <path d="M 115 330 A 35 35 0 0 0 185 330" fill="none" stroke="white" strokeWidth="2" />

        {/* Corner arcs */}
        <path d="M 5 15 Q 15 5 25 5" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M 275 5 Q 285 5 295 15" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M 5 385 Q 15 395 25 395" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M 275 395 Q 285 395 295 385" fill="none" stroke="white" strokeWidth="1.5" />

        {/* Scoring event dots with actual locations */}
        {match.events.filter(e => e.type === 'score').map((event, index) => {
          const locationX = event.details?.locationX;
          const locationY = event.details?.locationY;
          
          // Use actual location if available, otherwise calculate based on team side
          let x = locationX !== undefined ? locationX : (150 + (Math.random() - 0.5) * 200);
          let y = locationY !== undefined ? locationY : (event.teamSide === 'home' 
            ? 30 + Math.random() * 170  
            : 200 + Math.random() * 170);

          return (
            <g key={`score-${index}`}>
              {/* Outer ring for visibility */}
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={event.details?.subtype === 'goal' ? '#10B981' : 
                      event.details?.isTwoPoint ? '#F97316' : '#3B82F6'}
                opacity="0.4"
              />
              {/* Inner dot */}
              <circle
                cx={x}
                cy={y}
                r="5"
                fill={event.details?.subtype === 'goal' ? '#10B981' : 
                      event.details?.isTwoPoint ? '#F97316' : '#3B82F6'}
                stroke="white"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Card event dots with actual locations */}
        {match.events.filter(e => e.type.includes('_card')).map((event, index) => {
          const locationX = event.details?.locationX;
          const locationY = event.details?.locationY;
          
          let x = locationX !== undefined ? locationX : (150 + (Math.random() - 0.5) * 200);
          let y = locationY !== undefined ? locationY : (200 + (Math.random() - 0.5) * 180);

          return (
            <g key={`card-${index}`}>
              {/* Outer ring */}
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={event.details?.cardType === 'yellow' ? '#EAB308' : 
                      event.details?.cardType === 'black' ? '#1F2937' : '#EF4444'}
                opacity="0.4"
              />
              {/* Inner dot */}
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={event.details?.cardType === 'yellow' ? '#EAB308' : 
                      event.details?.cardType === 'black' ? '#1F2937' : '#EF4444'}
                stroke="white"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(10, 390)">
          <circle cx="0" cy="-2" r="4" fill="#3B82F6" stroke="white" strokeWidth="1" />
          <text x="12" y="0" fontSize="7">Point</text>
          <circle cx="50" cy="-2" r="4" fill="#10B981" stroke="white" strokeWidth="1" />
          <text x="62" y="0" fontSize="7">Goal</text>
          <circle cx="95" cy="-2" r="4" fill="#F97316" stroke="white" strokeWidth="1" />
          <text x="107" y="0" fontSize="7">2-Point</text>
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
