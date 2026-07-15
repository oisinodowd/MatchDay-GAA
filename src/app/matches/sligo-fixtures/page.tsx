'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Calendar, MapPin, Clock, Trophy, Play, Loader2, Filter, ChevronDown } from 'lucide-react';
import type { SligoFixture } from '@/lib/types';

export default function SligoFixturesPage() {
  const router = useRouter();

  const [fixtures, setFixtures] = useState<SligoFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('loading');
  
  // Search & filter state
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState<'all' | 'gaelic-football' | 'hurling'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'competition'>('date');

  useEffect(() => {
    async function loadFixtures() {
      try {
        const res = await fetch('/api/sligo-fixtures');
        if (!res.ok) throw new Error('Failed to load fixtures');
        const data = await res.json();
        setFixtures(data.fixtures || []);
        setSource(data.source || 'curated');
      } catch (err) {
        setError('Could not load fixtures. Using curated data.');
        // Fallback empty — the user can still use the page
      } finally {
        setLoading(false);
      }
    }
    loadFixtures();
  }, []);

  // Filter and sort fixtures
  const filteredFixtures = useMemo(() => {
    let result = [...fixtures];

    // Sport filter
    if (sportFilter !== 'all') {
      result = result.filter(f => f.sport === sportFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.homeTeam.toLowerCase().includes(q) ||
        f.awayTeam.toLowerCase().includes(q) ||
        f.competition.toLowerCase().includes(q) ||
        f.venue.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      result.sort((a, b) => a.competition.localeCompare(b.competition));
    }

    return result;
  }, [fixtures, search, sportFilter, sortBy]);

  const handleStartMatch = (fixture: SligoFixture) => {
    const params = new URLSearchParams({
      home: fixture.homeTeam,
      away: fixture.awayTeam,
      venue: fixture.venue,
      sport: fixture.sport,
      competition: fixture.competition,
      from: 'sligo-fixture',
    });
    router.push(`/matches/new?${params.toString()}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isPastFixture = (dateStr: string) => {
    try {
      return new Date(dateStr) < new Date();
    } catch {
      return false;
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-gaa-green hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #000000 50%, #ffffff 50%)',
            borderRadius: '8px',
            border: '2px solid #d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 900, color: '#000',
          }}>S</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sligo GAA Fixtures</h1>
            <p className="text-xs text-gray-500">
              {'📋 Sligo GAA fixture list'} 
              {!loading && ` · ${fixtures.length} fixtures`}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card-elevated p-4 mb-6">
        <div className="flex gap-3 mb-3">
          {/* Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams, venues, competitions..."
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                border: '1px solid #e5e7eb', borderRadius: '10px',
                fontSize: '13px', color: '#1f2937', background: '#f9fafb',
                outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Sport Filter */}
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value as typeof sportFilter)}
            style={{
              padding: '10px 32px 10px 12px',
              border: '1px solid #e5e7eb', borderRadius: '10px',
              fontSize: '13px', fontWeight: 600, color: '#374151',
              background: '#f9fafb', outline: 'none', cursor: 'pointer',
              appearance: 'none', WebkitAppearance: 'none',
            }}
          >
            <option value="all">All Sports</option>
            <option value="gaelic-football">⚽ Football</option>
            <option value="hurling">🏑 Hurling</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: '10px 32px 10px 12px',
              border: '1px solid #e5e7eb', borderRadius: '10px',
              fontSize: '13px', fontWeight: 600, color: '#374151',
              background: '#f9fafb', outline: 'none', cursor: 'pointer',
              appearance: 'none', WebkitAppearance: 'none',
            }}
          >
            <option value="date">By Date</option>
            <option value="competition">By Competition</option>
          </select>
        </div>

        <p className="text-xs text-gray-400">
          {filteredFixtures.length} fixture{filteredFixtures.length !== 1 ? 's' : ''} found
          {search && ` for "${search}"`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gaa-green" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card-elevated p-4 mb-4 text-center text-sm text-amber-700 bg-amber-50">
          {error}
        </div>
      )}

      {/* Fixtures List */}
      {!loading && (
        <div className="space-y-3">
          {filteredFixtures.length === 0 ? (
            <div className="text-center py-12 card-elevated">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No fixtures match your search</p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    marginTop: '8px', padding: '6px 16px',
                    background: '#f3f4f6', border: 'none', borderRadius: '8px',
                    fontSize: '13px', color: '#374151', cursor: 'pointer',
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredFixtures.map((fixture) => {
              const past = isPastFixture(fixture.date);

              return (
                <div
                  key={fixture.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e5e7eb',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    opacity: past ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!past) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
                >
                  {/* Competition Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.05em', color: '#6b7280',
                      background: '#f3f4f6', padding: '3px 8px', borderRadius: '20px',
                    }}>
                      {fixture.sport === 'gaelic-football' ? '⚽ Football' : '🏑 Hurling'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                      {fixture.competition}
                    </span>
                  </div>

                  {/* Teams */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827', flex: 1, textAlign: 'right' }}>
                      {fixture.homeTeam}
                    </span>
                    <span style={{
                      fontSize: '13px', fontWeight: 900, color: '#9ca3af',
                      background: '#f9fafb', padding: '4px 10px', borderRadius: '8px',
                    }}>
                      VS
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827', flex: 1 }}>
                      {fixture.awayTeam}
                    </span>
                  </div>

                  {/* Details Row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar style={{ width: '13px', height: '13px' }} />
                      {formatDate(fixture.date)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '13px', height: '13px' }} />
                      {fixture.time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin style={{ width: '13px', height: '13px' }} />
                      {fixture.venue}
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartMatch(fixture)}
                    disabled={past}
                    style={{
                      width: '100%', padding: '10px',
                      border: 'none', borderRadius: '10px',
                      background: past ? '#f3f4f6' : '#166534',
                      color: past ? '#9ca3af' : '#ffffff',
                      fontSize: '14px', fontWeight: 700,
                      cursor: past ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (!past) e.currentTarget.style.background = '#14532d'; }}
                    onMouseLeave={(e) => { if (!past) e.currentTarget.style.background = '#166534'; }}
                  >
                    <Play style={{ width: '16px', height: '16px' }} />
                    {past ? 'Match Completed' : 'Start Match'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
