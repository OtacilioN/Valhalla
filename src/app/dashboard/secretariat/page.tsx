import { redirect } from "next/navigation";
import { getSession } from "@/infrastructure/auth/session";
import SecretariatDashboardClient from "./SecretariatDashboardClient";

export default async function SecretariatDashboardPage() {
  const session = await getSession();

  if (!session.user || (session.user.role !== "SECRETARIAT" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  return <SecretariatDashboardClient eventId={session.user.eventId} />;
}
