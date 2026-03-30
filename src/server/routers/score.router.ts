import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, refereeProcedure } from "@/server/trpc/trpc";
import { rankTeams } from "@/application/services/scoring.service";

const submitScoreSchema = z.object({
  teamId: z.string().min(1),
  categoryId: z.string().min(1),
  arenaId: z.string().optional(),
  columnIndex: z.number().int().min(0),
  value: z.number(),
});

const submitBatchScoreSchema = z.object({
  teamId: z.string().min(1),
  categoryId: z.string().min(1),
  arenaId: z.string().optional(),
  scores: z.array(
    z.object({
      columnIndex: z.number().int().min(0),
      value: z.number(),
    }),
  ),
});

export const scoreRouter = router({
  getByTeamAndCategory: publicProcedure
    .input(z.object({ teamId: z.string(), categoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.score.findMany({
        where: { teamId: input.teamId, categoryId: input.categoryId },
        orderBy: { columnIndex: "asc" },
      });
    }),

  submitScore: refereeProcedure.input(submitScoreSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.score.upsert({
      where: {
        teamId_categoryId_columnIndex: {
          teamId: input.teamId,
          categoryId: input.categoryId,
          columnIndex: input.columnIndex,
        },
      },
      create: {
        teamId: input.teamId,
        categoryId: input.categoryId,
        columnIndex: input.columnIndex,
        value: input.value,
        arenaId: input.arenaId,
        submittedBy: ctx.user.role,
      },
      update: {
        value: input.value,
        arenaId: input.arenaId,
        submittedBy: ctx.user.role,
      },
    });
  }),

  submitBatch: refereeProcedure.input(submitBatchScoreSchema).mutation(async ({ ctx, input }) => {
    const results = await Promise.all(
      input.scores.map((score) =>
        ctx.prisma.score.upsert({
          where: {
            teamId_categoryId_columnIndex: {
              teamId: input.teamId,
              categoryId: input.categoryId,
              columnIndex: score.columnIndex,
            },
          },
          create: {
            teamId: input.teamId,
            categoryId: input.categoryId,
            columnIndex: score.columnIndex,
            value: score.value,
            arenaId: input.arenaId,
            submittedBy: ctx.user.role,
          },
          update: {
            value: score.value,
            arenaId: input.arenaId,
            submittedBy: ctx.user.role,
          },
        }),
      ),
    );
    return results;
  }),

  getRanking: publicProcedure.input(z.string()).query(async ({ ctx, input: categoryId }) => {
    const category = await ctx.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
    }

    const teams = await ctx.prisma.team.findMany({
      where: { categoryId, attendanceConfirmed: true },
      include: {
        scores: { orderBy: { columnIndex: "asc" } },
      },
    });

    const columns = await ctx.prisma.scoreColumn.findMany({
      where: { categoryId },
      orderBy: { order: "asc" },
    });

    const columnCount = columns.length;

    const teamsWithScores = teams.map((team) => {
      const scoreArray: number[] = Array(columnCount).fill(0) as number[];
      for (const score of team.scores) {
        if (score.columnIndex < columnCount) {
          scoreArray[score.columnIndex] = score.value;
        }
      }
      return {
        teamId: team.id,
        teamName: team.name,
        institution: team.institution,
        city: team.city,
        state: team.state,
        scores: scoreArray,
      };
    });

    return {
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
      },
      columns: columns.map((c) => c.name),
      ranking: rankTeams(teamsWithScores, category.scoringFormula),
    };
  }),
});
