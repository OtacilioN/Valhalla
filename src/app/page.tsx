import { redirect } from "next/navigation";
import { getSession } from "@/infrastructure/auth/session";

export default async function HomePage() {
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
