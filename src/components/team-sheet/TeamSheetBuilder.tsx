'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMatchStore, Player } from '@/stores/match-store';
import { generateId, validateTeamPlayers } from '@/lib/utils/helpers';
import FormationPitch, { mapPlayersToFormationIndices } from './FormationPitch';
import { db } from '@/lib/db/matchday-db';
import { Plus, Trash2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

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

      {/* Formation Pitch Preview */}
      {players.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Formation Preview
          </h3>
          <FormationPitch
            players={players}
            teamSide={teamSide}
            compact
            interactive
            onDropPlayer={(slotIndex, playerIndex) => {
              // Map slot index → position
              let position: string;
              if (slotIndex === 0) position = 'GK';
              else if (slotIndex <= 6) position = 'DEF';
              else if (slotIndex <= 8) position = 'MID';
              else position = 'FWD';

              setPlayers(prev => {
                const newPlayers = [...prev];
                const dragged = newPlayers[playerIndex];
                if (!dragged) return prev;

                // Update the dragged player's position
                newPlayers[playerIndex] = { ...dragged, position };

                // If the player was a sub (index >= 15), move them into the top 15
                if (playerIndex >= 15 && newPlayers.length > 14) {
                  // Find the current occupant of this slot
                  const formation = mapPlayersToFormationIndices(newPlayers);
                  const occupantIdx = formation[slotIndex];
                  
                  if (occupantIdx !== null && occupantIdx >= 0 && occupantIdx < 15 && occupantIdx !== playerIndex) {
                    // Swap the sub with the player currently in that slot
                    const temp = newPlayers[playerIndex];
                    newPlayers[playerIndex] = newPlayers[occupantIdx];
                    newPlayers[occupantIdx] = temp;
                  } else if (newPlayers.length > 14) {
                    // No specific occupant — move to index 14 (last starter)
                    const moved = newPlayers.splice(playerIndex, 1)[0];
                    newPlayers.splice(14, 0, moved);
                  }
                }

                return newPlayers.map((p, i) => ({
                  ...p,
                  isStarter: i < 15,
                }));
              });
            }}
          />
        </div>
      )}

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

const POSITION_COLORS: Record<string, { dot: string; accent: string; text: string }> = {
  GK:  { dot: '#eab308', accent: '#fef9c3', text: '#854d0e' },
  DEF: { dot: '#3b82f6', accent: '#dbeafe', text: '#1e40af' },
  MID: { dot: '#22c55e', accent: '#dcfce7', text: '#166534' },
  FWD: { dot: '#ef4444', accent: '#fee2e2', text: '#991b1b' },
  SUB: { dot: '#9ca3af', accent: '#f3f4f6', text: '#4b5563' },
};

function PlayerRow({ player, index, onUpdate, onRemove, onMoveUp, onMoveDown, onDropOn, canMoveUp, canMoveDown }: PlayerRowProps) {
  const pc = POSITION_COLORS[player.position || 'SUB'] || POSITION_COLORS.SUB;
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('application/x-player-index', String(index)); }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const from = parseInt(e.dataTransfer.getData('application/x-player-index')); if (onDropOn && !isNaN(from) && from !== index) onDropOn(index); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '12px',
        background: dragOver ? '#f0fdf4' : '#ffffff',
        border: dragOver ? '2px solid #22c55e' : '1px solid #e5e7eb',
        boxShadow: dragOver ? '0 2px 8px rgba(34,197,94,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all 0.15s ease',
        cursor: 'grab',
        position: 'relative',
        borderLeft: `3px solid ${pc.dot}`,
      }}
    >
      {/* Grip */}
      <div style={{ color: '#cbd5e1', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
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
          onClick={(e) => e.stopPropagation()}
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
        onClick={(e) => e.stopPropagation()}
        placeholder={`Player ${index + 1}`}
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
          onClick={(e) => e.stopPropagation()}
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
          <option value="GK" style={{ background: '#fff', color: '#1f2937' }}>GK</option>
          <option value="DEF" style={{ background: '#fff', color: '#1f2937' }}>DEF</option>
          <option value="MID" style={{ background: '#fff', color: '#1f2937' }}>MID</option>
          <option value="FWD" style={{ background: '#fff', color: '#1f2937' }}>FWD</option>
          <option value="SUB" style={{ background: '#fff', color: '#1f2937' }}>SUB</option>
        </select>
        {/* Custom dropdown arrow */}
        <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: pc.text, opacity: 0.6 }} width="10" height="10" viewBox="0 0 10 10"><path d="M2 3l3 4 3-4z" fill="currentColor"/></svg>
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '6px',
          color: '#d1d5db',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'transparent'; }}
        title="Remove player"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
          <path d="M3.5 3.5l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
