'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMatchStore, Player } from '@/stores/match-store';
import { generateId, validateTeamPlayers } from '@/lib/utils/helpers';
import PhotoUpload from './PhotoUpload';
import PositionSelector from './PositionSelector';
import { db, type SavedTeamSheet } from '@/lib/db/matchday-db';
import { Plus, Trash2, ChevronUp, ChevronDown, UserPlus, AlertCircle, CheckCircle2, GripVertical, Save } from 'lucide-react';

interface TeamSheetBuilderProps {
  teamName: string;
  teamSide: 'home' | 'away';
  initialPlayers?: Player[];
  onPlayersChange?: (players: Player[]) => void;
}

export default function TeamSheetBuilder({ teamName, teamSide, initialPlayers, onPlayersChange }: TeamSheetBuilderProps) {
  const updateTeamPlayers = useMatchStore((s) => s.updateTeamPlayers);
  
  const [players, setPlayers] = useState<Player[]>(initialPlayers || []);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Sync player changes back to parent component
  useEffect(() => {
    if (onPlayersChange) {
      onPlayersChange(players);
    }
  }, [players, onPlayersChange]);

  const addPlayer = useCallback(() => {
    // No cap - infinite substitutions allowed
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
    setIsSaved(false);
  }, [players.length]);

  const removePlayer = useCallback((index: number) => {
    setPlayers(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Reassign starter status
      return updated.map((p, i) => ({
        ...p,
        isStarter: i < 15,
      }));
    });
    setIsSaved(false);
  }, []);

  const movePlayer = useCallback((index: number, direction: 'up' | 'down') => {
    setPlayers(prev => {
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      
      const newPlayers = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newPlayers[index], newPlayers[swapIndex]] = [newPlayers[swapIndex], newPlayers[index]];
      
      // Reassign starter status based on position
      return newPlayers.map((p, i) => ({
        ...p,
        isStarter: i < 15,
      }));
    });
    setIsSaved(false);
  }, []);

  const updatePlayer = useCallback((index: number, updates: Partial<Player>) => {
    setPlayers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      
      // Auto-assign starter status based on position in list
      return updated.map((p, i) => ({
        ...p,
        isStarter: i < 15,
      }));
    });
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    const validationErrors = validateTeamPlayers(players);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    updateTeamPlayers(teamSide, players);
    setErrors([]);
    setIsSaved(true);
    
    // Persist team sheet to IndexedDB
    try {
      await db.teamsheets.add({
        id: generateId(),
        name: teamName,
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
    }
    
    setTimeout(() => setIsSaved(false), 3000);
  }, [players, teamSide, updateTeamPlayers, teamName]);

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
    setIsSaved(false);
  }, []);

  const starters = players.filter((_, i) => i < 15);
  const substitutes = players.filter((_, i) => i >= 15);
  const validationErrors = validateTeamPlayers(players);

  return (
    <div className="card-elevated p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${teamSide === 'home' ? 'text-blue-600' : 'text-red-600'}`}>
          {teamName} Team Sheet
        </h2>
        
        {/* Save Status */}
        {isSaved && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Saved!</span>
          </div>
        )}
      </div>

      {/* Player Count Badge */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        <span className={`px-2 py-1 rounded-full ${starters.length === 15 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {starters.length}/15 Starters
        </span>
        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
          {substitutes.length} Subs (unlimited)
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={addPlayer}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg bg-gaa-green-muted text-gaa-green font-medium text-sm hover:bg-gaa-green hover:text-white transition-colors`}
        >
          <Plus className="w-4 h-4" />
          Add Player
        </button>
        <button
          onClick={handleQuickAdd}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg bg-gaa-green-muted text-gaa-green font-medium text-sm hover:bg-gaa-green hover:text-white transition-colors`}
        >
          <UserPlus className="w-4 h-4" />
          Quick Add 30
        </button>
      </div>

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

      {/* Players List */}
      <div className="space-y-3 mb-4">
        {/* Starters Section */}
        {starters.length > 0 && (
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2`}>
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
                  onDropOn={(targetIndex) => {
                    setPlayers(prev => {
                      const newPlayers = [...prev];
                      // Adjust target index based on source position to account for splice shifting indices
                      let adjustedTarget = targetIndex;
                      if (index < targetIndex) {
                        adjustedTarget = targetIndex - 1;
                      }
                      const [draggedPlayer] = newPlayers.splice(index, 1);
                      newPlayers.splice(adjustedTarget, 0, draggedPlayer);
                      return newPlayers.map((p, i) => ({ ...p, isStarter: i < 15 }));
                    });
                  }}
                  canMoveUp={index > 0}
                  canMoveDown={index < 14}
                />
              ))}
            </div>
          </div>
        )}

        {/* Substitutes Section */}
        {substitutes.length > 0 && (
          <div className="mt-4">
            <h3 className={`text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2`}>
              Substitutes ({substitutes.length}/6)
            </h3>
            <div className="space-y-2">
              {players.slice(15).map((player, startIndex) => (
                <PlayerRow
                  key={player.id || startIndex + 15}
                  player={player}
                  index={startIndex + 15}
                  onUpdate={(updates) => updatePlayer(startIndex + 15, updates)}
                  onRemove={() => removePlayer(startIndex + 15)}
                  onMoveUp={() => movePlayer(startIndex + 15, 'up')}
                  onMoveDown={() => movePlayer(startIndex + 15, 'down')}
                  onDropOn={(targetIndex) => {
                    setPlayers(prev => {
                      const newPlayers = [...prev];
                      const [draggedPlayer] = newPlayers.splice(startIndex + 15, 1);
                      newPlayers.splice(targetIndex, 0, draggedPlayer);
                      return newPlayers.map((p, i) => ({ ...p, isStarter: i < 15 }));
                    });
                  }}
                  canMoveUp={startIndex > 0}
                  canMoveDown={startIndex < substitutes.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Remove Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={addPlayer}
          disabled={players.length >= 21}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
            players.length >= 21
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gaa-green text-white hover:bg-gaa-green-light'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Player
        </button>
        
        {players.length > 1 && (
          <button
            onClick={() => removePlayer(players.length - 1)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors`}
          >
            <Trash2 className="w-4 h-4" />
            Remove Last
          </button>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={players.length < 15 || validationErrors.length > 0}
        className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
          players.length >= 15 && validationErrors.length === 0
            ? 'bg-gaa-green hover:bg-gaa-green-light'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        Save Team Sheet ({players.length} players)
      </button>
    </div>
  );
}

interface PlayerRowProps {
  player: Player;
  index: number;
  onUpdate: (updates: Partial<Player>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDropOn?: (targetIndex: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function PlayerRow({ player, index, onUpdate, onRemove, onMoveUp, onMoveDown, onDropOn, canMoveUp, canMoveDown }: PlayerRowProps) {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const handlePhotoChange = async (file: File) => {
    try {
      const { compressImage } = await import('@/lib/utils/image-utils');
      const compressed = await compressImage(file);
      onUpdate({ photoUrl: compressed });
    } catch (error) {
      console.error('Failed to compress image:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-white relative" draggable={true} onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); e.currentTarget.style.opacity = '0.5'; }} onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }} onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-gaa-green', 'bg-green-100'); }} onDragLeave={(e) => { e.currentTarget.classList.remove('border-gaa-green', 'bg-green-100'); }} onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-gaa-green', 'bg-green-100'); const draggedIndex = parseInt(e.dataTransfer.getData('text/plain')); if (onDropOn && draggedIndex !== index) { onDropOn(index); } }}>
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Position Controls */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className={`p-0.5 rounded ${canMoveUp ? 'hover:bg-gray-200' : 'text-gray-300 cursor-not-allowed'}`}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className={`p-0.5 rounded ${canMoveDown ? 'hover:bg-gray-200' : 'text-gray-300 cursor-not-allowed'}`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Photo */}
      <div className="relative">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name || `Player ${index + 1}`}
            className="w-8 h-8 rounded-full object-cover border-2 border-gaa-green"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-500">{(index + 1).toString()[0]}</span>
          </div>
        )}
        <button
          onClick={() => setShowPhotoUpload(!showPhotoUpload)}
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Photo Upload Dropdown - positioned relative to parent */}
      {showPhotoUpload && (
        <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border p-3">
          <PhotoUpload
            currentPhoto={player.photoUrl || ''}
            onPhotoChange={handlePhotoChange}
            onClear={() => onUpdate({ photoUrl: '' })}
          />
        </div>
      )}

      {/* Jersey Number */}
      <input
        type="number"
        value={player.number}
        onChange={(e) => onUpdate({ number: parseInt(e.target.value) || 0 })}
        className="w-12 text-center font-bold text-sm border rounded px-1 py-1"
        min={1}
        max={99}
      />

      {/* Name Input */}
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder={`Player ${index + 1}`}
        className="flex-1 text-sm border rounded px-2 py-1 min-w-0 text-gray-900 bg-white"
      />

      {/* Position Selector */}
      <PositionSelector
        value={player.position || 'SUB'}
        onChange={(position) => onUpdate({ position })}
        compact
      />

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
