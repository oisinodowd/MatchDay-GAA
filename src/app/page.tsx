'use client';

import { useMatchStore } from '@/stores/match-store';

export default function HomePage() {
  const createMatch = useMatchStore((state) => state.createMatch);
  
  const handleQuickStart = () => {
    // Create a sample match for demonstration
    createMatch(
      { name: 'Dublin', shortCode: 'DUB', goals: 0, points: 0 },
      { name: 'Cork', shortCode: 'COR', goals: 0, points: 0 },
      'gaelic-football'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gaa-green to-gaa-green-dark text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold font-display">MatchDay GAA</h1>
          <p className="mt-2 text-white/70">Record Gaelic football & hurling matches pitch-side</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Match Recording, Simplified</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Offline-first match statistics for GAA clubs. Record scores, cards, substitutions, and more — even without internet.
          </p>
        </section>

        {/* Quick Start Button */}
        <div className="text-center">
          <button
            onClick={handleQuickStart}
            className="btn-touch bg-gaa-gold text-black font-semibold px-8 py-4 rounded-lg hover:bg-gaa-gold-light transition-colors"
          >
            Start New Match
          </button>
          <p className="mt-4 text-white/60 text-sm">
            Demo mode — works offline without Supabase
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-white/50 text-sm">
          MatchDay GAA — Built for GAA clubs, by tech volunteers
        </div>
      </footer>
    </div>
  );
}
