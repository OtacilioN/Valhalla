import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/trpc/router";

export function createServerClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/trpc`,
      }),
    ],
  });
}
