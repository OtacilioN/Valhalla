import type { Team, CreateTeamInput, UpdateTeamInput } from "@/domain/entities/team";
import type { TeamRepository } from "@/domain/repositories/team.repository";
import { prisma } from "@/infrastructure/database/prisma";

export class PrismaTeamRepository implements TeamRepository {
  async findById(id: string): Promise<Team | null> {
    return prisma.team.findUnique({ where: { id } });
  }

  async findByCategoryId(categoryId: string): Promise<Team[]> {
    return prisma.team.findMany({
      where: { categoryId },
      orderBy: { name: "asc" },
    });
  }

  async findConfirmedByCategoryId(categoryId: string): Promise<Team[]> {
    return prisma.team.findMany({
      where: { categoryId, attendanceConfirmed: true },
      orderBy: { name: "asc" },
    });
  }

  async create(input: CreateTeamInput): Promise<Team> {
    return prisma.team.create({ data: input });
  }

  async update(id: string, input: UpdateTeamInput): Promise<Team> {
    return prisma.team.update({ where: { id }, data: input });
  }

  async confirmAttendance(id: string): Promise<Team> {
    return prisma.team.update({
      where: { id },
      data: { attendanceConfirmed: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.team.delete({ where: { id } });
  }
}
