// Domain entity types for User/Session

export type UserRole = "ADMIN" | "REFEREE" | "PUBLIC";

export interface SessionUser {
  role: UserRole;
  eventId: string;
}

export interface SessionData {
  user?: SessionUser;
}
