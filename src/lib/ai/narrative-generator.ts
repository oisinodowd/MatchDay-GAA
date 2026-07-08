/**
 * Match Narrative Generator — UR-026, UR-067–70
 * Generates a written match summary from the event timeline.
 * Uses rule-based template engine (no external API required).
 */

import type { MatchEvent } from '@/stores/match-store';

interface NarrativeResult {
  summary: string;       // Full match narrative
  turningPoint: string;  // UR-067: Identified turning point
  highlights: string[];  // UR-068: Top 5 moments
  motmSuggestion: string; // UR-069: Man of the Match suggestion
}

/**
 * Generate match narrative from event timeline.
 */
export function generateNarrative(
  events: MatchEvent[],
  homeTeamName: string,
  awayTeamName: string,
  homeGoals: number,
  homePoints: number,
  awayGoals: number,
  awayPoints: number
): NarrativeResult {
  const homeTotal = homeGoals * 3 + homePoints;
  const awayTotal = awayGoals * 3 + awayPoints;

  // UR-067: Detect turning point — find minute where score differential changed most
  let maxDiffChange = 0;
  let turningPointMinute = 0;
  let runningHome = 0;
  let runningAway = 0;

  for (const event of events.sort((a, b) => a.minute - b.minute)) {
    const prevDiff = runningHome - runningAway;
    
    if (event.type === 'score') {
      const subtype = event.details?.subtype;
      const isTwoPoint = event.details?.isTwoPoint;

      let pointsAdded = 1; // default point
      if (subtype === 'goal') pointsAdded = 3;
      else if (subtype === '40m-point' && isTwoPoint) pointsAdded = 2;

      if (event.teamSide === 'home') runningHome += pointsAdded;
      else runningAway += pointsAdded;
    }

    const newDiff = runningHome - runningAway;
    if (Math.abs(newDiff - prevDiff) > maxDiffChange) {
      maxDiffChange = Math.abs(newDiff - prevDiff);
      turningPointMinute = event.minute;
    }
  }

  // UR-068: Top 5 moments — score by impact
  const momentScores = events.map(e => ({
    event: e,
    score: e.type === 'score' 
      ? (e.details?.subtype === 'goal' ? 10 : e.details?.isTwoPoint ? 7 : 2)
      : e.type.includes('_card') ? 5 : 2,
  })).sort((a, b) => b.score - a.score).slice(0, 5);

  // UR-069: MOTM suggestion — scoring formula
  const playerScores = events.reduce<Record<number, { goals: number; points: number; score: number }>>((acc, e) => {
    if (!e.playerIndex || e.type !== 'score') return acc;
    if (!(e.playerIndex in acc)) {
      acc[e.playerIndex] = { goals: 0, points: 0, score: 0 };
    }

    const ps = acc[e.playerIndex];

    if (e.details?.subtype === 'goal') {
      ps.goals += 1;
      ps.score += 3;
    } else if (e.details?.subtype === '40m-point' && e.details?.isTwoPoint) {
      ps.points += 2;
      ps.score += 2;
    } else {
      ps.points += 1;
      ps.score += 1;
    }

    return acc;
  }, {});

  const motmPlayer = Object.entries(playerScores)
    .sort((a, b) => b[1].score - a[1].score)[0];

  // UR-070: Press quote suggestion
  const winner = homeTotal > awayTotal ? homeTeamName : awayTotal > homeTotal ? awayTeamName : 'Neither';
  const pressQuote = `"A comprehensive team performance. We controlled large periods of the game and our scoring efficiency was key."`;

  return {
    summary: `${homeTeamName} ${homeGoals}-${homePoints} (${homeTotal}) — ${awayGoals}-${awayPoints} (${awayTotal}) ${awayTeamName}\n\n` +
      `A hard-fought contest at a competitive level. ${winner === 'Neither' ? 'The match ended in a draw' : `${winner} emerged victorious`} with a total of ${Math.max(homeTotal, awayTotal)} points from ${homeGoals + awayGoals} goals and ${homePoints + awayPoints} scores.\n\n` +
      `${events.length} events were recorded throughout the match, including ${events.filter(e => e.type.includes('_card')).length} disciplinary actions.`,
    turningPoint: `The turning point came in the ${turningPointMinute}'th minute when a significant scoring event shifted the momentum between the sides.`,
    highlights: momentScores.map(m => `${m.event.minute}' — ${m.event.type.replace('_', ' ')}${m.event.playerIndex ? ` by Player ${m.event.playerIndex + 1}` : ''} (${m.score} impact)`),
    motmSuggestion: motmPlayer 
      ? `Man of the Match: Player ${motmPlayer[0] + 1} — scored ${motmPlayer[1].goals} goal(s) and ${motmPlayer[1].points} point(s) for a total rating of ${motmPlayer[1].score}.`
      : 'Man of the Match: Could not determine — no individual scoring events recorded.',
  };
}
