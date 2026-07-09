'use client';

import { useState } from 'react';

interface InteractivePitchMapProps {
  onSelectLocation: (x: number, y: number) => void;
  onClose: () => void;
}

export default function InteractivePitchMap({ onSelectLocation, onClose }: InteractivePitchMapProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);

  const handlePitchClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
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

        {/* Pitch Map */}
        <div className="p-4">
          <svg 
            viewBox="0 0 300 400" 
            className="w-full cursor-crosshair rounded-lg shadow-inner"
            onClick={handlePitchClick}
            onMouseMove={(e) => {
              const svg = e.currentTarget;
              const rect = svg.getBoundingClientRect();
              setHoverX(((e.clientX - rect.left) / rect.width) * 100);
              setHoverY(((e.clientY - rect.top) / rect.height) * 100);
            }}
            onMouseLeave={() => {
              setHoverX(null);
              setHoverY(null);
            }}
          >
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
            
            {/* Penalty areas - larger rectangle (13m box) */}
            <rect x="60" y="5" width="180" height="80" fill="none" stroke="white" strokeWidth="2" />
            <rect x="60" y="315" width="180" height="80" fill="none" stroke="white" strokeWidth="2" />
            
            {/* Goal areas - smaller rectangle (6m box) */}
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

            {/* Hover indicator */}
            {hoverX !== null && hoverY !== null && (
              <g>
                <circle 
                  cx={(hoverX / 100) * 290 + 5} 
                  cy={(hoverY / 100) * 390 + 5} 
                  r="8" 
                  fill="none" 
                  stroke="#FFD700" 
                  strokeWidth="3"
                />
                <circle 
                  cx={(hoverX / 100) * 290 + 5} 
                  cy={(hoverY / 100) * 390 + 5} 
                  r="4" 
                  fill="#FFD700" 
                />
              </g>
            )}

            {/* Team zones */}
            <text x="150" y="180" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14" fontWeight="bold">HOME HALF</text>
            <text x="150" y="230" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14" fontWeight="bold">AWAY HALF</text>
          </svg>

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
