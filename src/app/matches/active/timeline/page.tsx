'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { GripVertical, Pencil, Trash2, ArrowLeft } from 'lucide-react';

const EVENT_ICONS: Record<string, string> = {
  score: '⚽',
  yellow_card: '🟨',
  black_card: '⬛',
  red_card: '🟥',
  substitution: '🔄',
};

const EVENT_LABELS: Record<string, string> = {
  score: 'Score',
  goal: 'Goal',
  point: 'Point',
  two_point: '2-Point Shot',
  yellow_card: 'Yellow Card',
  black_card: 'Black Card (Sin Bin)',
  red_card: 'Red Card',
  substitution_in: 'Sub ON',
  substitution_out: 'Sub OFF',
  substitution: 'Substitution',
};

export default function TimelinePage() {
  const match = useMatchStore((s) => s.match);
  const undoLastEvent = useMatchStore((s) => s.undoLastEvent);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);

  const rainMode = accessibilityMode === 'rain-mode';

  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [editMinute, setEditMinute] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Guard: redirect to home if no match exists
  if (!match) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 text-center">
        <h1 className="text-2xl font-black text-gaa-green mb-4">No Active Match</h1>
        <p className="mb-6 text-gray-600">Start a new match to view the timeline.</p>
        <Link href="/matches/new" className="inline-block rounded-xl bg-gaa-green px-6 py-3 font-bold text-white">
          Create New Match
        </Link>
      </div>
    );
  }

  const events = match.events;

  // Delete last event (soft delete — recoverable via Undo)
  const handleDelete = () => {
    if (events.length === 0) return;
    undoLastEvent();
  };

  // Drag to reposition
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex || events.length < 2) return;
    
    // Reorder events array by removing and reinserting
    const newEvents = [...events];
    const [moved] = newEvents.splice(draggedIndex, 1);
    newEvents.splice(dropIndex, 0, moved);
    
    // Update match with reordered events using Zustand store
    useMatchStore.setState((state) => ({
      match: state.match ? { ...state.match, events: newEvents } : null,
    }));

    setDraggedIndex(null);
  };

  // Edit event minute
  const handleEditStart = (index: number) => {
    setEditingEvent(index);
    setEditMinute(events[index].minute);
  };

  const handleEditSave = () => {
    if (editingEvent === null || editMinute < 0) return;
    
    // Update the minute of the specific event
    const newEvents = [...events];
    newEvents[editingEvent] = { ...newEvents[editingEvent], minute: editMinute };
    
    useMatchStore.setState((state) => ({
      match: state.match ? { ...state.match, events: newEvents } : null,
    }));

    setEditingEvent(null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back Button */}
      <Link href="/matches/active" className="mb-4 inline-flex items-center gap-2 text-sm text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Match
      </Link>

      <h1 className={`${rainMode ? 'text-rain-lg' : 'text-2xl'} font-black text-gaa-green mb-6`}>
        Match Timeline
      </h1>

      {events.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center border-gray-300">
          <p className="text-gray-500">No events recorded yet.</p>
          <p className="text-sm text-gray-400 mt-1">Go back to the scoring panel to start recording.</p>
        </div>
      ) : (
        <>
          {/* Event Timeline */}
          <div className={`space-y-2 ${rainMode ? 'space-y-3' : ''}`}>
            {events.map((event, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${editingEvent === index ? 'border-gaa-green bg-green-50' : ''}`}
              >
                {/* Drag Handle */}
                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />

                {/* Minute */}
                {editingEvent === index ? (
                  <input
                    type="number"
                    value={editMinute}
                    onChange={(e) => setEditMinute(Number(e.target.value))}
                    className="w-16 rounded border p-1 text-center font-mono"
                  />
                ) : (
                  <span className="font-mono font-bold w-12">{event.minute}&apos;</span>
                )}

                {/* Team Indicator */}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  event.teamSide === 'home' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                }`}>
                  {event.teamSide === 'home' ? 'HOME' : 'AWAY'}
                </span>

                {/* Icon + Label */}
                <span className="text-lg">{EVENT_ICONS[event.type] || '⚽'}</span>
                <span className={`flex-1 ${rainMode ? 'text-lg' : ''}`}>
                  {EVENT_LABELS[event.type] || event.type}
                  {event.details?.subtype && ` (${event.details.subtype})`}
                </span>

                {/* Edit / Delete Actions */}
                {editingEvent === index ? (
                  <button onClick={handleEditSave} className="text-green-600 font-bold text-sm">
                    Save
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleEditStart(index)} 
                      className="text-blue-500 hover:text-blue-700"
                      aria-label="Edit event time"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleDelete} 
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete last event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <p className={`mt-4 text-center text-xs text-gray-500 ${rainMode ? 'text-sm' : ''}`}>
            Tap ✏️ to edit time • Drag ⠿ to reorder • Tap 🗑️ to delete (recoverable via Undo)
          </p>

          {/* Total Events */}
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-center">
            <span className={`font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
              {events.length} event{events.length !== 1 ? 's' : ''} recorded
            </span>
          </div>
        </>
      )}

      {/* Note about drag reordering */}
      <p className="mt-2 text-center text-xs text-gray-400">
        Note: Drag to reorder events • Changes are saved automatically
      </p>
    </div>
  );
}
