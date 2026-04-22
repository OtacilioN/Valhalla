import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { router, publicProcedure, adminProcedure, secretariatProcedure } from "@/server/trpc/trpc";

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

const olimpoImportSchema = z.object({
  eventId: z.string().min(1),
  categoryId: z.string().min(1),
  token: z.string().min(1).max(200),
});

const OLIMPO_SOURCE = "OLIMPO";
const OLIMPO_API_BASE = process.env.OLIMPO_API_BASE_URL ?? "https://olimpo.robocup.org.br/api/events/steps";

type OlimpoPreviewAction = {
  action: "create" | "update";
  localTeamId: string | null;
  externalId: string;
  externalName: string;
  categoryId: string;
  current: {
    name: string;
    institution: string;
    city: string;
    state: string;
    externalEventToken: string | null;
    externalStepId: string | null;
    externalStepName: string | null;
  } | null;
  next: {
    name: string;
    institution: string;
    city: string;
    state: string;
    externalEventToken: string;
    externalStepId: string | null;
    externalStepName: string | null;
  };
  changedFields: string[];
};

type OlimpoNormalizedTeam = {
  externalId: string;
  name: string;
  institution: string;
  city: string;
  state: string;
  token: string;
  stepId: string | null;
  stepName: string | null;
};

async function getCategoryEventId(prisma: PrismaClient, categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { eventId: true },
  });

  if (!category) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
  }

  return category.eventId;
}

async function assertCategoryBelongsToEvent(
  prisma: PrismaClient,
  categoryId: string,
  eventId: string,
) {
  const categoryEventId = await getCategoryEventId(prisma, categoryId);

  if (categoryEventId !== eventId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Category does not belong to your event",
    });
  }
}

async function assertTeamBelongsToEvent(prisma: PrismaClient, teamId: string, eventId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { category: { select: { eventId: true } } },
  });

  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
  }

  if (team.category.eventId !== eventId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Team does not belong to your event",
    });
  }
}

async function assertEventBelongsToAdmin(prisma: PrismaClient, requestedEventId: string, eventId: string) {
  if (requestedEventId !== eventId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot access a different event",
    });
  }

  const event = await prisma.event.findUnique({
    where: { id: requestedEventId },
    select: { id: true },
  });

  if (!event) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
  }
}

function normalizeText(value: unknown, fallback = "Não informado") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeState(value: unknown) {
  if (typeof value !== "string") {
    return "NI";
  }

  const normalized = value.trim().toUpperCase();

  if (!normalized) {
    return "NI";
  }

  if (normalized.length === 2) {
    return normalized;
  }

  return normalized.slice(0, 2);
}

function extractStepPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Resposta inválida do Olimpo.",
    });
  }

  if (Array.isArray(payload)) {
    const first = payload[0];
    if (!first || typeof first !== "object") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nenhuma etapa encontrada para o token informado.",
      });
    }
    return first as Record<string, unknown>;
  }

  return payload as Record<string, unknown>;
}

function normalizeOlimpoParticipants(payload: unknown, token: string): OlimpoNormalizedTeam[] {
  const step = extractStepPayload(payload);
  const rawTeams = Array.isArray(step.teams)
    ? step.teams
    : Array.isArray(step.participants)
      ? step.participants
      : [];

  if (rawTeams.length === 0) {
    return [];
  }

  const stepId =
    typeof step.id === "string" || typeof step.id === "number" ? String(step.id) : null;
  const stepName = typeof step.name === "string" ? step.name.trim() || null : null;

  return rawTeams.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const team = entry as Record<string, unknown>;
    const externalId =
      typeof team.id === "string" || typeof team.id === "number" ? String(team.id) : null;

    if (!externalId) {
      return [];
    }

    const institution =
      normalizeText(team.institution, "") ||
      normalizeText(team.school, "") ||
      normalizeText(team.organization, "") ||
      normalizeText(team.entity, "") ||
      "Não informado";

    return [
      {
        externalId,
        name: normalizeText(team.name, "Equipe sem nome"),
        institution,
        city: normalizeText(team.city),
        state: normalizeState(team.state),
        token,
        stepId,
        stepName,
      },
    ];
  });
}

function getChangedFields(
  localTeam: {
    name: string;
    institution: string;
    city: string;
    state: string;
    externalEventToken: string | null;
    externalStepId: string | null;
    externalStepName: string | null;
  } | null,
  nextTeam: OlimpoNormalizedTeam,
) {
  if (!localTeam) {
    return ["name", "institution", "city", "state", "externalEventToken", "externalStepId", "externalStepName"];
  }

  const changedFields: string[] = [];

  if (localTeam.name !== nextTeam.name) changedFields.push("name");
  if (localTeam.institution !== nextTeam.institution) changedFields.push("institution");
  if (localTeam.city !== nextTeam.city) changedFields.push("city");
  if (localTeam.state !== nextTeam.state) changedFields.push("state");
  if (localTeam.externalEventToken !== nextTeam.token) changedFields.push("externalEventToken");
  if (localTeam.externalStepId !== nextTeam.stepId) changedFields.push("externalStepId");
  if (localTeam.externalStepName !== nextTeam.stepName) changedFields.push("externalStepName");

  return changedFields;
}

