import type {
  Category,
  ScoreColumn,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryType,
} from "@/domain/entities/category";
import type { CategoryRepository } from "@/domain/repositories/category.repository";
import { prisma } from "@/infrastructure/database/prisma";

function mapCategory(raw: {
  id: string;
  name: string;
  type: string;
  order: number;
  scoringFormula: string;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return { ...raw, type: raw.type as CategoryType };
}

export class PrismaCategoryRepository implements CategoryRepository {
  async findById(id: string): Promise<Category | null> {
    const raw = await prisma.category.findUnique({ where: { id } });
    return raw ? mapCategory(raw) : null;
  }

  async findByEventId(eventId: string): Promise<Category[]> {
    const rows = await prisma.category.findMany({
      where: { eventId },
      orderBy: { order: "asc" },
    });
    return rows.map(mapCategory);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const raw = await prisma.category.create({ data: input });
    return mapCategory(raw);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const raw = await prisma.category.update({ where: { id }, data: input });
    return mapCategory(raw);
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }

  async findColumnsByCategoryId(categoryId: string): Promise<ScoreColumn[]> {
    return prisma.scoreColumn.findMany({
      where: { categoryId },
      orderBy: { order: "asc" },
    });
  }

  async createColumn(categoryId: string, name: string, order: number): Promise<ScoreColumn> {
    return prisma.scoreColumn.create({
      data: { categoryId, name, order },
    });
  }

  async updateColumn(columnId: string, name: string): Promise<ScoreColumn> {
    return prisma.scoreColumn.update({
      where: { id: columnId },
      data: { name },
    });
  }

  async reorderColumns(columnId: string, newOrder: number): Promise<ScoreColumn> {
    return prisma.scoreColumn.update({
      where: { id: columnId },
      data: { order: newOrder },
    });
  }

  async deleteColumn(columnId: string): Promise<void> {
    await prisma.scoreColumn.delete({ where: { id: columnId } });
  }
}
