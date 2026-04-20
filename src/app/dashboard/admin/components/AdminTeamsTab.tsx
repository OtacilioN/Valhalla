import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";

interface CategoryListItem {
  id: string;
  name: string;
  type: string;
}

interface TeamListItem {
  id: string;
  name: string;
  institution: string;
  city: string;
  state: string;
  attendanceConfirmed: boolean;
  categoryId: string;
}

interface AdminTeamsTabProps {
  eventId: string;
  categories: CategoryListItem[];
}

type AttendanceFilter = "all" | "confirmed" | "pending";

export function AdminTeamsTab({ eventId, categories }: AdminTeamsTabProps) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>("all");
  const [createCategoryError, setCreateCategoryError] = useState("");
  const [createCategoryForm, setCreateCategoryForm] = useState<{
    name: string;
    type: "RESCUE" | "ARTISTIC";
  }>({
    name: "",
    type: "RESCUE",
  });

  const { data: teams } = trpc.team.listByEvent.useQuery(eventId);

  const createCategoryMutation = trpc.category.create.useMutation({
    onSuccess: async () => {
      setCreateCategoryError("");
      setCreateCategoryForm({ name: "", type: "RESCUE" });
      await Promise.all([
        utils.category.listByEvent.invalidate(eventId),
        utils.event.getById.invalidate(eventId),
      ]);
    },
    onError: (err) => {
      setCreateCategoryError(err.message || "Erro ao criar categoria.");
    },
  });

  const deleteCategoryMutation = trpc.category.delete.useMutation({
    onSuccess: async () => {
      setCreateCategoryError("");
      await Promise.all([
        utils.category.listByEvent.invalidate(eventId),
        utils.event.getById.invalidate(eventId),
        utils.team.listByEvent.invalidate(eventId),
      ]);
    },
    onError: (err) => {
      setCreateCategoryError(err.message || "Erro ao apagar categoria.");
    },
  });

  const filteredTeams = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (teams ?? []).filter((team) => {
      const matchesSearch =
        normalizedSearch === "" ||
        team.name.toLowerCase().includes(normalizedSearch) ||
        team.institution.toLowerCase().includes(normalizedSearch) ||
        team.city.toLowerCase().includes(normalizedSearch) ||
        team.state.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" || team.categoryId === categoryFilter;

      const matchesAttendance =
        attendanceFilter === "all" ||
        (attendanceFilter === "confirmed" && team.attendanceConfirmed) ||
        (attendanceFilter === "pending" && !team.attendanceConfirmed);

      return matchesSearch && matchesCategory && matchesAttendance;
    });
  }, [attendanceFilter, categoryFilter, search, teams]);

  const groupedTeams = useMemo(() => {
    const grouped = new Map<string, TeamListItem[]>();

    for (const team of filteredTeams) {
      const current = grouped.get(team.categoryId) ?? [];
      current.push(team);
      grouped.set(team.categoryId, current);
    }

    return grouped;
  }, [filteredTeams]);

  const visibleCategories = useMemo(() => {
    return categories.filter((category) => {
      if (categoryFilter !== "all" && category.id !== categoryFilter) {
        return false;
      }

      if (!search.trim() && attendanceFilter === "all") {
        return true;
      }

      return groupedTeams.has(category.id);
    });
  }, [attendanceFilter, categories, categoryFilter, groupedTeams, search]);

  const confirmedCount = filteredTeams.filter((team) => team.attendanceConfirmed).length;

  function handleCreateCategoryChange(
    field: keyof typeof createCategoryForm,
    value: string | "RESCUE" | "ARTISTIC",
  ) {
    setCreateCategoryForm((prev) => ({ ...prev, [field]: value }));
    setCreateCategoryError("");
  }

  function handleCreateCategorySubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = createCategoryForm.name.trim();
    if (!name) {
      setCreateCategoryError("Nome da categoria é obrigatório.");
      return;
    }

    createCategoryMutation.mutate({
      name,
      type: createCategoryForm.type,
      eventId,
      applyPreset: true,
    });
  }

  function handleDeleteCategory(categoryId: string, categoryName: string) {
    const shouldDelete = window.confirm(
      `Deseja apagar a categoria "${categoryName}"? Esta ação remove também equipes e notas vinculadas.`,
    );

    if (!shouldDelete) {
      return;
    }

    deleteCategoryMutation.mutate(categoryId);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operação de Equipes</CardTitle>
          <CardDescription>
            Busque equipes rapidamente e filtre por categoria ou situação de presença.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="teamSearch" className="text-sm font-medium">
                Buscar
              </label>
              <input
                id="teamSearch"
                className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Equipe, instituição, cidade ou UF"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="teamCategoryFilter" className="text-sm font-medium">
                Categoria
              </label>
              <select
                id="teamCategoryFilter"
                className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="teamAttendanceFilter" className="text-sm font-medium">
                Presença
              </label>
              <select
                id="teamAttendanceFilter"
                className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value as AttendanceFilter)}
              >
                <option value="all">Todas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-sm border bg-white px-2 py-1 shadow-sm">
              Equipes visíveis: {filteredTeams.length}
            </span>
            <span className="rounded-sm border bg-white px-2 py-1 shadow-sm">
              Presenças confirmadas: {confirmedCount}
            </span>
            <span className="rounded-sm border bg-white px-2 py-1 shadow-sm">
              Pendentes: {filteredTeams.length - confirmedCount}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nova Categoria</CardTitle>
          <CardDescription>
            Crie uma categoria e os critérios padrão serão adicionados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCategorySubmit} className="grid gap-3 md:grid-cols-3">
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Nome da categoria"
              value={createCategoryForm.name}
              onChange={(e) => handleCreateCategoryChange("name", e.target.value)}
              required
            />
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={createCategoryForm.type}
              onChange={(e) =>
                handleCreateCategoryChange(
                  "type",
                  (e.target.value as "RESCUE" | "ARTISTIC") ?? "RESCUE",
                )
              }
            >
              <option value="RESCUE">Resgate</option>
              <option value="ARTISTIC">Artística</option>
            </select>
            <Button type="submit" disabled={createCategoryMutation.isPending}>
              {createCategoryMutation.isPending ? "Criando..." : "Criar categoria"}
            </Button>
            {createCategoryError && (
              <p className="text-sm text-destructive md:col-span-3">{createCategoryError}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma categoria cadastrada. Crie uma categoria para cadastrar equipes.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {visibleCategories.length === 0 && categories.length > 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma equipe encontrada com os filtros aplicados.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {visibleCategories.map((category) => (
        <CategoryTeamsSection
          key={category.id}
          eventId={eventId}
          categoryId={category.id}
          categoryName={category.name}
          teams={groupedTeams.get(category.id) ?? []}
          onDeleteCategory={handleDeleteCategory}
          isDeletingCategory={deleteCategoryMutation.isPending}
        />
      ))}
    </div>
  );
}

interface CategoryTeamsSectionProps {
  eventId: string;
  categoryId: string;
  categoryName: string;
  teams: TeamListItem[];
  onDeleteCategory: (categoryId: string, categoryName: string) => void;
  isDeletingCategory: boolean;
}

function CategoryTeamsSection({
  eventId,
  categoryId,
  categoryName,
  teams,
  onDeleteCategory,
  isDeletingCategory,
}: CategoryTeamsSectionProps) {
  const utils = trpc.useUtils();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    institution: "",
    city: "",
    state: "",
  });
  const [teamForm, setTeamForm] = useState({
    name: "",
    institution: "",
    city: "",
    state: "",
  });

  const invalidateTeams = async () => {
    await Promise.all([
      utils.team.listByEvent.invalidate(eventId),
      utils.team.listByCategory.invalidate(categoryId),
    ]);
  };

  const createMutation = trpc.team.create.useMutation({
    onSuccess: async () => {
      setShowCreateTeamForm(false);
      setCreateError("");
      setTeamForm({ name: "", institution: "", city: "", state: "" });
      await invalidateTeams();
    },
    onError: (err) => {
      setCreateError(err.message || "Erro ao cadastrar equipe.");
    },
  });

  const updateMutation = trpc.team.update.useMutation({
    onSuccess: async () => {
      setEditError("");
      setEditingTeamId(null);
      setEditForm({ name: "", institution: "", city: "", state: "" });
      await invalidateTeams();
    },
    onError: (err) => {
      setEditError(err.message || "Erro ao atualizar equipe.");
    },
  });

  const confirmMutation = trpc.team.confirmAttendance.useMutation({
    onSuccess: invalidateTeams,
  });

  const revokeMutation = trpc.team.revokeAttendance.useMutation({
    onSuccess: invalidateTeams,
  });

  const deleteTeamMutation = trpc.team.delete.useMutation({
    onSuccess: async () => {
      setEditError("");
      await invalidateTeams();
    },
    onError: (err) => {
      setEditError(err.message || "Erro ao remover equipe.");
    },
  });

  function handleCreateTeamChange(field: keyof typeof teamForm, value: string) {
    setTeamForm((prev) => ({ ...prev, [field]: value }));
    setCreateError("");
  }

  function handleOpenCreateTeamForm() {
    setShowCreateTeamForm(true);
    setShowOptionsMenu(false);
  }

  function handleCreateTeamSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = teamForm.name.trim();
    const institution = teamForm.institution.trim();
    const city = teamForm.city.trim();
    const state = teamForm.state.trim().toUpperCase();

    if (!name || !institution || !city || !state) {
      setCreateError("Preencha todos os campos da equipe.");
      return;
    }

    if (state.length !== 2) {
      setCreateError("UF deve ter 2 letras.");
      return;
    }

    createMutation.mutate({
      name,
      institution,
      city,
      state,
      categoryId,
    });
  }

  function startEditTeam(team: TeamListItem) {
    setEditingTeamId(team.id);
    setEditError("");
    setEditForm({
      name: team.name,
      institution: team.institution,
      city: team.city,
      state: team.state,
    });
  }

  function handleEditTeamChange(field: keyof typeof editForm, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditError("");
  }

  function handleCancelEdit() {
    setEditingTeamId(null);
    setEditError("");
    setEditForm({ name: "", institution: "", city: "", state: "" });
  }

  function handleSaveEdit(teamId: string) {
    const name = editForm.name.trim();
    const institution = editForm.institution.trim();
    const city = editForm.city.trim();
    const state = editForm.state.trim().toUpperCase();

    if (!name || !institution || !city || !state) {
      setEditError("Preencha todos os campos da equipe.");
      return;
    }

    if (state.length !== 2) {
      setEditError("UF deve ter 2 letras.");
      return;
    }

    updateMutation.mutate({
      id: teamId,
      name,
      institution,
      city,
      state,
    });
  }

  function handleDeleteTeam(teamId: string, teamName: string) {
    const shouldDelete = window.confirm(
      `Deseja remover a equipe "${teamName}"? Esta ação também remove notas já vinculadas.`,
    );

    if (!shouldDelete) {
      return;
    }

    deleteTeamMutation.mutate(teamId);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{categoryName}</h3>
          <p className="text-sm text-muted-foreground">
            {teams.filter((team) => team.attendanceConfirmed).length}/{teams.length} equipes com
            presença confirmada
          </p>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Mais opcoes da categoria ${categoryName}`}
            onClick={() => setShowOptionsMenu((prev) => !prev)}
          >
            <span className="text-lg leading-none">⋮</span>
          </Button>

          {showOptionsMenu && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border bg-white p-2 shadow-md">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={handleOpenCreateTeamForm}
              >
                Adicionar equipe
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  setShowOptionsMenu(false);
                  onDeleteCategory(categoryId, categoryName);
                }}
                disabled={isDeletingCategory}
              >
                {isDeletingCategory ? "Apagando..." : "Apagar categoria"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {showCreateTeamForm && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTeamSubmit} className="grid gap-3 md:grid-cols-4">
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Nome da equipe"
                value={teamForm.name}
                onChange={(e) => handleCreateTeamChange("name", e.target.value)}
                required
              />
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Instituição"
                value={teamForm.institution}
                onChange={(e) => handleCreateTeamChange("institution", e.target.value)}
                required
              />
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Cidade"
                value={teamForm.city}
                onChange={(e) => handleCreateTeamChange("city", e.target.value)}
                required
              />
              <div className="flex gap-2">
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="UF"
                  maxLength={2}
                  value={teamForm.state}
                  onChange={(e) => handleCreateTeamChange("state", e.target.value.toUpperCase())}
                  required
                />
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Adicionar"}
                </Button>
              </div>

              {createError && (
                <p className="text-sm text-destructive md:col-span-4">{createError}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[22%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Equipe</TableHead>
                <TableHead>Instituição</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Presença</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhuma equipe encontrada nesta categoria com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      {editingTeamId === team.id ? (
                        <input
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={editForm.name}
                          onChange={(e) => handleEditTeamChange("name", e.target.value)}
                        />
                      ) : (
                        team.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingTeamId === team.id ? (
                        <input
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={editForm.institution}
                          onChange={(e) => handleEditTeamChange("institution", e.target.value)}
                        />
                      ) : (
                        team.institution
                      )}
                    </TableCell>
                    <TableCell>
                      {editingTeamId === team.id ? (
                        <div className="flex gap-2">
                          <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={editForm.city}
                            onChange={(e) => handleEditTeamChange("city", e.target.value)}
                          />
                          <input
                            className="flex h-9 w-16 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            maxLength={2}
                            value={editForm.state}
                            onChange={(e) =>
                              handleEditTeamChange("state", e.target.value.toUpperCase())
                            }
                          />
                        </div>
                      ) : (
                        `${team.city}/${team.state}`
                      )}
                    </TableCell>
                    <TableCell className="w-45">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={team.attendanceConfirmed}
                          onChange={(e) => {
                            if (e.target.checked) {
                              confirmMutation.mutate(team.id);
                              return;
                            }

                            revokeMutation.mutate(team.id);
                          }}
                          disabled={confirmMutation.isPending || revokeMutation.isPending}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="inline-block w-21 text-sm text-muted-foreground">
                          {team.attendanceConfirmed ? "Confirmada" : "Pendente"}
                        </span>
                      </label>
                    </TableCell>
                    <TableCell>
                      {editingTeamId === team.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(team.id)}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={updateMutation.isPending}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEditTeam(team)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                            disabled={deleteTeamMutation.isPending}
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {editError && <p className="px-2 pb-3 text-sm text-destructive">{editError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