function buildOlimpoPreview(
  localTeams: Array<{
    id: string;
    name: string;
    institution: string;
    city: string;
    state: string;
    categoryId: string;
    externalId: string | null;
    externalEventToken: string | null;
    externalStepId: string | null;
    externalStepName: string | null;
  }>,
  importedTeams: OlimpoNormalizedTeam[],
  categoryId: string,
): OlimpoPreviewAction[] {
  const byExternalId = new Map(
    localTeams
      .filter((team) => team.externalId)
      .map((team) => [team.externalId as string, team]),
  );

  const byNameInstitution = new Map(
    localTeams.map((team) => [
      `${team.name.trim().toLowerCase()}::${team.institution.trim().toLowerCase()}`,
      team,
    ]),
  );

  const actions: OlimpoPreviewAction[] = [];

  for (const importedTeam of importedTeams) {
    const fallbackKey = `${importedTeam.name.trim().toLowerCase()}::${importedTeam.institution
      .trim()
      .toLowerCase()}`;
    const localTeam =
      byExternalId.get(importedTeam.externalId) ?? byNameInstitution.get(fallbackKey) ?? null;

    const changedFields = getChangedFields(localTeam, importedTeam);

    if (!localTeam) {
      actions.push({
        action: "create",
        localTeamId: null,
        externalId: importedTeam.externalId,
        externalName: importedTeam.name,
        categoryId,
        current: null,
        next: {
          name: importedTeam.name,
          institution: importedTeam.institution,
          city: importedTeam.city,
          state: importedTeam.state,
          externalEventToken: importedTeam.token,
          externalStepId: importedTeam.stepId,
          externalStepName: importedTeam.stepName,
        },
        changedFields,
      });
      continue;
    }

    if (changedFields.length === 0) {
      continue;
    }

    actions.push({
      action: "update",
      localTeamId: localTeam.id,
      externalId: importedTeam.externalId,
      externalName: importedTeam.name,
      categoryId,
      current: {
        name: localTeam.name,
        institution: localTeam.institution,
        city: localTeam.city,
        state: localTeam.state,
        externalEventToken: localTeam.externalEventToken,
        externalStepId: localTeam.externalStepId,
        externalStepName: localTeam.externalStepName,
      },
      next: {
        name: importedTeam.name,
        institution: importedTeam.institution,
        city: importedTeam.city,
        state: importedTeam.state,
        externalEventToken: importedTeam.token,
        externalStepId: importedTeam.stepId,
        externalStepName: importedTeam.stepName,
      },
      changedFields,
    });
  }

  return actions;
}

