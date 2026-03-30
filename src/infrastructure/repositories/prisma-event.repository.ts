import type { Event, CreateEventInput, UpdateEventInput } from "@/domain/entities/event";
import type { EventRepository } from "@/domain/repositories/event.repository";
import { prisma } from "@/infrastructure/database/prisma";

export class PrismaEventRepository implements EventRepository {
  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({ where: { id } });
  }

  async findActive(): Promise<Event | null> {
    return prisma.event.findFirst({ where: { isActive: true } });
  }

  async findAll(): Promise<Event[]> {
    return prisma.event.findMany({ orderBy: { startDate: "desc" } });
  }

  async create(input: CreateEventInput): Promise<Event> {
    return prisma.event.create({ data: input });
  }

  async update(id: string, input: UpdateEventInput): Promise<Event> {
    return prisma.event.update({ where: { id }, data: input });
  }

  async setActive(id: string): Promise<Event> {
    // Deactivate all events, then activate the target
    await prisma.event.updateMany({ data: { isActive: false } });
    return prisma.event.update({ where: { id }, data: { isActive: true } });
  }

  async delete(id: string): Promise<void> {
    await prisma.event.delete({ where: { id } });
  }
}
