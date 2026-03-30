// Domain entity types for Score

export interface Score {
  id: string;
  columnIndex: number;
  value: number;
  teamId: string;
  categoryId: string;
  arenaId: string | null;
  submittedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateScoreInput = {
  columnIndex: number;
  value: number;
  teamId: string;
  categoryId: string;
  arenaId?: string;
  submittedBy?: string;
};

export type SubmitScoresInput = {
  teamId: string;
  categoryId: string;
  arenaId?: string;
  scores: Array<{ columnIndex: number; value: number }>;
  submittedBy?: string;
};

export interface RankedTeam {
  teamId: string;
  teamName: string;
  institution: string;
  city: string;
  state: string;
  scores: number[];
  finalScore: number;
  tiebreakers: number[];
  rank: number;
}
