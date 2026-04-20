"use client";

import { useEffect, useMemo, useState } from "react";
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

type RescueProgressTeam = {
  id: string;
  name: string;
  institution: string;
  city: string;
  state: string;
  rounds: Array<{
    roundNumber: number;
    scoreColumnIndex: number;
    timeColumnIndex: number | null;
    scoreValue: number | null;
    timeValue: number | null;
    completed: boolean;
  }>;
};

type RescueRound = {
  roundNumber: number;
  scoreColumnIndex: number;
  scoreColumnName: string;
  timeColumnIndex: number | null;
  timeColumnName: string | null;
};

export default function RefereeDashboardClient({ eventId }: RefereeDashboardClientProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: event, isLoading } = trpc.event.getById.useQuery(eventId);
  const rescueProgressQuery = trpc.score.getRescueProgress.useQuery(selectedCategoryId ?? "", {
    enabled: !!selectedCategoryId,
  });

  const rescueTeams = rescueProgressQuery.data?.teams ?? [];
  const selectedTeamIndex = rescueTeams.findIndex((team) => team.id === selectedTeamId);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

  function handleAdvanceToNextTeam() {
    if (selectedTeamIndex >= 0 && selectedTeamIndex < rescueTeams.length - 1) {
      setSelectedTeamId(rescueTeams[selectedTeamIndex + 1]!.id);
      return;
    }

    setSelectedTeamId(null);
  }

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
    <div className="valhalla-shell">
      <header className="valhalla-topbar">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary-foreground/70">
                Operação de Arena
              </p>
              <span className="text-2xl font-light tracking-[0.08em]">Valhalla</span>
            </div>
            <Badge variant="secondary" className="rounded-sm bg-white/18 text-white">
              Árbitro
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-foreground/80">{event.name}</span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm border-white/30 bg-transparent text-white hover:bg-white/12 hover:text-white"
              onClick={() => logoutMutation.mutate()}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!selectedCategoryId ? (
          <CategorySelector
            categories={event.categories.map((category) => ({
              id: category.id,
              name: category.name,
              type: category.type,
            }))}
            onSelectCategory={(categoryId) => {
              setSelectedCategoryId(categoryId);
              setSelectedTeamId(null);
            }}
          />
        ) : !selectedTeamId ? (
          <RescueTeamSelector
            categoryName={event.categories.find((category) => category.id === selectedCategoryId)?.name ?? ""}
            isLoading={rescueProgressQuery.isLoading}
            teams={rescueTeams}
            onBack={() => {
              setSelectedCategoryId(null);
              setSelectedTeamId(null);
            }}
            onSelectTeam={setSelectedTeamId}
          />
        ) : (
          <RescueScoreFlow
            categoryId={selectedCategoryId}
            categoryName={rescueProgressQuery.data?.category.name ?? ""}
            rounds={rescueProgressQuery.data?.rounds ?? []}
            team={rescueTeams[selectedTeamIndex] ?? null}
            arenas={event.arenas.map((arena) => ({ id: arena.id, name: arena.name }))}
            hasNextTeam={selectedTeamIndex >= 0 && selectedTeamIndex < rescueTeams.length - 1}
            onBack={() => setSelectedTeamId(null)}
            onAdvanceTeam={handleAdvanceToNextTeam}
            onReturnToTeams={() => setSelectedTeamId(null)}
            onRefreshProgress={() => rescueProgressQuery.refetch()}
          />
        )}
      </main>
    </div>
  );
}

