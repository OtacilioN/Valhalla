"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Badge } from "@/presentation/components/ui/badge";

interface SecretariatDashboardClientProps {
  eventId: string;
}

export default function SecretariatDashboardClient({ eventId }: SecretariatDashboardClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormError, setAddFormError] = useState("");
  const [addForm, setAddForm] = useState({
    name: "",
    institution: "",
    city: "",
    state: "",
    categoryId: "",
  });

  const { data: event } = trpc.event.getById.useQuery(eventId);
  const categories = event?.categories ?? [];

  const { data: teams, refetch: refetchTeams } = trpc.team.listByEvent.useQuery(eventId);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

  const toggleAttendanceMutation = trpc.team.toggleAttendance.useMutation({
    onSuccess: () => refetchTeams(),
  });

  const createTeamMutation = trpc.team.createForSecretariat.useMutation({
    onSuccess: () => {
      refetchTeams();
      setAddForm({
        name: "",
        institution: "",
        city: "",
        state: "",
        categoryId: addForm.categoryId,
      });
      setAddFormError("");
    },
    onError: (err) => {
      setAddFormError(err.message || "Erro ao cadastrar equipe.");
    },
  });

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    return teams.filter((team) => {
      const matchesSearch =
        search.trim() === "" ||
        team.name.toLowerCase().includes(search.toLowerCase()) ||
        team.institution.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || team.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [teams, search, categoryFilter]);

  const teamsByCategory = useMemo(() => {
    const grouped: Record<string, typeof filteredTeams> = {};
    for (const team of filteredTeams) {
      const catId = team.categoryId;
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push(team);
    }
    return grouped;
  }, [filteredTeams]);

  function handleAddFormChange(field: keyof typeof addForm, value: string) {
    setAddForm((prev) => ({ ...prev, [field]: value }));
    setAddFormError("");
  }

  function handleAddFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddFormError("");

    if (!addForm.name.trim()) return setAddFormError("Nome da equipe é obrigatório.");
    if (!addForm.institution.trim()) return setAddFormError("Instituição é obrigatória.");
    if (!addForm.city.trim()) return setAddFormError("Cidade é obrigatória.");
    if (addForm.state.length !== 2) return setAddFormError("Estado deve ter 2 letras (ex: SP).");
    if (!addForm.categoryId) return setAddFormError("Selecione uma categoria.");

    createTeamMutation.mutate({
      name: addForm.name.trim(),
      institution: addForm.institution.trim(),
      city: addForm.city.trim(),
      state: addForm.state.toUpperCase(),
      categoryId: addForm.categoryId,
    });
  }

  const totalTeams = teams?.length ?? 0;
  const confirmedTeams = teams?.filter((t) => t.attendanceConfirmed).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-indigo-700">Valhalla</span>
            <Badge variant="secondary">Secretaria</Badge>
          </div>
          <div className="flex items-center gap-3">
            {event && (
              <span className="text-sm text-muted-foreground hidden sm:block">{event.name}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{confirmedTeams}</p>
              <p className="text-sm text-muted-foreground">Equipes presentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-gray-600">{totalTeams}</p>
              <p className="text-sm text-muted-foreground">Total de equipes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div>
              <Label htmlFor="search">Buscar equipe</Label>
              <Input
                id="search"
                placeholder="Nome ou instituição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="categoryFilter">Filtrar por categoria</Label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Add team button */}
        <div className="flex justify-end">
          <Button onClick={() => setShowAddForm((prev) => !prev)} variant="default">
            {showAddForm ? "Cancelar cadastro" : "➕ Cadastrar nova equipe"}
          </Button>
        </div>

        {/* Add team form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="teamName">Nome da Equipe *</Label>
                    <Input
                      id="teamName"
                      placeholder="Nome da equipe"
                      value={addForm.name}
                      onChange={(e) => handleAddFormChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="institution">Instituição de Ensino *</Label>
                    <Input
                      id="institution"
                      placeholder="Nome da escola ou instituição"
                      value={addForm.institution}
                      onChange={(e) => handleAddFormChange("institution", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      placeholder="Cidade"
                      value={addForm.city}
                      onChange={(e) => handleAddFormChange("city", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      placeholder="UF (ex: SP)"
                      maxLength={2}
                      value={addForm.state}
                      onChange={(e) => handleAddFormChange("state", e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="categorySelect">Categoria *</Label>
                    <select
                      id="categorySelect"
                      value={addForm.categoryId}
                      onChange={(e) => handleAddFormChange("categoryId", e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {addFormError && <p className="text-sm text-destructive">{addFormError}</p>}

                <Button type="submit" className="w-full" disabled={createTeamMutation.isPending}>
                  {createTeamMutation.isPending
                    ? "Cadastrando..."
                    : "✅ Cadastrar com presença confirmada"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Teams list grouped by category */}
        {categories
          .filter((cat) => categoryFilter === "all" || cat.id === categoryFilter)
          .map((cat) => {
            const catTeams = teamsByCategory[cat.id] ?? [];
            if (catTeams.length === 0 && search.trim() !== "") return null;
            return (
              <div key={cat.id}>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  {cat.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({catTeams.filter((t) => t.attendanceConfirmed).length}/{catTeams.length}{" "}
                    presentes)
                  </span>
                </h2>
                {catTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhuma equipe nesta categoria.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {catTeams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => toggleAttendanceMutation.mutate(team.id)}
                        disabled={toggleAttendanceMutation.isPending}
                        className={`w-full text-left rounded-lg border p-4 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          team.attendanceConfirmed
                            ? "bg-green-50 border-green-300 hover:bg-green-100"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{team.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {team.institution} — {team.city}/{team.state}
                            </p>
                          </div>
                          <span
                            className="text-2xl flex-shrink-0"
                            aria-label={team.attendanceConfirmed ? "Presente" : "Ausente"}
                          >
                            {team.attendanceConfirmed ? "✅" : "❌"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {filteredTeams.length === 0 && teams && teams.length > 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma equipe encontrada com os filtros aplicados.
          </p>
        )}

        {teams && teams.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma equipe cadastrada. Use o botão acima para adicionar equipes.
          </p>
        )}
      </main>
    </div>
  );
}
