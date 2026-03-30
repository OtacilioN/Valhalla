import type { UserRole, SessionUser } from "@/domain/entities/user";
import { prisma } from "@/infrastructure/database/prisma";
import { getSession } from "@/infrastructure/auth/session";

export class AuthService {
  /**
   * Authenticate a user against the event passwords.
   * Returns a session user if authentication is successful.
   */
  static async authenticate(
    eventId: string,
    role: UserRole,
    password: string,
  ): Promise<SessionUser | null> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return null;

    const isValid =
      role === "ADMIN"
        ? password === event.adminPassword
        : role === "REFEREE"
          ? password === event.refereePassword
          : true; // PUBLIC requires no password

    if (!isValid) return null;

    return { role, eventId };
  }

  /**
   * Create a session for the authenticated user.
   */
  static async createSession(user: SessionUser): Promise<void> {
    const session = await getSession();
    session.user = user;
    await session.save();
  }

  /**
   * Destroy the current session.
   */
  static async destroySession(): Promise<void> {
    const session = await getSession();
    session.destroy();
  }

  /**
   * Get the current session user.
   */
  static async getSessionUser(): Promise<SessionUser | null> {
    const session = await getSession();
    return session.user ?? null;
  }

  /**
   * Check if the current user has the required role.
   */
  static async requireRole(role: UserRole): Promise<SessionUser> {
    const user = await AuthService.getSessionUser();
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }

    const roleHierarchy: Record<UserRole, number> = {
      PUBLIC: 0,
      REFEREE: 1,
      ADMIN: 2,
    };

    if (roleHierarchy[user.role] < roleHierarchy[role]) {
      throw new Error("FORBIDDEN");
    }

    return user;
  }
}
