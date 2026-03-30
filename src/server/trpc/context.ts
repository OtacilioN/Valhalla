import type { AppSession } from "@/infrastructure/auth/session";
import { getSession } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export interface Context {
  session: AppSession;
  prisma: typeof prisma;
  req: Request;
}

export async function createContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  const session = await getSession();

  return {
    session,
    prisma,
    req: opts.req,
  };
}
