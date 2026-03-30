import { redirect } from "next/navigation";
import { getSession } from "@/infrastructure/auth/session";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return <AdminDashboardClient eventId={session.user.eventId} />;
}
