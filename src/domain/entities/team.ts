// Domain entity types for Team

export interface Team {
  id: string;
  name: string;
  institution: string;
  city: string;
  state: string;
  attendanceConfirmed: boolean;
  externalSource: string | null;
  externalId: string | null;
  externalEventToken: string | null;
  externalStepId: string | null;
  externalStepName: string | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTeamInput = {
  name: string;
  institution: string;
  city: string;
  state: string;
  categoryId: string;
  externalSource?: string;
  externalId?: string;
  externalEventToken?: string;
  externalStepId?: string;
  externalStepName?: string;
};

export type UpdateTeamInput = Partial<Omit<CreateTeamInput, "categoryId">> & {
  attendanceConfirmed?: boolean;
};
