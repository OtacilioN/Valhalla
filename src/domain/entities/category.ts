// Domain entity types for Category

export type CategoryType = "RESCUE" | "ARTISTIC";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  order: number;
  scoringFormula: string;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoreColumn {
  id: string;
  name: string;
  order: number;
  isReadOnly: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCategoryInput = {
  name: string;
  type: CategoryType;
  eventId: string;
  order?: number;
  scoringFormula: string;
};

export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, "eventId" | "type">>;

// ─── Default categories ───────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES: Array<{ name: string; type: CategoryType }> = [
  { name: "Rescue Level 1", type: "RESCUE" },
  { name: "Rescue Level 2", type: "RESCUE" },
  { name: "Artistic Level 1", type: "ARTISTIC" },
  { name: "Artistic Level 2", type: "ARTISTIC" },
];

// ─── Preset score column names ────────────────────────────────────────────────

export const RESCUE_COLUMNS = ["Round 1", "Time 1", "Round 2", "Time 2", "Round 3", "Time 3"];

export const ARTISTIC_COLUMNS = ["Interview", "Presentation 1", "Presentation 2", "Penalties"];

// ─── Preset scoring formulas ──────────────────────────────────────────────────

/**
 * Rescue scoring: sum of the best two rounds, discard the worst.
 * Tiebreaker: sum of times of the counted rounds (lower is better).
 *
 * Columns: [Round1, Time1, Round2, Time2, Round3, Time3]
 * Indices:  [0,      1,     2,      3,     4,      5    ]
 */
export const RESCUE_SCORING_FORMULA = `(function(scores) {
  var rounds = [scores[0], scores[2], scores[4]];
  var times  = [scores[1], scores[3], scores[5]];

  // Find index of worst round
  var worstIdx = 0;
  for (var i = 1; i < rounds.length; i++) {
    if (rounds[i] < rounds[worstIdx]) worstIdx = i;
  }

  var total = 0;
  var tiebreakerTime = 0;
  for (var j = 0; j < rounds.length; j++) {
    if (j !== worstIdx) {
      total += rounds[j];
      tiebreakerTime += times[j];
    }
  }

  return [total, tiebreakerTime];
})`;

/**
 * Artistic scoring formula as specified.
 *
 * Columns: [Interview, Presentation1, Presentation2, Penalties]
 * Indices:  [0,         1,             2,             3         ]
 */
export const ARTISTIC_SCORING_FORMULA = `(function(scores) {
  var max = scores[1] > scores[2] ? scores[1] : scores[2];
  var score = scores[0] + max;
  var sum_palco = scores[1] + scores[2];
  return [score, sum_palco, scores[3] * -1];
})`;