async function fetchOlimpoParticipants(token: string) {
  const url = new URL(`${OLIMPO_API_BASE}/participants`);
  url.searchParams.set("token", token);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Falha ao consultar o Olimpo. HTTP ${response.status}.`,
    });
  }

  return response.json();
}

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
    await assertCategoryBelongsToEvent(ctx.prisma, input.categoryId, ctx.user.eventId);

    return ctx.prisma.team.create({ data: input });
  }),

  update: adminProcedure.input(updateTeamSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    await assertTeamBelongsToEvent(ctx.prisma, id, ctx.user.eventId);
    return ctx.prisma.team.update({ where: { id }, data });
  }),

  confirmAttendance: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await assertTeamBelongsToEvent(ctx.prisma, input, ctx.user.eventId);
    return ctx.prisma.team.update({
      where: { id: input },
      data: { attendanceConfirmed: true },
    });
  }),

  revokeAttendance: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await assertTeamBelongsToEvent(ctx.prisma, input, ctx.user.eventId);
    return ctx.prisma.team.update({
      where: { id: input },
      data: { attendanceConfirmed: false },
    });
  }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await assertTeamBelongsToEvent(ctx.prisma, input, ctx.user.eventId);
    await ctx.prisma.team.delete({ where: { id: input } });
    return { success: true };
  }),

  // ── Secretariat procedures ────────────────────────────────────────────────

  /**
   * List all teams for a given event (across all categories).
   * Used by the secretariat check-in screen.
   */
  listByEvent: secretariatProcedure.input(z.string()).query(async ({ ctx, input: eventId }) => {
    const effectiveEventId = ctx.user.eventId;

    if (eventId !== effectiveEventId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot access teams for a different event",
      });
    }

    return ctx.prisma.team.findMany({
      where: { category: { eventId: effectiveEventId } },
      include: { category: { select: { id: true, name: true, type: true } } },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });
  }),

  previewOlimpoImport: adminProcedure
    .input(olimpoImportSchema)
    .mutation(async ({ ctx, input }) => {
      await assertEventBelongsToAdmin(ctx.prisma, input.eventId, ctx.user.eventId);
      await assertCategoryBelongsToEvent(ctx.prisma, input.categoryId, ctx.user.eventId);

      const payload = await fetchOlimpoParticipants(input.token);
      const importedTeams = normalizeOlimpoParticipants(payload, input.token.trim());
      const localTeams = await ctx.prisma.team.findMany({
        where: {
          category: { eventId: input.eventId },
          OR: [{ categoryId: input.categoryId }, { externalEventToken: input.token.trim() }],
        },
        select: {
          id: true,
          name: true,
          institution: true,
          city: true,
          state: true,
          categoryId: true,
          externalId: true,
          externalEventToken: true,
          externalStepId: true,
          externalStepName: true,
        },
      });

      const actions = buildOlimpoPreview(localTeams, importedTeams, input.categoryId);
      const unchangedCount = importedTeams.length - actions.length;
      const createCount = actions.filter((action) => action.action === "create").length;
      const updateCount = actions.filter((action) => action.action === "update").length;
      const step = extractStepPayload(payload);

      return {
        token: input.token.trim(),
        categoryId: input.categoryId,
        sourceStepId:
          typeof step.id === "string" || typeof step.id === "number" ? String(step.id) : null,
        sourceStepName: typeof step.name === "string" ? step.name.trim() || null : null,
        summary: {
          importedCount: importedTeams.length,
          createCount,
          updateCount,
          unchangedCount,
        },
        actions,
      };
    }),

  applyOlimpoImport: adminProcedure
    .input(olimpoImportSchema)
    .mutation(async ({ ctx, input }) => {
      await assertEventBelongsToAdmin(ctx.prisma, input.eventId, ctx.user.eventId);
      await assertCategoryBelongsToEvent(ctx.prisma, input.categoryId, ctx.user.eventId);

      const payload = await fetchOlimpoParticipants(input.token);
      const importedTeams = normalizeOlimpoParticipants(payload, input.token.trim());
      const localTeams = await ctx.prisma.team.findMany({
        where: {
          category: { eventId: input.eventId },
          OR: [{ categoryId: input.categoryId }, { externalEventToken: input.token.trim() }],
        },
        select: {
          id: true,
          name: true,
          institution: true,
          city: true,
          state: true,
          categoryId: true,
          externalId: true,
          externalEventToken: true,
          externalStepId: true,
          externalStepName: true,
        },
      });

      const actions = buildOlimpoPreview(localTeams, importedTeams, input.categoryId);

      await ctx.prisma.$transaction(async (tx) => {
        for (const action of actions) {
          if (action.action === "create") {
            await tx.team.create({
              data: {
                name: action.next.name,
                institution: action.next.institution,
                city: action.next.city,
                state: action.next.state,
                categoryId: input.categoryId,
                externalSource: OLIMPO_SOURCE,
                externalId: action.externalId,
                externalEventToken: action.next.externalEventToken,
                externalStepId: action.next.externalStepId,
                externalStepName: action.next.externalStepName,
              },
            });
            continue;
          }

          if (!action.localTeamId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Ação de atualização sem time local correspondente.",
            });
          }

          await tx.team.update({
            where: { id: action.localTeamId },
            data: {
              name: action.next.name,
              institution: action.next.institution,
              city: action.next.city,
              state: action.next.state,
              categoryId: input.categoryId,
              externalSource: OLIMPO_SOURCE,
              externalId: action.externalId,
              externalEventToken: action.next.externalEventToken,
              externalStepId: action.next.externalStepId,
              externalStepName: action.next.externalStepName,
            },
          });
        }
      });

      return {
        appliedCount: actions.length,
        createCount: actions.filter((action) => action.action === "create").length,
        updateCount: actions.filter((action) => action.action === "update").length,
      };
    }),

  /**
   * Create a team with attendance already confirmed.
   * Available to secretariat and admin roles.
   */
  createForSecretariat: secretariatProcedure
    .input(createTeamSchema)
    .mutation(async ({ ctx, input }) => {
      await assertCategoryBelongsToEvent(ctx.prisma, input.categoryId, ctx.user.eventId);

      return ctx.prisma.team.create({
        data: { ...input, attendanceConfirmed: true },
      });
    }),

  updateForSecretariat: secretariatProcedure
    .input(updateTeamSchema.omit({ attendanceConfirmed: true }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertTeamBelongsToEvent(ctx.prisma, id, ctx.user.eventId);
      return ctx.prisma.team.update({ where: { id }, data });
    }),

  deleteForSecretariat: secretariatProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await assertTeamBelongsToEvent(ctx.prisma, input, ctx.user.eventId);
    await ctx.prisma.team.delete({ where: { id: input } });
    return { success: true };
  }),

  /**
   * Toggle attendance status for a team.
   * Available to secretariat and admin roles.
   */
  toggleAttendance: secretariatProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const team = await ctx.prisma.team.findUnique({
      where: { id: input },
      select: { attendanceConfirmed: true, category: { select: { eventId: true } } },
    });
    if (!team) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
    }
    if (team.category.eventId !== ctx.user.eventId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Team does not belong to your event" });
    }
    return ctx.prisma.team.update({
      where: { id: input },
      data: { attendanceConfirmed: !team.attendanceConfirmed },
    });
  }),
});
