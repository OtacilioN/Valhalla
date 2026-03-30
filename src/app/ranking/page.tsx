import { Suspense } from "react";
import RankingClient from "./RankingClient";

export const dynamic = "force-dynamic";

export default function RankingPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}
    >
      <RankingClient />
    </Suspense>
  );
}
