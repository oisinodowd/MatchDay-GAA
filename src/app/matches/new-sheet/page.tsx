'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Player } from '@/stores/match-store';
import { generateId, validateTeamPlayers } from '@/lib/utils/helpers';
import FormationPitch from '@/components/team-sheet/FormationPitch';
import { db } from '@/lib/db/matchday-db';
import { ArrowLeft, Plus, Trash2, UserPlus, AlertCircle, CheckCircle2, Save } from 'lucide-react';

interface PlayerRowProps {
  player: Player;
  index: number;
  onUpdate: (updates: Partial<Player>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragIndex: number | null;
  setDragIndex: (index: number | null) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}
const POSITION_COLORS: Record<string, { dot: string; accent: string; text: string }> = {
  GK:  { dot: '#eab308', accent: '#fef9c3', text: '#854d0e' },
  DEF: { dot: '#3b82f6', accent: '#dbeafe', text: '#1e40af' },
  MID: { dot: '#22c55e', accent: '#dcfce7', text: '#166534' },
  FWD: { dot: '#ef4444', accent: '#fee2e2', text: '#991b1b' },
  SUB: { dot: '#9ca3af', accent: '#f3f4f6', text: '#4b5563' },
};

function PlayerRow({ player, index, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, dragIndex, setDragIndex, onReorder }: PlayerRowProps) {
  const pc = POSITION_COLORS[player.position || 'SUB'] || POSITION_COLORS.SUB;
  const isDragging = dragIndex === index;
  const isDragTarget = dragIndex !== null && dragIndex !== index;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (onReorder) {
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      if (!isNaN(fromIndex) && fromIndex !== index) {
        onReorder(fromIndex, index);
      }
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '12px',
        background: isDragTarget ? '#f0fdf4' : '#ffffff',
        border: isDragTarget ? '2px solid #22c55e' : '1px solid #e5e7eb',
        boxShadow: isDragTarget ? '0 2px 8px rgba(34,197,94,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all 0.15s ease',
        opacity: isDragging ? 0.5 : 1,
        borderLeft: `3px solid ${pc.dot}`,
      }}
    >
      {/* Drag Handle - only this is draggable */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ color: '#cbd5e1', cursor: 'grab', flexShrink: 0, display: 'flex', alignItems: 'center' }}
        title="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="5" cy="3" r="1.2"/><circle cx="9" cy="3" r="1.2"/>
          <circle cx="5" cy="7" r="1.2"/><circle cx="9" cy="7" r="1.2"/>
          <circle cx="5" cy="11" r="1.2"/><circle cx="9" cy="11" r="1.2"/>
        </svg>
      </div>

      {/* Reorder arrows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
        <button onClick={onMoveUp} disabled={!canMoveUp} style={{ border: 'none', background: 'none', cursor: canMoveUp ? 'pointer' : 'default', opacity: canMoveUp ? 0.5 : 0.2, padding: 0, lineHeight: 0, color: '#6b7280' }}>
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 2L1 7h8z" fill="currentColor"/></svg>
        </button>
        <button onClick={onMoveDown} disabled={!canMoveDown} style={{ border: 'none', background: 'none', cursor: canMoveDown ? 'pointer' : 'default', opacity: canMoveDown ? 0.5 : 0.2, padding: 0, lineHeight: 0, color: '#6b7280' }}>
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 8L1 3h8z" fill="currentColor"/></svg>
        </button>
      </div>

      {/* Jersey Number */}
      <div style={{
        width: '38px', height: '38px',
        borderRadius: '50%',
        background: player.position === 'GK' ? '#fef9c3' : player.position === 'DEF' ? '#dbeafe' : player.position === 'MID' ? '#dcfce7' : player.position === 'FWD' ? '#fee2e2' : '#f3f4f6',
        border: `2px solid ${pc.dot}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <input
          type="number"
          value={player.number}
          onChange={(e) => onUpdate({ number: parseInt(e.target.value) || 0 })}
          min={1} max={99}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: 800,
            color: '#1f2937',
            outline: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 0,
          }}
        />
      </div>

      {/* Player Name Input */}
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Player name"
        style={{
          flex: 1,
          minWidth: 0,
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: 500,
          color: '#111827',
          background: '#f9fafb',
          outline: 'none',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = pc.dot;
          e.target.style.boxShadow = `0 0 0 3px ${pc.dot}22`;
          e.target.style.background = '#ffffff';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
          e.target.style.background = '#f9fafb';
        }}
      />

      {/* Position Selector */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <select
          value={player.position || 'SUB'}
          onChange={(e) => onUpdate({ position: e.target.value })}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            padding: '7px 28px 7px 12px',
            border: `1.5px solid ${pc.dot}`,
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            color: pc.text,
            background: pc.accent,
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          <option value="GK">GK</option>
          <option value="DEF">DEF</option>
          <option value="MID">MID</option>
          <option value="FWD">FWD</option>
          <option value="SUB">SUB</option>
        </select>
        <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: pc.text, opacity: 0.6 }} width="10" height="10" viewBox="0 0 10 10"><path d="M2 3l3 4 3-4z" fill="currentColor"/></svg>
      </div>

      {/* Starter Toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#374151', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
        <input
          type="checkbox"
          checked={player.isStarter}
          onChange={(e) => onUpdate({ isStarter: e.target.checked })}
          style={{ width: '14px', height: '14px', accentColor: '#22c55e', cursor: 'pointer' }}
        />
        Starter
      </label>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        disabled={player.isStarter && index < 15}
        style={{
          border: 'none',
          background: 'none',
          cursor: (player.isStarter && index < 15) ? 'not-allowed' : 'pointer',
          opacity: (player.isStarter && index < 15) ? 0.2 : 1,
          padding: '4px',
          borderRadius: '6px',
          color: '#d1d5db',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!(player.isStarter && index < 15)) {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.background = '#fef2f2';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#d1d5db';
          e.currentTarget.style.background = 'transparent';
        }}
        title="Remove player"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
          <path d="M3.5 3.5l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

export default function NewTeamsheetPage() {
  const router = useRouter();
  
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [previewSide, setPreviewSide] = useState<'home' | 'away'>('home');

  const addPlayer = useCallback(() => {
    const nextNumber = players.length > 0 
      ? Math.max(...players.map(p => p.number)) + 1 
      : 1;
    
    const newPlayer: Player = {
      id: generateId(),
      name: '',
      number: nextNumber,
      position: 'SUB',
      isStarter: players.length < 15,
      goals: 0,
      points: 0,
      yellowCards: 0,
      blackCards: 0,
      redCards: 0,
      isSubstituted: false,
      photoUrl: '',
    };
    
    setPlayers(prev => [...prev, newPlayer]);
  }, [players.length]);

  const removePlayer = useCallback((index: number) => {
    setPlayers(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Reassign starter status after removal
      return updated.map((p, i) => ({
        ...p,
        isStarter: i < 15,
      }));
    });
  }, []);

  const movePlayer = useCallback((index: number, direction: 'up' | 'down') => {
    setPlayers(prev => {
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      
      const newPlayers = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newPlayers[index], newPlayers[swapIndex]] = [newPlayers[swapIndex], newPlayers[index]];
      
      // Reassign starter status based on position after move
      return newPlayers.map((p, i) => ({
        ...p,
        isStarter: i < 15,
      }));
    });
  }, []);

  const handleDropReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex === -1) return;
    
    setPlayers(prev => {
      const newPlayers = [...prev];
      const [draggedPlayer] = newPlayers.splice(fromIndex, 1);
      // Adjust target index based on source position
      let adjustedTarget = toIndex;
      if (fromIndex < toIndex) {
        adjustedTarget = toIndex - 1;
      }
      newPlayers.splice(adjustedTarget, 0, draggedPlayer);
      
      // Reassign starter status based on final positions
      return newPlayers.map((p, i) => ({
        ...p,
        isStarter: i < 15,
      }));
    });
  }, []);

  const updatePlayer = useCallback((index: number, updates: Partial<Player>) => {
    setPlayers(prev => {
      const updated = [...prev];
      // Only update the specific fields passed in, preserving isStarter unless explicitly changed
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  const handleQuickAdd = useCallback(() => {
    const defaultPlayers: Player[] = [];
    for (let i = 1; i <= 30; i++) {
      let position = 'SUB';
      if (i === 1) position = 'GK';
      else if (i <= 7) position = 'DEF';
      else if (i <= 11) position = 'MID';
      else position = 'FWD';
      
      defaultPlayers.push({
        id: generateId(),
        name: `Player ${i}`,
        number: i,
        position,
        isStarter: i <= 15,
        goals: 0,
        points: 0,
        yellowCards: 0,
        blackCards: 0,
        redCards: 0,
        isSubstituted: false,
        photoUrl: '',
      });
    }
    
    setPlayers(defaultPlayers);
  }, []);

  const handleSave = useCallback(async () => {
    if (!teamName.trim()) {
      setErrors(['Please enter a team name.']);
      return;
    }

    const validationErrors = validateTeamPlayers(players);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors([]);
    setIsSaved(true);
    
    try {
      await db.teamsheets.add({
        id: generateId(),
        name: teamName.trim(),
        shortCode: teamName.substring(0, 3).toUpperCase(),
        sport: undefined,
        players: players.map(p => ({
          id: p.id,
          playerId: p.playerId,
          name: p.name,
          number: p.number,
          position: p.position,
          isStarter: p.isStarter,
          goals: p.goals,
          points: p.points,
          yellowCards: p.yellowCards,
          blackCards: p.blackCards,
          redCards: p.redCards,
        })),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to save team sheet:', error);
      setErrors(['Failed to save team sheet. Please try again.']);
      setIsSaved(false);
      return;
    }
    
    setTimeout(() => setIsSaved(false), 3000);
    router.push('/');
  }, [players, teamName, router]);

  const handleDelete = useCallback(async () => {
    // Delete all players (clear the sheet)
    setPlayers([]);
    setShowDeleteConfirm(false);
  }, []);

  const starters = players.filter((_, i) => i < 15);
  const substitutes = players.filter((_, i) => i >= 15);
  const validationErrors = validateTeamPlayers(players);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back Button */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gaa-green">
          Create New Teamsheet
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Build a reusable teamsheet preset for future matches
        </p>
      </div>

      {/* Team Name Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Team Name</label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g., Down Senior Football Team"
          className="w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-gaa-green focus:border-transparent"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={addPlayer}
          className="flex items-center gap-1 px-4 py-2.5 rounded-lg bg-gaa-green-muted text-gaa-green font-medium text-sm hover:bg-gaa-green hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Player
        </button>
        <button
          onClick={handleQuickAdd}
          className="flex items-center gap-1 px-4 py-2.5 rounded-lg bg-gaa-green-muted text-gaa-green font-medium text-sm hover:bg-gaa-green hover:text-white transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Quick Add 30
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={players.length === 0}
          className={`flex items-center gap-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            players.length === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Clear Sheet
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Clear Teamsheet?</h3>
            <p className="text-sm text-gray-600 mb-4">This will remove all {players.length} players from the current sheet. This action cannot be undone.</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border font-medium text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Status */}
      {isSaved && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Teamsheet saved successfully!</span>
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle className="w-4 h-4" />
            Please fix these issues:
          </div>
          <ul className="text-xs text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Player Count Badges */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        <span className={`px-2.5 py-1 rounded-full ${starters.length === 15 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {starters.length}/15 Starters
        </span>
        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
          {substitutes.length} Subs (unlimited)
        </span>
      </div>

      {/* Formation Pitch Preview */}
      {players.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Formation Preview
            </h3>
            {/* Home / Away Toggle */}
            <div
              style={{
                display: 'flex',
                background: '#f3f4f6',
                borderRadius: '10px',
                padding: '3px',
                gap: '2px',
              }}
            >
              <button
                onClick={() => setPreviewSide('home')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: previewSide === 'home' ? '#2563eb' : 'transparent',
                  color: previewSide === 'home' ? '#ffffff' : '#6b7280',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: previewSide === 'home' ? '#ffffff' : '#3b82f6',
                  }}
                />
                Home
              </button>
              <button
                onClick={() => setPreviewSide('away')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: previewSide === 'away' ? '#dc2626' : 'transparent',
                  color: previewSide === 'away' ? '#ffffff' : '#6b7280',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: previewSide === 'away' ? '#ffffff' : '#ef4444',
                  }}
                />
                Away
              </button>
            </div>
          </div>
          <FormationPitch players={players} teamSide={previewSide} compact />
        </div>
      )}

      {/* Players List */}
      <div className="space-y-3 mb-6">
        {/* Starters Section */}
        {starters.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Starting Lineup ({starters.length}/15)
            </h3>
            <div className="space-y-2">
              {players.slice(0, 15).map((player, index) => (
                <PlayerRow
                  key={player.id || index}
                  player={player}
                  index={index}
                  onUpdate={(updates) => updatePlayer(index, updates)}
                  onRemove={() => removePlayer(index)}
                  onMoveUp={() => movePlayer(index, 'up')}
                  onMoveDown={() => movePlayer(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < 14}
                  dragIndex={dragIndex}
                  setDragIndex={setDragIndex}
                  onReorder={(fromIdx, toIdx) => handleDropReorder(fromIdx, toIdx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Substitutes Section */}
        {substitutes.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Substitutes ({substitutes.length}/6)
            </h3>
            <div className="space-y-2">
              {players.slice(15).map((player, subIndex) => {
                const actualIndex = subIndex + 15;
                return (
                  <PlayerRow
                    key={player.id || actualIndex}
                    player={player}
                    index={actualIndex}
                    onUpdate={(updates) => updatePlayer(actualIndex, updates)}
                    onRemove={() => removePlayer(actualIndex)}
                    onMoveUp={() => movePlayer(actualIndex, 'up')}
                    onMoveDown={() => movePlayer(actualIndex, 'down')}
                    canMoveUp={subIndex > 0}
                    canMoveDown={subIndex < substitutes.length - 1}
                    dragIndex={dragIndex}
                    setDragIndex={setDragIndex}
                    onReorder={(fromIdx, toIdx) => handleDropReorder(fromIdx, toIdx)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {players.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500 mb-4">No players added yet</p>
            <button
              onClick={addPlayer}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-gaa-green-muted text-gaa-green font-medium text-sm hover:bg-gaa-green hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Player
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!teamName.trim() || players.length === 0}
        className={`w-full py-3.5 rounded-lg font-medium text-center transition-colors ${
          !teamName.trim() || players.length === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          Save Teamsheet
        </span>
      </button>

      {/* Cancel Button */}
      <div className="mt-3 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel and go back home
        </Link>
      </div>
    </div>
  );
}