function CategorySelector({
  categories,
  onSelectCategory,
}: {
  categories: Array<{ id: string; name: string; type: string }>;
  onSelectCategory: (categoryId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Selecione a Categoria</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="valhalla-panel cursor-pointer rounded-sm transition-colors hover:border-primary"
            onClick={() => onSelectCategory(category.id)}
          >
            <CardHeader className="border-b bg-secondary/65">
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>
                <Badge
                  variant={category.type === "RESCUE" ? "default" : "secondary"}
                  className="rounded-sm"
                >
                  {category.type === "RESCUE" ? "Resgate" : "Artística"}
                </Badge>
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RescueTeamSelector({
  categoryName,
  isLoading,
  teams,
  onBack,
  onSelectTeam,
}: {
  categoryName: string;
  isLoading: boolean;
  teams: RescueProgressTeam[];
  onBack: () => void;
  onSelectTeam: (teamId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Voltar
        </Button>
        <div>
          <h2 className="text-xl font-bold">Selecione a Equipe</h2>
          <p className="text-sm text-muted-foreground">{categoryName}</p>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando equipes...</p>}

      {!isLoading && teams.length === 0 && (
        <Card className="valhalla-panel rounded-sm">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma equipe confirmada nesta categoria.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams.map((team) => (
          <Card
            key={team.id}
            className="valhalla-panel cursor-pointer rounded-sm transition-colors hover:border-primary"
            onClick={() => onSelectTeam(team.id)}
          >
            <CardHeader className="border-b bg-secondary/65 pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <CardDescription>
                    {team.institution} — {team.city}/{team.state}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-sm">
                  {team.rounds.filter((round) => round.completed).length}/{team.rounds.length} rodadas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {team.rounds.map((round) => (
                  <span
                    key={round.roundNumber}
                    className={`rounded-sm border px-2 py-1 text-xs ${
                      round.completed
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-border bg-white text-muted-foreground"
                    }`}
                  >
                    R{round.roundNumber}
                    {round.scoreValue !== null ? ` • ${round.scoreValue}` : ""}
                    {round.timeValue !== null ? ` • ${round.timeValue}s` : ""}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RescueScoreFlow({
  categoryId,
  categoryName,
  rounds,
  team,
  arenas,
  hasNextTeam,
  onBack,
  onAdvanceTeam,
  onReturnToTeams,
  onRefreshProgress,
}: {
  categoryId: string;
  categoryName: string;
  rounds: RescueRound[];
  team: RescueProgressTeam | null;
  arenas: Array<{ id: string; name: string }>;
  hasNextTeam: boolean;
  onBack: () => void;
  onAdvanceTeam: () => void;
  onReturnToTeams: () => void;
  onRefreshProgress: () => void;
}) {
  const utils = trpc.useUtils();
  const [selectedArenaId, setSelectedArenaId] = useState<string>(arenas[0]?.id ?? "");
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(1);
  const [roundScoreValue, setRoundScoreValue] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const submitBatch = trpc.score.submitBatch.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.score.getByTeamAndCategory.invalidate({ teamId: team?.id ?? "", categoryId }),
        utils.score.getRescueProgress.invalidate(categoryId),
      ]);
    },
  });

  const currentRound = rounds.find((round) => round.roundNumber === selectedRoundNumber) ?? rounds[0] ?? null;
  const currentRoundProgress =
    team?.rounds.find((round) => round.roundNumber === selectedRoundNumber) ?? null;

  useEffect(() => {
    if (!currentRound) {
      return;
    }

    setRoundScoreValue(
      currentRoundProgress?.scoreValue !== null && currentRoundProgress?.scoreValue !== undefined
        ? String(currentRoundProgress.scoreValue)
        : "",
    );
    setTimerSeconds(currentRoundProgress?.timeValue ?? 0);
    setSaveMessage("");
  }, [currentRound, currentRoundProgress, team?.id]);

  useEffect(() => {
    if (!timerRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimerSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerRunning]);

  useEffect(() => {
    setTimerRunning(false);
  }, [team?.id, selectedRoundNumber]);

  const completedRounds = useMemo(
    () => team?.rounds.filter((round) => round.completed).length ?? 0,
    [team],
  );

  async function handleSave(action: "stay" | "next") {
    if (!team || !currentRound) {
      return;
    }

    const parsedScore = Number(roundScoreValue);
    if (!Number.isFinite(parsedScore)) {
      setSaveMessage("Informe a pontuação da rodada.");
      return;
    }

    const scores = [
      { columnIndex: currentRound.scoreColumnIndex, value: parsedScore },
      ...(currentRound.timeColumnIndex !== null
        ? [{ columnIndex: currentRound.timeColumnIndex, value: timerSeconds }]
        : []),
    ];

    await submitBatch.mutateAsync({
      teamId: team.id,
      categoryId,
      arenaId: selectedArenaId || undefined,
      scores,
    });

    setTimerRunning(false);
    setSaveMessage(
      `Rodada ${currentRound.roundNumber} salva com sucesso${
        currentRound.timeColumnIndex !== null ? ` (${timerSeconds}s)` : ""
      }.`,
    );

    await onRefreshProgress();

    if (action === "next") {
      onAdvanceTeam();
    }
  }

  if (!team || !currentRound) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="valhalla-panel rounded-sm h-fit">
        <CardHeader className="border-b bg-secondary/65">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">{team.name}</CardTitle>
              <CardDescription>
                {team.institution} — {team.city}/{team.state}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-sm">
              {completedRounds}/{rounds.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              ← Equipes
            </Button>
            <Button variant="outline" size="sm" onClick={onReturnToTeams}>
              Trocar equipe
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Rodadas</p>
            <div className="flex flex-wrap gap-2">
              {rounds.map((round) => {
                const roundProgress = team.rounds.find((item) => item.roundNumber === round.roundNumber);
                const isActive = selectedRoundNumber === round.roundNumber;
                return (
                  <button
                    key={round.roundNumber}
                    type="button"
                    onClick={() => setSelectedRoundNumber(round.roundNumber)}
                    className={`rounded-sm border px-3 py-2 text-sm ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : roundProgress?.completed
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-border bg-white text-foreground"
                    }`}
                  >
                    R{round.roundNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{categoryName}</p>
            <p>
              Rodada atual: {currentRound.scoreColumnName}
              {currentRound.timeColumnName ? ` + ${currentRound.timeColumnName}` : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="valhalla-panel rounded-sm">
        <CardHeader className="border-b bg-secondary/65">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Pontuação Rescue</CardTitle>
              <CardDescription>
                Conclua a rodada, grave a pontuação e siga para a próxima equipe.
              </CardDescription>
            </div>
            <Badge variant="default" className="rounded-sm">
              Rodada {currentRound.roundNumber}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="arena">Arena</Label>
              <select
                id="arena"
                value={selectedArenaId}
                onChange={(e) => setSelectedArenaId(e.target.value)}
                className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm"
              >
                {arenas.map((arena) => (
                  <option key={arena.id} value={arena.id}>
                    {arena.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roundScore">{currentRound.scoreColumnName}</Label>
              <Input
                id="roundScore"
                type="number"
                step="any"
                placeholder="0"
                value={roundScoreValue}
                onChange={(e) => setRoundScoreValue(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-sm border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Timer do round</p>
                <p className="text-4xl font-semibold tabular-nums">{formatSeconds(timerSeconds)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setTimerRunning(true)} disabled={timerRunning}>
                  Iniciar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTimerRunning(false)}
                  disabled={!timerRunning}
                >
                  Pausar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                >
                  Zerar
                </Button>
              </div>
            </div>

            {currentRound.timeColumnName && (
              <div className="mt-4 grid gap-2 md:grid-cols-[180px_1fr] md:items-center">
                <Label htmlFor="manualTime">{currentRound.timeColumnName}</Label>
                <Input
                  id="manualTime"
                  type="number"
                  min="0"
                  step="1"
                  value={String(timerSeconds)}
                  onChange={(e) => {
                    setTimerRunning(false);
                    setTimerSeconds(Math.max(0, Number(e.target.value) || 0));
                  }}
                />
              </div>
            )}
          </div>

          {currentRoundProgress?.completed && (
            <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Rodada já registrada. Os valores carregados podem ser alterados e gravados novamente.
            </div>
          )}

          {saveMessage && (
            <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {saveMessage}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave("stay")}
              disabled={submitBatch.isPending}
            >
              {submitBatch.isPending ? "Salvando..." : "Salvar rodada"}
            </Button>
            <Button
              type="button"
              onClick={() => handleSave("next")}
              disabled={submitBatch.isPending}
            >
              {submitBatch.isPending
                ? "Salvando..."
                : hasNextTeam
                  ? "Salvar e próxima equipe"
                  : "Salvar e voltar às equipes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
