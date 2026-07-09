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

      {/* Real GAA Pitch Image with Event Overlays */}
      <div className="relative w-full max-w-xs mx-auto">
        <img 
          src="/gaa-pitch.png" 
          alt="GAA Pitch" 
          className="w-full rounded-lg shadow-inner"
        />

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
            <div
              key={`score-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`
              }}
            >
              {/* Outer ring for visibility */}
              <div
                className={`rounded-full ${event.details?.subtype === 'goal' ? 'bg-green-500' : 
                      event.details?.isTwoPoint ? 'bg-orange-500' : 'bg-blue-500'} opacity-40`}
                style={{ width: '16px', height: '16px' }}
              />
              {/* Inner dot */}
              <div
                className={`absolute inset-0 m-auto rounded-full border-2 border-white ${event.details?.subtype === 'goal' ? 'bg-green-500' : 
                      event.details?.isTwoPoint ? 'bg-orange-500' : 'bg-blue-500'}`}
                style={{ width: '10px', height: '10px' }}
              />
            </div>
          );
        })}

        {/* Card event dots with actual locations */}
        {match.events.filter(e => e.type.includes('_card')).map((event, index) => {
          const locationX = event.details?.locationX;
          const locationY = event.details?.locationY;
          
          let x = locationX !== undefined ? locationX : (150 + (Math.random() - 0.5) * 200);
          let y = locationY !== undefined ? locationY : (200 + (Math.random() - 0.5) * 180);

          return (
            <div
              key={`card-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`
              }}
            >
              {/* Outer ring */}
              <div
                className={`rounded-full ${event.details?.cardType === 'yellow' ? 'bg-yellow-500' : 
                      event.details?.cardType === 'black' ? 'bg-gray-800' : 'bg-red-600'} opacity-40`}
                style={{ width: '12px', height: '12px' }}
              />
              {/* Inner dot */}
              <div
                className={`absolute inset-0 m-auto rounded-full border border-white ${event.details?.cardType === 'yellow' ? 'bg-yellow-500' : 
                      event.details?.cardType === 'black' ? 'bg-gray-800' : 'bg-red-600'}`}
                style={{ width: '8px', height: '8px' }}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex justify-center gap-4 text-xs text-gray-500">
        <span>🔵 Point (1pt)</span>
        <span>🟢 Goal (3pts)</span>
        <span>🟠 2-Point Shot</span>
      </div>
    </div>
  );
}
