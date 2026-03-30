import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { router, publicProcedure, adminProcedure } from "@/server/trpc/trpc";
import {
  DEFAULT_CATEGORIES,
  RESCUE_COLUMNS,
  ARTISTIC_COLUMNS,
  RESCUE_SCORING_FORMULA,
  ARTISTIC_SCORING_FORMULA,
} from "@/domain/entities/category";
import { AuthService } from "@/application/services/auth.service";

const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  adminPassword: z.string().min(4),
  refereePassword: z.string().min(4),
});

const bootstrapEventSchema = z.object({
  name: z.string().min(1).max(200),
  adminPassword: z.string().min(4),
  refereePassword: z.string().min(4),
});

const updateEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  surpriseChallenge: z.boolean().optional(),
});

/**
 * Shared helper: create an event plus its default categories/columns.
 * Used by both `create` (admin-protected) and `bootstrap` (public, DB-empty guard).
 */
async function createEventWithDefaults(
  prisma: PrismaClient,
  input: z.infer<typeof createEventSchema> & { startDate: string },
  isActive = false,
) {
  const [adminHash, refereeHash] = await Promise.all([
    AuthService.hashPassword(input.adminPassword),
    AuthService.hashPassword(input.refereePassword),
  ]);

  const event = await prisma.event.create({
    data: {
      name: input.name,
      description: input.description,
      location: input.location,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      adminPassword: adminHash,
      refereePassword: refereeHash,
      isActive,
    },
  });

  for (const [index, defaultCat] of DEFAULT_CATEGORIES.entries()) {
    const isRescue = defaultCat.type === "RESCUE";
    const columns = isRescue ? RESCUE_COLUMNS : ARTISTIC_COLUMNS;
    const formula = isRescue ? RESCUE_SCORING_FORMULA : ARTISTIC_SCORING_FORMULA;

    const category = await prisma.category.create({
      data: {
        name: defaultCat.name,
        type: defaultCat.type,
        order: index,
        scoringFormula: formula,
        eventId: event.id,
      },
    });

    await prisma.scoreColumn.createMany({
      data: columns.map((col, colIndex) => ({
        name: col,
        order: colIndex,
        categoryId: category.id,
      })),
    });
  }

  return event;
}

export const eventRouter = router({
  /**
   * Returns whether the system needs first-time setup (no events in DB).
   * Used to redirect unauthenticated users to /setup on fresh installs.
   */
  needsSetup: publicProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.event.count();
    return count === 0;
  }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.event.findMany({
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        isActive: true,
        createdAt: true,
      },
    });
  }),

  getActive: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.event.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: { id: input },
      include: {
        arenas: { orderBy: { order: "asc" } },
        categories: { orderBy: { order: "asc" } },
        referees: true,
      },
    });
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    return event;
  }),

  /**
   * Bootstrap: create the very first event without authentication.
   * Only allowed when the events table is completely empty.
   * Creates the event as active and logs the admin in automatically.
   */
  bootstrap: publicProcedure.input(bootstrapEventSchema).mutation(async ({ ctx, input }) => {
    const count = await ctx.prisma.event.count();
    if (count > 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Setup already completed. Use the admin dashboard to create additional events.",
      });
    }

    const payload = {
      ...input,
      startDate: new Date().toISOString(),
    };

    // First event is created as active
    const event = await createEventWithDefaults(ctx.prisma, payload, true);

    // Automatically log the caller in as admin
    ctx.session.user = { role: "ADMIN" as const, eventId: event.id };
    await ctx.session.save();

    return { event, role: "ADMIN" as const };
  }),

  create: adminProcedure.input(createEventSchema).mutation(async ({ ctx, input }) => {
    const event = await createEventWithDefaults(ctx.prisma, input, false);
    return event;
  }),

  update: adminProcedure.input(updateEventSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return ctx.prisma.event.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }),

  setActive: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.prisma.event.updateMany({ data: { isActive: false } });
    return ctx.prisma.event.update({
      where: { id: input },
      data: { isActive: true },
    });
  }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.prisma.event.delete({ where: { id: input } });
    return { success: true };
  }),
});
