import type {
  Category,
  ScoreColumn,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/domain/entities/category";

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByEventId(eventId: string): Promise<Category[]>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: string, input: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;

  // Score columns
  findColumnsByCategoryId(categoryId: string): Promise<ScoreColumn[]>;
  createColumn(categoryId: string, name: string, order: number): Promise<ScoreColumn>;
  updateColumn(columnId: string, name: string): Promise<ScoreColumn>;
  reorderColumns(columnId: string, newOrder: number): Promise<ScoreColumn>;
  deleteColumn(columnId: string): Promise<void>;
}
