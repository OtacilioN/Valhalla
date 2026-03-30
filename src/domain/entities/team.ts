// Domain entity types for Team

export interface Team {
  id: string;
  name: string;
  institution: string;
  city: string;
  state: string;
  attendanceConfirmed: boolean;
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
};

export type UpdateTeamInput = Partial<Omit<CreateTeamInput, "categoryId">> & {
  attendanceConfirmed?: boolean;
};
