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

  // Separate home and away team scores
  const homeScores = match.events.filter(e => e.type === 'score' && e.teamSide === 'home');
  const awayScores = match.events.filter(e => e.type === 'score' && e.teamSide === 'away');

  return (
    <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''}`}>
      <h3 className={`font-bold mb-4 ${rainMode ? 'text-rain-md' : ''}`}>Pitch Map — Scoring Locations</h3>

      {/* Two Separate Pitch Maps Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Team Pitch */}
        <div className="text-center">
          <h4 className="font-bold text-blue-700 mb-3 text-lg border-b-2 border-blue-200 pb-2">
            {match.teamHome.name || 'HOME'}
          </h4>
          <PitchMapWithEvents events={homeScores} teamSide="home" />
        </div>

        {/* Away Team Pitch */}
        <div className="text-center">
          <h4 className="font-bold text-red-700 mb-3 text-lg border-b-2 border-red-200 pb-2">
            {match.teamAway.name || 'AWAY'}
          </h4>
          <PitchMapWithEvents events={awayScores} teamSide="away" />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <div className="text-xs font-semibold text-gray-700 mb-2">Score Types:</div>
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Point (Home)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600"></span> Point (Away)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Goal</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400"></span> 2-Point Shot</span>
        </div>
      </div>
    </div>
  );
}

// Sub-component for rendering pitch map with events for one team
function PitchMapWithEvents({ events, teamSide }: { events: any[]; teamSide: 'home' | 'away' }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No scores recorded for this team
      </div>
    );
  }

  const convertCoordinates = (locationX?: number, locationY?: number) => {
    if (locationX !== undefined && locationY !== undefined) {
      // If coordinates are > 100, they're SVG pixel values - convert to percentage
      if (locationX > 100 || locationY > 100) {
        return { x: (locationX / 295) * 100, y: (locationY / 395) * 100 };
      } else {
        // Already percentages
        return { x: locationX, y: locationY };
      }
    } else {
      // Fallback to random position based on team side
      return { 
        x: 15 + Math.random() * 70, 
        y: teamSide === 'home' 
          ? 10 + Math.random() * 40  
          : 50 + Math.random() * 40
      };
    }
  };

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <img 
        src="/gaa-pitch.png" 
        alt="GAA Pitch" 
        className="w-full rounded-lg shadow-inner"
      />

      {/* Event dots */}
      {events.map((event, index) => {
        const locationX = event.details?.locationX;
        const locationY = event.details?.locationY;
        
        const pos = convertCoordinates(locationX, locationY);

        // Determine colors by score type
        const isGoal = event.details?.subtype === 'goal';
        const isTwoPoint = event.details?.isTwoPoint;
        
        let outerColor: string, innerColor: string;
        if (teamSide === 'home') {
          outerColor = isGoal ? 'bg-green-400' : isTwoPoint ? 'bg-orange-400' : 'bg-blue-600';
          innerColor = isGoal ? 'bg-green-500' : isTwoPoint ? 'bg-orange-500' : 'bg-blue-700';
        } else {
          outerColor = isGoal ? 'bg-green-400' : isTwoPoint ? 'bg-orange-400' : 'bg-red-600';
          innerColor = isGoal ? 'bg-green-500' : isTwoPoint ? 'bg-orange-500' : 'bg-red-700';
        }

        return (
          <div
            key={`score-${index}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%`
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
    </div>
  );
}

