"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

interface RefereeDashboardClientProps {
  eventId: string;
}

export default function RefereeDashboardClient({ eventId }: RefereeDashboardClientProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: event, isLoading } = trpc.event.getById.useQuery(eventId);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Evento não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-indigo-700">⚔️ Valhalla</span>
            <Badge variant="outline">Árbitro</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{event.name}</span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!selectedCategoryId ? (
          /* Step 1: Select category */
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Selecione a Categoria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.categories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>
                      <Badge variant={category.type === "RESCUE" ? "default" : "secondary"}>
                        {category.type === "RESCUE" ? "Resgate" : "Artístico"}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ) : !selectedTeamId ? (
          /* Step 2: Select team */
          <TeamSelector
            categoryId={selectedCategoryId}
            onBack={() => setSelectedCategoryId(null)}
            onSelectTeam={setSelectedTeamId}
          />
        ) : (
          /* Step 3: Submit scores */
          <ScoreSubmitter
            categoryId={selectedCategoryId}
            teamId={selectedTeamId}
            arenas={event.arenas}
            onBack={() => setSelectedTeamId(null)}
            onDone={() => setSelectedTeamId(null)}
          />
        )}
      </main>
    </div>
  );
}

interface TeamSelectorProps {
  categoryId: string;
  onBack: () => void;
  onSelectTeam: (teamId: string) => void;
}

function TeamSelector({ categoryId, onBack, onSelectTeam }: TeamSelectorProps) {
  const { data: teams, isLoading } = trpc.team.listConfirmedByCategory.useQuery(categoryId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Voltar
        </Button>
        <h2 className="text-xl font-bold">Selecione a Equipe</h2>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando equipes...</p>}

      {!isLoading && (!teams || teams.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma equipe confirmada nesta categoria.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams?.map((team) => (
          <Card
            key={team.id}
            className="cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => onSelectTeam(team.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{team.name}</CardTitle>
              <CardDescription>
                {team.institution} — {team.city}/{team.state}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface ScoreSubmitterProps {
  categoryId: string;
  teamId: string;
  arenas: Array<{ id: string; name: string }>;
  onBack: () => void;
  onDone: () => void;
}

function ScoreSubmitter({ categoryId, teamId, arenas, onBack, onDone }: ScoreSubmitterProps) {
  const [selectedArenaId, setSelectedArenaId] = useState<string>(arenas[0]?.id ?? "");
  const [scoreValues, setScoreValues] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);

  const { data: category } = trpc.category.getById.useQuery(categoryId);
  const { data: team } = trpc.team.getById.useQuery(teamId);
  const { data: existingScores } = trpc.score.getByTeamAndCategory.useQuery({
    teamId,
    categoryId,
  });
  const submitBatch = trpc.score.submitBatch.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onDone();
      }, 1500);
    },
  });

  // Pre-fill with existing scores
  const initialValues: Record<number, string> = {};
  existingScores?.forEach((score) => {
    initialValues[score.columnIndex] = String(score.value);
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scores = Object.entries(scoreValues).map(([idx, val]) => ({
      columnIndex: Number(idx),
      value: parseFloat(val) || 0,
    }));

    submitBatch.mutate({
      teamId,
      categoryId,
      arenaId: selectedArenaId || undefined,
      scores,
    });
  }

  if (!category || !team) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Voltar
        </Button>
        <h2 className="text-xl font-bold">Inserir Pontuação</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{team.name}</CardTitle>
          <CardDescription>
            {category.name} — {team.institution}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {arenas.length > 0 && (
              <div className="space-y-1">
                <Label>Arena</Label>
                <select
                  value={selectedArenaId}
                  onChange={(e) => setSelectedArenaId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {arenas.map((arena) => (
                    <option key={arena.id} value={arena.id}>
                      {arena.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {category.scoreColumns.map((col) => (
              <div key={col.id} className="space-y-1">
                <Label htmlFor={`col-${col.id}`}>{col.name}</Label>
                <Input
                  id={`col-${col.id}`}
                  type="number"
                  step="any"
                  placeholder="0"
                  defaultValue={initialValues[col.order] ?? ""}
                  onChange={(e) =>
                    setScoreValues((prev) => ({ ...prev, [col.order]: e.target.value }))
                  }
                />
              </div>
            ))}

            {saved && (
              <p className="text-sm text-green-600 font-medium">✓ Pontuação salva com sucesso!</p>
            )}

            <Button type="submit" className="w-full" disabled={submitBatch.isPending}>
              {submitBatch.isPending ? "Salvando..." : "Salvar Pontuação"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
