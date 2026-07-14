'use client';

import { useState, useRef, useEffect } from 'react';
import { DEFAULT_POSITIONS, type PositionType } from '@/lib/utils/helpers';
import { ChevronDown, Plus } from 'lucide-react';

interface PositionSelectorProps {
  value: string;
  onChange: (position: string) => void;
  compact?: boolean;
}

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-yellow-400 text-black',
  DEF: 'bg-blue-500 text-white',
  MID: 'bg-green-500 text-white',
  FWD: 'bg-red-500 text-white',
  SUB: 'bg-gray-400 text-white',
};

const POSITION_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
  SUB: 'Substitute',
};

export default function PositionSelector({ value, onChange, compact }: PositionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (position: string) => {
    onChange(position);
    setIsOpen(false);
  };

  const currentColor = POSITION_COLORS[value] || 'bg-gray-300 text-white';
  const currentLabel = POSITION_LABELS[value] || value;

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2 py-1 rounded text-xs font-medium ${currentColor} hover:opacity-90 transition-opacity`}
        >
          {value}
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border z-20 py-1">
            {DEFAULT_POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => handleSelect(pos)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 transition-colors ${
                  value === pos ? 'font-bold' : ''
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${POSITION_COLORS[pos]}`}></span>
                {pos} - {POSITION_LABELS[pos]}
              </button>
            ))}
            <div className="border-t my-1"></div>
            <button
              onClick={() => handleSelect('SUB')}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 transition-colors ${
                value === 'SUB' ? 'font-bold' : ''
              }`}
            >
              SUB - Substitute
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${currentColor} hover:opacity-90 transition-opacity w-full`}
      >
        <span>{currentLabel}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border z-20 py-1">
          {DEFAULT_POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => handleSelect(pos)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                value === pos ? 'bg-gray-100 font-bold' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-block w-4 h-4 rounded ${POSITION_COLORS[pos]}`}></span>
                <div>
                  <span className="text-sm font-medium">{pos}</span>
                  <span className="text-xs text-gray-500 ml-2">{POSITION_LABELS[pos]}</span>
                </div>
              </div>
            </button>
          ))}
          <div className="border-t my-1"></div>
          <button
            onClick={() => handleSelect('SUB')}
            className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
              value === 'SUB' ? 'bg-gray-100 font-bold' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`inline-block w-4 h-4 rounded ${POSITION_COLORS.SUB}`}></span>
              <span className="text-sm font-medium">SUB</span>
              <span className="text-xs text-gray-500 ml-2">Substitute</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
