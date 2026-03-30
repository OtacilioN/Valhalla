import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "@/server/trpc/trpc";

const createTeamSchema = z.object({
  name: z.string().min(1).max(200),
  institution: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  categoryId: z.string().min(1),
});

const updateTeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  institution: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().length(2).optional(),
  attendanceConfirmed: z.boolean().optional(),
});

export const teamRouter = router({
  listByCategory: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.team.findMany({
      where: { categoryId: input },
      orderBy: { name: "asc" },
    });
  }),

  listConfirmedByCategory: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.team.findMany({
      where: { categoryId: input, attendanceConfirmed: true },
      orderBy: { name: "asc" },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const team = await ctx.prisma.team.findUnique({ where: { id: input } });
    if (!team) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
    }
    return team;
  }),

  create: adminProcedure.input(createTeamSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.team.create({ data: input });
  }),

  update: adminProcedure.input(updateTeamSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return ctx.prisma.team.update({ where: { id }, data });
  }),

  confirmAttendance: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.team.update({
      where: { id: input },
      data: { attendanceConfirmed: true },
    });
  }),

  revokeAttendance: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.team.update({
      where: { id: input },
      data: { attendanceConfirmed: false },
    });
  }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.prisma.team.delete({ where: { id: input } });
    return { success: true };
  }),
});
