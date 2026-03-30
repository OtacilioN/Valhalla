import type { RankedTeam } from "@/domain/entities/score";
import { logger } from "@/lib/logger";

type ScoringFunction = (scores: number[]) => [number, ...number[]];

/**
 * Safely evaluate a scoring formula string.
 * The formula must be an IIFE that takes scores: number[] and returns an array.
 */
function compileScoringFormula(formula: string): ScoringFunction {
  try {
    // The formula is stored as an IIFE string like: (function(scores) { ... })
    // We evaluate it to get the function, then call it with scores.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(`return ${formula}`)() as ScoringFunction;
    return fn;
  } catch (err) {
    logger.error("Failed to compile scoring formula", { formula, err });
    // Fallback: return sum of scores
    return (scores) => [scores.reduce((a, b) => a + b, 0)];
  }
}

/**
 * Apply a scoring formula to a set of score values.
 */
export function applyFormula(formula: string, scores: number[]): [number, ...number[]] {
  const fn = compileScoringFormula(formula);
  try {
    const result = fn(scores);
    if (!Array.isArray(result) || result.length === 0) {
      return [0];
    }
    return result as [number, ...number[]];
  } catch (err) {
    logger.error("Scoring formula execution failed", { err });
    return [0];
  }
}

/**
 * Rank teams within a category based on their scores.
 *
 * Sorting rules:
 * 1. Higher finalScore is better
 * 2. Tiebreakers: lower values are better (e.g., time)
 *    Exception: if tiebreaker is explicitly negative (penalties), higher is better
 */
export function rankTeams(
  teams: Array<{
    teamId: string;
    teamName: string;
    institution: string;
    city: string;
    state: string;
    scores: number[];
  }>,
  formula: string,
): RankedTeam[] {
  const teamsWithScores: RankedTeam[] = teams.map((team) => {
    const result = applyFormula(formula, team.scores);
    const [finalScore, ...tiebreakers] = result;
    return {
      ...team,
      finalScore: finalScore ?? 0,
      tiebreakers,
      rank: 0,
    };
  });

  // Sort: higher finalScore first, then by tiebreakers (lower is better)
  teamsWithScores.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
      const ta = a.tiebreakers[i] ?? 0;
      const tb = b.tiebreakers[i] ?? 0;
      if (ta !== tb) return ta - tb; // lower tiebreaker wins
    }
    return 0;
  });

  // Assign ranks (tied teams get the same rank)
  let currentRank = 1;
  for (let i = 0; i < teamsWithScores.length; i++) {
    if (i === 0) {
      teamsWithScores[i]!.rank = currentRank;
    } else {
      const prev = teamsWithScores[i - 1]!;
      const curr = teamsWithScores[i]!;
      const isTied =
        curr.finalScore === prev.finalScore &&
        JSON.stringify(curr.tiebreakers) === JSON.stringify(prev.tiebreakers);
      if (isTied) {
        curr.rank = prev.rank;
      } else {
        currentRank = i + 1;
        curr.rank = currentRank;
      }
    }
  }

  return teamsWithScores;
}
