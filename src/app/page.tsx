import { redirect } from "next/navigation";
import { getSession } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";

export default async function HomePage() {
  // Check if any events exist — if not, redirect to first-run setup
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    redirect("/setup");
  }

  const session = await getSession();

  if (!session.user) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (session.user.role === "REFEREE") {
    redirect("/dashboard/referee");
  }

  redirect("/ranking");
}
