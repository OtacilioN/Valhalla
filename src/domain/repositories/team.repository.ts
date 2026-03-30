import type { Team, CreateTeamInput, UpdateTeamInput } from "@/domain/entities/team";

export interface TeamRepository {
  findById(id: string): Promise<Team | null>;
  findByCategoryId(categoryId: string): Promise<Team[]>;
  findConfirmedByCategoryId(categoryId: string): Promise<Team[]>;
  create(input: CreateTeamInput): Promise<Team>;
  update(id: string, input: UpdateTeamInput): Promise<Team>;
  confirmAttendance(id: string): Promise<Team>;
  delete(id: string): Promise<void>;
}
