import type { Event, CreateEventInput, UpdateEventInput } from "@/domain/entities/event";

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findActive(): Promise<Event | null>;
  findAll(): Promise<Event[]>;
  create(input: CreateEventInput): Promise<Event>;
  update(id: string, input: UpdateEventInput): Promise<Event>;
  setActive(id: string): Promise<Event>;
  delete(id: string): Promise<void>;
}
