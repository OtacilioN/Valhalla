import { router } from "@/server/trpc/trpc";
import { authRouter } from "@/server/routers/auth.router";
import { eventRouter } from "@/server/routers/event.router";
import { teamRouter } from "@/server/routers/team.router";
import { categoryRouter } from "@/server/routers/category.router";
import { scoreRouter } from "@/server/routers/score.router";
import { arenaRouter } from "@/server/routers/arena.router";

export const appRouter = router({
  auth: authRouter,
  event: eventRouter,
  team: teamRouter,
  category: categoryRouter,
  score: scoreRouter,
  arena: arenaRouter,
});

export type AppRouter = typeof appRouter;
