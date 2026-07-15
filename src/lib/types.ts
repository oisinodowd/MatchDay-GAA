// Shared types used across the application

export interface SligoFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  competition: string;
  sport: 'gaelic-football' | 'hurling';
}
