"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";

interface AdminArenasTabProps {
  eventId: string;
}

type ArenaFormState = {
  name: string;
  checkpointCount: number;
  checkpointTiles: string; // comma-separated numbers
  seesaws: number;
  intersections: number;
  obstacles: number;
  ramps: number;
  gaps: number;
  speedBumps: number;
};

const emptyForm = (): ArenaFormState => ({
  name: "",
  checkpointCount: 0,
  checkpointTiles: "",
  seesaws: 0,
  intersections: 0,
  obstacles: 0,
  ramps: 0,
  gaps: 0,
  speedBumps: 0,
});

function parseCheckpointTiles(value: string): number[] {
  return value
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0);
}

function formatCheckpointTiles(json: string): string {
  try {
    const arr = JSON.parse(json) as number[];
    return Array.isArray(arr) ? arr.join(", ") : "";
  } catch {
    return "";
  }
}

export function AdminArenasTab({ eventId }: AdminArenasTabProps) {
  const utils = trpc.useUtils();
  const { data: arenas, isLoading } = trpc.arena.listByEvent.useQuery(eventId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArenaFormState>(emptyForm());
  const [formError, setFormError] = useState("");

  const createMutation = trpc.arena.create.useMutation({
    onSuccess: () => {
      utils.arena.listByEvent.invalidate(eventId);
      resetForm();
    },
    onError: (err) => setFormError(err.message || "Erro ao criar arena."),
  });

  const updateMutation = trpc.arena.update.useMutation({
    onSuccess: () => {
      utils.arena.listByEvent.invalidate(eventId);
      resetForm();
    },
    onError: (err) => setFormError(err.message || "Erro ao atualizar arena."),
  });

  const deleteMutation = trpc.arena.delete.useMutation({
    onSuccess: () => utils.arena.listByEvent.invalidate(eventId),
  });

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
    setFormError("");
  }

  function handleEdit(arena: NonNullable<typeof arenas>[number]) {
    setEditingId(arena.id);
    setForm({
      name: arena.name,
      checkpointCount: arena.checkpointCount,
      checkpointTiles: formatCheckpointTiles(arena.checkpointTiles),
      seesaws: arena.seesaws,
      intersections: arena.intersections,
      obstacles: arena.obstacles,
      ramps: arena.ramps,
      gaps: arena.gaps,
      speedBumps: arena.speedBumps,
    });
    setShowForm(true);
    setFormError("");
  }

  function handleChange(field: keyof ArenaFormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Nome da arena é obrigatório.");
      return;
    }

    const tiles = parseCheckpointTiles(form.checkpointTiles);
    if (form.checkpointCount > 0 && tiles.length !== form.checkpointCount) {
      setFormError(
        `Informe exatamente ${form.checkpointCount} quantidade(s) de ladrilhos, separadas por vírgula.`,
      );
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: form.name,
        checkpointCount: form.checkpointCount,
        checkpointTiles: tiles,
        seesaws: form.seesaws,
        intersections: form.intersections,
        obstacles: form.obstacles,
        ramps: form.ramps,
        gaps: form.gaps,
        speedBumps: form.speedBumps,
      });
    } else {
      createMutation.mutate({
        eventId,
        name: form.name,
        checkpointCount: form.checkpointCount,
        checkpointTiles: tiles,
        seesaws: form.seesaws,
        intersections: form.intersections,
        obstacles: form.obstacles,
        ramps: form.ramps,
        gaps: form.gaps,
        speedBumps: form.speedBumps,
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Arenas</h3>
          <p className="text-sm text-muted-foreground">
            Configure as arenas e seus desafios para este evento.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Adicionar Arena</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar Arena" : "Nova Arena"}</CardTitle>
            <CardDescription>
              Configure os desafios presentes nesta arena.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identification */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Arena *</label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Ex: Arena 1, Arena A, Arena Azul"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              {/* Checkpoints */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Checkpoints e Percurso</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantidade de Checkpoints</label>
                    <input
                      type="number"
                      min={0}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={form.checkpointCount}
                      onChange={(e) =>
                        handleChange("checkpointCount", parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Ladrilhos por Checkpoint
                    </label>
                    <input
                      type="text"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Ex: 6, 5, 7"
                      value={form.checkpointTiles}
                      onChange={(e) => handleChange("checkpointTiles", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separe os valores por vírgula. Um valor por checkpoint.
                    </p>
                  </div>
                </div>
              </div>

              {/* Challenges */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Desafios do Trajeto</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  {(
                    [
                      { field: "seesaws", label: "Gangorras" },
                      { field: "intersections", label: "Interseções / Becos sem saída" },
                      { field: "obstacles", label: "Obstáculos" },
                      { field: "ramps", label: "Rampas" },
                      { field: "gaps", label: "Gaps" },
                      { field: "speedBumps", label: "Lombadas" },
                    ] as { field: keyof ArenaFormState; label: string }[]
                  ).map(({ field, label }) => (
                    <div key={field} className="space-y-2">
                      <label className="text-sm font-medium">{label}</label>
                      <input
                        type="number"
                        min={0}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={form[field] as number}
                        onChange={(e) =>
                          handleChange(field, parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Arena"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Carregando arenas...</p>}

      {!isLoading && arenas && arenas.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">
          Nenhuma arena cadastrada. Clique em &quot;Adicionar Arena&quot; para começar.
        </p>
      )}

      {arenas && arenas.length > 0 && (
        <div className="space-y-4">
          {arenas.map((arena) => {
            const tiles = (() => {
              try {
                return JSON.parse(arena.checkpointTiles) as number[];
              } catch {
                return [];
              }
            })();

            const challenges = [
              { label: "Gangorras", value: arena.seesaws },
              { label: "Interseções/Becos", value: arena.intersections },
              { label: "Obstáculos", value: arena.obstacles },
              { label: "Rampas", value: arena.ramps },
              { label: "Gaps", value: arena.gaps },
              { label: "Lombadas", value: arena.speedBumps },
            ].filter((c) => c.value > 0);

            return (
              <Card key={arena.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{arena.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(arena)}
                        disabled={showForm && editingId === arena.id}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remover a arena "${arena.name}"?`)) {
                            deleteMutation.mutate(arena.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">
                      Checkpoints: {arena.checkpointCount}
                    </p>
                    {tiles.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Ladrilhos por checkpoint:{" "}
                        {tiles.map((t, i) => `CP${i + 1}: ${t}`).join(" | ")}
                      </p>
                    )}
                  </div>
                  {challenges.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium mb-1">Desafios:</p>
                      <div className="flex flex-wrap gap-2">
                        {challenges.map((c) => (
                          <span
                            key={c.label}
                            className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold"
                          >
                            {c.label}: {c.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum desafio configurado.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
