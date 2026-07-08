'use client';

import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ScoreProgressionChart() {
  const match = useMatchStore((s) => s.match);
  const rainMode = useSettingsStore((s) => s.accessibilityMode === 'rain-mode');

  if (!match || match.events.length === 0) {
    return (
      <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''}`}>
        <h3 className={`font-bold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>Score Progression Over Time</h3>
        <p className="text-sm text-gray-500">No scoring events yet.</p>
      </div>
    );
  }

  // Build cumulative score data points from events sorted by minute
  let homeCumulative = 0;
  let awayCumulative = 0;

  const chartData = match.events
    .sort((a, b) => a.minute - b.minute)
    .reduce<{ minute: number; home: number; away: number }[]>((acc, event) => {
      // Calculate points added by this event
      let homeAdded = 0;
      let awayAdded = 0;

      if (event.type === 'score') {
        const subtype = event.details?.subtype;
        const isTwoPoint = event.details?.isTwoPoint;

        if (subtype === 'goal') {
          if (event.teamSide === 'home') homeCumulative += 3;
          else awayCumulative += 3;
        } else if (subtype === '40m-point' && isTwoPoint) {
          if (event.teamSide === 'home') homeCumulative += 2;
          else awayCumulative += 2;
        } else {
          // Regular point or free
          if (event.teamSide === 'home') homeCumulative += 1;
          else awayCumulative += 1;
        }
      }

      acc.push({ minute: event.minute, home: homeCumulative, away: awayCumulative });
      return acc;
    }, []);

  if (chartData.length === 0) {
    return (
      <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''}`}>
        <h3 className={`font-bold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>Score Progression Over Time</h3>
        <p className="text-sm text-gray-500">No scoring events yet.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${rainMode ? 'p-6' : ''}`}>
      <h3 className={`font-bold mb-4 ${rainMode ? 'text-rain-md' : ''}`}>Score Progression Over Time</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="minute" 
            label={{ value: "Minute", position: 'insideBottom', offset: -5 }} 
          />
          <YAxis label={{ value: "Total Points", angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="home" 
            stroke="#1B5E20" 
            name={match.teamHome.name} 
            strokeWidth={2} 
            dot={{ r: 4 }} 
          />
          <Line 
            type="monotone" 
            dataKey="away" 
            stroke="#FFD700" 
            name={match.teamAway.name} 
            strokeWidth={2} 
            dot={{ r: 4 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
