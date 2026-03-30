// Domain entity types for Arena

export interface Arena {
  id: string;
  name: string;
  order: number;
  checkpointCount: number;
  checkpointTiles: string; // JSON array of tile counts per checkpoint
  seesaws: number;
  intersections: number;
  obstacles: number;
  ramps: number;
  gaps: number;
  speedBumps: number;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateArenaInput = {
  name: string;
  order?: number;
  checkpointCount?: number;
  checkpointTiles?: number[];
  seesaws?: number;
  intersections?: number;
  obstacles?: number;
  ramps?: number;
  gaps?: number;
  speedBumps?: number;
  eventId: string;
};

export type UpdateArenaInput = Partial<Omit<CreateArenaInput, "eventId">>;
