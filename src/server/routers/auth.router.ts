import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "@/server/trpc/trpc";
import { AuthService } from "@/application/services/auth.service";

const loginSchema = z.object({
  eventId: z.string().min(1),
  role: z.enum(["ADMIN", "REFEREE"]),
  password: z.string().min(1),
});

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const user = await AuthService.authenticate(input.eventId, input.role, input.password);

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    await AuthService.createSession(user);
    return { role: user.role, eventId: user.eventId };
  }),

  logout: publicProcedure.mutation(async () => {
    await AuthService.destroySession();
    return { success: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.session.user ?? null;
  }),

  // Admin can reset the referee password
  changeRefereePassword: adminProcedure
    .input(z.object({ newPassword: z.string().min(4) }))
    .mutation(async ({ ctx, input }) => {
      const hash = await AuthService.hashPassword(input.newPassword);
      await ctx.prisma.event.update({
        where: { id: ctx.user.eventId },
        data: { refereePassword: hash },
      });
      return { success: true };
    }),
});
