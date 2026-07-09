'use client';

import { useState } from 'react';

interface InteractivePitchMapProps {
  onSelectLocation: (x: number, y: number) => void;
  onClose: () => void;
}

export default function InteractivePitchMap({ onSelectLocation, onClose }: InteractivePitchMapProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);

  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Convert to pitch coordinates (0-100%)
    onSelectLocation(x, y);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gaa-green px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Select Score Location</h3>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Pitch Map with Real Image */}
        <div className="p-4">
          <div 
            className="relative cursor-crosshair rounded-lg shadow-inner overflow-hidden"
            onClick={handlePitchClick}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoverX(((e.clientX - rect.left) / rect.width) * 100);
              setHoverY(((e.clientY - rect.top) / rect.height) * 100);
            }}
            onMouseLeave={() => {
              setHoverX(null);
              setHoverY(null);
            }}
          >
            {/* Real GAA Pitch Image */}
            <img 
              src="/gaa-pitch.png" 
              alt="GAA Pitch" 
              className="w-full"
            />

            {/* Hover indicator */}
            {hoverX !== null && hoverY !== null && (
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: `${hoverX}%`, 
                  top: `${hoverY}%`
                }}
              >
                {/* Outer ring */}
                <div
                  className="rounded-full border-3 border-yellow-400 opacity-80"
                  style={{ width: '16px', height: '16px' }}
                />
                {/* Inner dot */}
                <div
                  className="absolute inset-0 m-auto rounded-full bg-yellow-400"
                  style={{ width: '8px', height: '8px' }}
                />
              </div>
            )}

            {/* Team zones overlay */}
            <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="text-white text-xs font-bold opacity-40" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>HOME HALF</span>
            </div>
            <div className="absolute top-[65%] left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <span className="text-white text-xs font-bold opacity-40" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>AWAY HALF</span>
            </div>
          </div>

          {/* Instructions */}
          <p className="mt-3 text-center text-sm text-gray-600">
            Tap anywhere on the pitch to mark where the score was taken from
          </p>

          {/* Coordinate display */}
          {hoverX !== null && hoverY !== null && (
            <div className="mt-2 p-2 bg-gray-100 rounded-lg text-center">
              <span className="text-xs font-mono text-gray-700">
                Position: ({Math.round(hoverX)}%, {Math.round(hoverY)}%)
              </span>
            </div>
          )}

          {/* Quick zone buttons */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button 
              onClick={() => onSelectLocation(50, 15)}
              className="py-2 px-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Near Goal
            </button>
            <button 
              onClick={() => onSelectLocation(50, 40)}
              className="py-2 px-3 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Midfield
            </button>
            <button 
              onClick={() => onSelectLocation(50, 70)}
              className="py-2 px-3 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Outside 40m
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
