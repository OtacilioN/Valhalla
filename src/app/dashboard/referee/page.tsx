import { redirect } from "next/navigation";
import { getSession } from "@/infrastructure/auth/session";
import RefereeDashboardClient from "./RefereeDashboardClient";

export default async function RefereeDashboardPage() {
  const session = await getSession();

  if (!session.user || (session.user.role !== "REFEREE" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  return <RefereeDashboardClient eventId={session.user.eventId} />;
}
