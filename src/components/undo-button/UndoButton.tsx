'use client';

import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { Undo2 } from 'lucide-react';

export default function UndoButton() {
  const match = useMatchStore((s) => s.match);
  const undoLastEvent = useMatchStore((s) => s.undoLastEvent);
  const rainMode = useSettingsStore((s) => s.accessibilityMode === 'rain-mode');

  const hasEvents = (match?.events.length ?? 0) > 0;

  const handleUndo = () => {
    if (!hasEvents) return;
    
    undoLastEvent();
    
    // Show confirmation toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-gaa-green text-white px-6 py-3 rounded-lg shadow-xl';
    toast.textContent = 'Last event removed';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  return (
    <button
      onClick={handleUndo}
      disabled={!hasEvents}
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full shadow-xl transition-all ${
        hasEvents
          ? 'bg-red-600 hover:bg-red-700 active:scale-95 text-white'
          : 'bg-gray-400 cursor-not-allowed text-gray-200'
      } ${rainMode ? 'px-8 py-4 text-xl min-h-[60px]' : 'px-6 py-3 text-sm'}`}
      aria-label="Undo last event"
    >
      <Undo2 className={rainMode ? 'w-7 h-7' : 'w-5 h-5'} />
      <span>{rainMode ? 'UNDO' : 'Undo'}</span>
    </button>
  );
}
