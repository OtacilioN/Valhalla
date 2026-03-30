import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.session.user } });
});

export const refereeProcedure = t.procedure.use(({ ctx, next }) => {
  const user = ctx.session.user;
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (user.role !== "REFEREE" && user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user } });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const user = ctx.session.user;
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user } });
});
