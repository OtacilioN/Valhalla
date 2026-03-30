import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "@/server/trpc/trpc";
import {
  RESCUE_COLUMNS,
  ARTISTIC_COLUMNS,
  RESCUE_SCORING_FORMULA,
  ARTISTIC_SCORING_FORMULA,
} from "@/domain/entities/category";

const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["RESCUE", "ARTISTIC"]),
  eventId: z.string().min(1),
  applyPreset: z.boolean().default(true),
});

const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  scoringFormula: z.string().optional(),
});

const createColumnSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
});

const updateColumnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
});

export const categoryRouter = router({
  listByEvent: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.category.findMany({
      where: { eventId: input },
      orderBy: { order: "asc" },
      include: {
        scoreColumns: { orderBy: { order: "asc" } },
        _count: { select: { teams: true } },
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const category = await ctx.prisma.category.findUnique({
      where: { id: input },
      include: {
        scoreColumns: { orderBy: { order: "asc" } },
      },
    });
    if (!category) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
    }
    return category;
  }),

  create: adminProcedure.input(createCategorySchema).mutation(async ({ ctx, input }) => {
    const isRescue = input.type === "RESCUE";
    const columns = isRescue ? RESCUE_COLUMNS : ARTISTIC_COLUMNS;
    const formula = isRescue ? RESCUE_SCORING_FORMULA : ARTISTIC_SCORING_FORMULA;

    const category = await ctx.prisma.category.create({
      data: {
        name: input.name,
        type: input.type,
        scoringFormula: formula,
        order: 999,
        eventId: input.eventId,
      },
    });

    if (input.applyPreset) {
      await ctx.prisma.scoreColumn.createMany({
        data: columns.map((col, colIndex) => ({
          name: col,
          order: colIndex,
          categoryId: category.id,
        })),
      });
    }

    return category;
  }),

  update: adminProcedure.input(updateCategorySchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return ctx.prisma.category.update({ where: { id }, data });
  }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.prisma.category.delete({ where: { id: input } });
    return { success: true };
  }),

  // Score column management
  addColumn: adminProcedure.input(createColumnSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.scoreColumn.create({ data: input });
  }),

  updateColumn: adminProcedure.input(updateColumnSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return ctx.prisma.scoreColumn.update({ where: { id }, data });
  }),

  deleteColumn: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.prisma.scoreColumn.delete({ where: { id: input } });
    return { success: true };
  }),
});
