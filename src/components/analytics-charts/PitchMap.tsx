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
          
          // Convert stored coordinates to percentages for display on image
          // Old events have SVG pixel values (0-295/0-395), new events have percentages (0-100)
          let x: number, y: number;
          if (locationX !== undefined && locationY !== undefined) {
            // If coordinates are > 100, they're SVG pixel values - convert to percentage
            if (locationX > 100 || locationY > 100) {
              x = (locationX / 295) * 100;
              y = (locationY / 395) * 100;
            } else {
              // Already percentages
              x = locationX;
              y = locationY;
            }
          } else {
            // Fallback to random position based on team side
            x = 15 + Math.random() * 70;
            y = event.teamSide === 'home' 
              ? 10 + Math.random() * 40  
              : 50 + Math.random() * 40;
          }

          // Determine base color by score type
          const isGoal = event.details?.subtype === 'goal';
          const isTwoPoint = event.details?.isTwoPoint;
          
          // Add team distinction: home team gets blue tint, away team gets red tint
          let outerColor: string, innerColor: string;
          if (event.teamSide === 'home') {
            // Home team - blue tones
            outerColor = isGoal ? 'bg-green-400' : isTwoPoint ? 'bg-orange-400' : 'bg-blue-600';
            innerColor = isGoal ? 'bg-green-500' : isTwoPoint ? 'bg-orange-500' : 'bg-blue-700';
          } else {
            // Away team - red tones
            outerColor = isGoal ? 'bg-green-400' : isTwoPoint ? 'bg-orange-400' : 'bg-red-600';
            innerColor = isGoal ? 'bg-green-500' : isTwoPoint ? 'bg-orange-500' : 'bg-red-700';
          }

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
                className={`rounded-full ${outerColor} opacity-40`}
                style={{ width: '16px', height: '16px' }}
              />
              {/* Inner dot */}
              <div
                className={`absolute inset-0 m-auto rounded-full border-2 border-white ${innerColor}`}
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
      <div className="mt-3 space-y-2">
        <div className="text-xs font-semibold text-gray-700 mb-1">Score Types:</div>
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Point (Home)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600"></span> Point (Away)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Goal</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400"></span> 2-Point Shot</span>
        </div>
      </div>
    </div>
  );
}
