'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Player } from '@/stores/match-store';
import { generateId, validateTeamPlayers } from '@/lib/utils/helpers';
import PositionSelector from '@/components/team-sheet/PositionSelector';
import PhotoUpload from '@/components/team-sheet/PhotoUpload';
import { db, type SavedTeamSheet } from '@/lib/db/matchday-db';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, UserPlus, AlertCircle, CheckCircle2, Save } from 'lucide-react';

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

function PlayerRow({ player, index, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, dragIndex, setDragIndex, onReorder }: PlayerRowProps) {
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
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIndex) && fromIndex !== index && onReorder) {
      onReorder(fromIndex, index);
    }
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-white transition-opacity ${
        dragIndex === index ? 'opacity-50' : 'opacity-100'
      } ${dragIndex !== null && dragIndex !== index ? 'hover:border-green-400 hover:bg-green-50/30' : ''}`}
    >
      {/* Drag Handle */}
      <div className="text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 2a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm0 2a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM8 6a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm0 2a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm0 4a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" />
        </svg>
      </div>

      {/* Player Number */}
      <input
        type="number"
        value={player.number}
        onChange={(e) => onUpdate({ number: parseInt(e.target.value) || 0 })}
        className="w-12 text-center font-bold text-lg border rounded-lg py-1 flex-shrink-0"
        min={1}
      />

      {/* Player Name */}
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Player name"
        className="flex-1 px-3 py-2 border rounded-lg text-sm min-w-0"
      />

      {/* Position */}
      <PositionSelector
        value={player.position || 'SUB'}
        onChange={(pos) => onUpdate({ position: pos })}
      />

      {/* Starter Toggle - now works correctly without auto-overwrite */}
      <label className="flex items-center gap-1.5 text-xs font-medium flex-shrink-0">
        <input
          type="checkbox"
          checked={player.isStarter}
          onChange={(e) => onUpdate({ isStarter: e.target.checked })}
          className="rounded border-gray-300 w-4 h-4"
        />
        Starter
      </label>

      {/* Photo Upload */}
      <PhotoUpload
        currentPhoto={player.photoUrl || ''}
        onPhotoChange={(file) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            onUpdate({ photoUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
        }}
        onClear={() => onUpdate({ photoUrl: '' })}
      />

      {/* Move Buttons */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className={`p-1 rounded ${canMoveUp ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className={`p-1 rounded ${canMoveDown ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Remove Button - only disable for starters in first 15 positions */}
      <button
        onClick={onRemove}
        disabled={player.isStarter && index < 15}
        className={`p-1.5 rounded flex-shrink-0 ${!player.isStarter || index >= 15 ? 'hover:bg-red-50 text-red-400 hover:text-red-600' : 'opacity-30 cursor-not-allowed'}`}
      >
        <Trash2 className="w-4 h-4" />
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
