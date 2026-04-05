import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "@/server/trpc/trpc";

const createArenaSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
  checkpointCount: z.number().int().min(0).default(0),
  checkpointTiles: z.array(z.number().int().min(0)).default([]),
  seesaws: z.number().int().min(0).default(0),
  intersections: z.number().int().min(0).default(0),
  obstacles: z.number().int().min(0).default(0),
  ramps: z.number().int().min(0).default(0),
  gaps: z.number().int().min(0).default(0),
  speedBumps: z.number().int().min(0).default(0),
});

const updateArenaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
  checkpointCount: z.number().int().min(0).optional(),
  checkpointTiles: z.array(z.number().int().min(0)).optional(),
  seesaws: z.number().int().min(0).optional(),
  intersections: z.number().int().min(0).optional(),
  obstacles: z.number().int().min(0).optional(),
  ramps: z.number().int().min(0).optional(),
  gaps: z.number().int().min(0).optional(),
  speedBumps: z.number().int().min(0).optional(),
});

export const arenaRouter = router({
  listByEvent: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.arena.findMany({
      where: { eventId: input },
      orderBy: { order: "asc" },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const arena = await ctx.prisma.arena.findUnique({ where: { id: input } });
    if (!arena) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Arena not found" });
    }
    return arena;
  }),

  create: adminProcedure.input(createArenaSchema).mutation(async ({ ctx, input }) => {
    const { checkpointTiles, ...rest } = input;
    const count = await ctx.prisma.arena.count({ where: { eventId: input.eventId } });
    return ctx.prisma.arena.create({
      data: {
        ...rest,
        order: input.order ?? count,
        checkpointTiles: JSON.stringify(checkpointTiles),
      },
    });
  }),

  update: adminProcedure.input(updateArenaSchema).mutation(async ({ ctx, input }) => {
    const { id, checkpointTiles, ...rest } = input;
    const arena = await ctx.prisma.arena.findUnique({ where: { id } });
    if (!arena) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Arena not found" });
    }
    if (arena.eventId !== ctx.user.eventId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to update this arena" });
    }
    return ctx.prisma.arena.update({
      where: { id },
      data: {
        ...rest,
        ...(checkpointTiles !== undefined
          ? { checkpointTiles: JSON.stringify(checkpointTiles) }
          : {}),
      },
    });
  }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const arena = await ctx.prisma.arena.findUnique({ where: { id: input } });
    if (!arena) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Arena not found" });
    }
    if (arena.eventId !== ctx.user.eventId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this arena" });
    }
    await ctx.prisma.arena.delete({ where: { id: input } });
    return { success: true };
  }),
});
