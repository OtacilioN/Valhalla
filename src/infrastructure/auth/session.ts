import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { SessionData } from "@/domain/entities/user";

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? "dev-session-secret-change-in-production-min-32-chars",
  cookieName: "valhalla-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export type { SessionData };
export type AppSession = IronSession<SessionData>;

export async function getSession(): Promise<AppSession> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}
