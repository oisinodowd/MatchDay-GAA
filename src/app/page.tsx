'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMatchStore } from '@/stores/match-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ArrowRight, Play, Users, Trash2, Loader2, Plus, Calendar } from 'lucide-react';
import { db, type SavedTeamSheet } from '@/lib/db/matchday-db';

export default function HomePage() {
  const match = useMatchStore((s) => s.match);
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);
  const setAccessibilityMode = useSettingsStore((s) => s.setAccessibilityMode);

  // Teamsheet presets state
  const [teamSheets, setTeamSheets] = useState<SavedTeamSheet[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(true);
  const [showTeamsheets, setShowTeamsheets] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeamSheets() {
      try {
        const sheets = await db.teamsheets.toArray();
        setTeamSheets(sheets);
      } catch (error) {
        console.error('Failed to load team sheets:', error);
      } finally {
        setLoadingSheets(false);
      }
    }
    loadTeamSheets();
  }, []);

  const handleDeleteSheet = async (sheetId: string) => {
    await db.teamsheets.delete(sheetId);
    setTeamSheets(prev => prev.filter(s => s.id !== sheetId));
    setDeleteConfirmId(null);
  };

  const rainMode = accessibilityMode === 'rain-mode';

  // Check if there's an active match in progress
  const hasActiveMatch = match && (match.status === 'draft' || match.status === 'first-half' || match.status === 'halftime' || match.status === 'second-half');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`font-bold tracking-tight ${rainMode ? 'text-rain-lg' : 'text-3xl'} text-gaa-green`}>
          MatchDay GAA
        </h1>
        <p className={`mt-1 ${rainMode ? 'text-rain-sm' : 'text-sm'} text-gray-500`}>
          Pitch-side match recording for volunteer statisticians
        </p>
      </div>

      {/* Active Match Banner */}
      {hasActiveMatch && (
        <Link href="/matches/active" className="block mb-6">
          <div className={`card-elevated p-5 border-l-4 border-l-gaa-green ${rainMode ? 'p-6' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-semibold text-gaa-green ${rainMode ? 'text-rain-md' : 'text-lg'}`}>
                  Match in Progress
                </p>
                <p className={`mt-0.5 ${rainMode ? 'text-rain-sm' : 'text-sm'} text-gray-500`}>
                  Tap to continue recording
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gaa-green" />
            </div>
          </div>
        </Link>
      )}

      {/* New Match Button */}
      <Link href="/matches/new" className="block mb-4">
        <button className={`btn-primary w-full py-3.5 text-center ${rainMode ? 'text-rain-md min-h-[60px]' : ''}`}>
          <span className="flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            New Match
          </span>
        </button>
      </Link>

      {/* Sligo GAA Fixtures Button */}
      <Link href="/matches/sligo-fixtures" className="block mb-4">
        <button 
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            border: '2px solid #000',
            background: '#ffffff',
            color: '#111827',
            fontSize: '15px', fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
        >
          <span style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #000000 50%, #ffffff 50%)',
            border: '1.5px solid #d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 900, color: '#000',
          }}>S</span>
          <Calendar className="w-4 h-4" />
          Sligo GAA Fixtures
        </button>
      </Link>

      {/* Create New Teamsheet Button */}
      <Link href="/matches/new-sheet" className="block mb-6">
        <button className={`w-full py-3.5 rounded-lg border-2 border-dashed border-green-300 text-green-700 font-medium text-center hover:bg-green-50 transition-colors ${rainMode ? 'text-rain-md min-h-[60px]' : ''}`}>
          <span className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Teamsheet
          </span>
        </button>
      </Link>

      {/* Teamsheet Presets Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowTeamsheets(!showTeamsheets)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
            showTeamsheets ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <h2 className={`font-semibold ${rainMode ? 'text-rain-md' : ''}`}>
                Saved Teamsheets
              </h2>
              <p className={`text-xs text-gray-500`}>
                {loadingSheets ? 'Loading...' : `${teamSheets.length} presets loaded`}
              </p>
            </div>
          </div>
        </button>

        {showTeamsheets && (
          <div className="mt-3 space-y-2">
            {loadingSheets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : teamSheets.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No saved teamsheets yet. Use the button above to create your first preset.</p>
            ) : (
              teamSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  onClick={() => window.location.href = `/matches/new?preset=${sheet.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{sheet.name}</p>
                    <p className="text-xs text-gray-500">
                      {sheet.players.length} players • {new Date(sheet.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(sheet.id);
                    }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className={`mx-4 w-full max-w-sm rounded-xl ${rainMode ? 'bg-gray-900' : 'bg-white'} p-6 shadow-xl`}>
            <h3 className={`text-lg font-bold mb-2 ${rainMode ? 'text-rain-md' : ''}`}>Delete Teamsheet?</h3>
            <p className={`text-sm mb-4 ${rainMode ? 'text-rain-sm text-gray-300' : 'text-gray-600'}`}>This will permanently remove this teamsheet preset. This action cannot be undone.</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className={`flex-1 py-2.5 rounded-lg border font-medium text-sm ${rainMode ? 'border-gray-700 text-rain-md' : 'hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSheet(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Settings */}
      <div className="mb-6">
        <h2 className={`text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 ${rainMode ? 'text-rain-sm' : ''}`}>
          Display Settings
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setAccessibilityMode(rainMode ? 'standard' : 'rain-mode')}
            className={`card-elevated p-4 text-left transition ${
              rainMode ? 'ring-2 ring-gaa-green' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-semibold ${rainMode ? 'text-rain-sm' : 'text-sm'}`}>Rain Mode</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                rainMode ? 'bg-gaa-green text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {rainMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className={`text-xs ${rainMode ? 'text-rain-xs' : 'text-xs'} text-gray-500`}>Large touch targets</p>
          </button>

          <button
            onClick={() => setAccessibilityMode('large-text')}
            className={`card-elevated p-4 text-left transition ${
              accessibilityMode === 'large-text' ? 'ring-2 ring-gaa-green' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-semibold ${rainMode ? 'text-rain-sm' : 'text-sm'}`}>Large Text</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                accessibilityMode === 'large-text' ? 'bg-gaa-green text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {accessibilityMode === 'large-text' ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className={`text-xs ${rainMode ? 'text-rain-xs' : 'text-xs'} text-gray-500`}>Larger fonts</p>
          </button>
        </div>
      </div>
    </div>
  );
}
