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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { formatDate } from "@/lib/utils";

interface AdminDashboardClientProps {
  eventId: string;
}

export default function AdminDashboardClient({ eventId }: AdminDashboardClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "categories">("overview");
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [createEventError, setCreateEventError] = useState("");
  const [createCategoryError, setCreateCategoryError] = useState("");
  const [createCategoryForm, setCreateCategoryForm] = useState<{
    name: string;
    type: "RESCUE" | "ARTISTIC";
  }>({
    name: "",
    type: "RESCUE",
  });
  const [createEventForm, setCreateEventForm] = useState({
    name: "",
    adminPassword: "",
    refereePassword: "",
  });

  const { data: event, isLoading } = trpc.event.getById.useQuery(eventId);
  const { data: categories } = trpc.category.listByEvent.useQuery(eventId);
  const visibleCategories = categories ?? event?.categories ?? [];
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });
  const createEventMutation = trpc.event.create.useMutation({
    onSuccess: () => {
      setShowCreateEventForm(false);
      setCreateEventError("");
      setCreateEventForm({ name: "", adminPassword: "", refereePassword: "" });
      router.push("/login");
    },
    onError: (err) => {
      setCreateEventError(err.message || "Erro ao criar novo evento.");
    },
  });
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
      ]);
    },
    onError: (err) => {
      setCreateCategoryError(err.message || "Erro ao apagar categoria.");
    },
  });

  function handleCreateEventChange(field: keyof typeof createEventForm, value: string) {
    setCreateEventForm((prev) => ({ ...prev, [field]: value }));
    setCreateEventError("");
  }

  function handleCreateEventSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateEventError("");

    if (!createEventForm.name.trim()) {
      setCreateEventError("Nome do evento é obrigatório.");
      return;
    }
    if (createEventForm.adminPassword.length < 4) {
      setCreateEventError("Senha do admin deve ter pelo menos 4 caracteres.");
      return;
    }
    if (createEventForm.refereePassword.length < 4) {
      setCreateEventError("Senha do árbitro deve ter pelo menos 4 caracteres.");
      return;
    }

    createEventMutation.mutate({
      name: createEventForm.name,
      startDate: new Date().toISOString(),
      adminPassword: createEventForm.adminPassword,
      refereePassword: createEventForm.refereePassword,
    });
  }

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
      `Deseja apagar a categoria \"${categoryName}\"? Esta ação remove também equipes e notas vinculadas.`,
    );

    if (!shouldDelete) {
      return;
    }

    deleteCategoryMutation.mutate(categoryId);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-indigo-700">Valhalla</span>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{event.name}</span>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCreateEventForm((prev) => !prev)}
            >
              Criar novo evento
            </Button>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showCreateEventForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Novo Evento</CardTitle>
              <CardDescription>
                Crie um novo evento para disponibilizá-lo na tela de login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEventSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="newEventName" className="text-sm font-medium">
                    Nome do Evento *
                  </label>
                  <input
                    id="newEventName"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Ex: OBR Regional São Paulo 2027"
                    value={createEventForm.name}
                    onChange={(e) => handleCreateEventChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newEventAdminPassword" className="text-sm font-medium">
                    Senha do Admin *
                  </label>
                  <input
                    id="newEventAdminPassword"
                    type="password"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Mínimo 4 caracteres"
                    value={createEventForm.adminPassword}
                    onChange={(e) => handleCreateEventChange("adminPassword", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newEventRefereePassword" className="text-sm font-medium">
                    Senha dos Árbitros *
                  </label>
                  <input
                    id="newEventRefereePassword"
                    type="password"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Mínimo 4 caracteres"
                    value={createEventForm.refereePassword}
                    onChange={(e) => handleCreateEventChange("refereePassword", e.target.value)}
                    required
                  />
                </div>

                {createEventError && (
                  <p className="text-sm text-destructive md:col-span-2">{createEventError}</p>
                )}

                <div className="md:col-span-2 flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateEventForm(false);
                      setCreateEventError("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createEventMutation.isPending}>
                    {createEventMutation.isPending ? "Criando..." : "Criar evento"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Event summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">{event.name}</h2>
          {event.description && <p className="text-muted-foreground mt-1">{event.description}</p>}
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            {event.location && <span>📍 {event.location}</span>}
            <span>📅 {formatDate(event.startDate)}</span>
            {event.isActive && <Badge variant="default">Ativo</Badge>}
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {(["overview", "teams", "categories"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "overview" ? "Visão Geral" : tab === "teams" ? "Equipes" : "Categorias"}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>Categorias cadastradas no evento</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-indigo-600">{visibleCategories.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Árbitros</CardTitle>
                <CardDescription>Árbitros registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-indigo-600">{event.referees.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arenas</CardTitle>
                <CardDescription>Arenas disponíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-indigo-600">{event.arenas.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Categories tab */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Categorias</h3>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant={category.type === "RESCUE" ? "default" : "secondary"}>
                            {category.type === "RESCUE" ? "Resgate" : "Artística"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/ranking?categoryId=${category.id}`}>Ver Ranking</a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Teams tab */}
        {activeTab === "teams" && (
          <div className="space-y-6">
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

            {visibleCategories.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Nenhuma categoria cadastrada. Crie uma categoria para cadastrar equipes.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {visibleCategories.map((category) => (
              <CategoryTeamsSection
                key={category.id}
                categoryId={category.id}
                categoryName={category.name}
                onDeleteCategory={handleDeleteCategory}
                isDeletingCategory={deleteCategoryMutation.isPending}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface CategoryTeamsSectionProps {
  categoryId: string;
  categoryName: string;
  onDeleteCategory: (categoryId: string, categoryName: string) => void;
  isDeletingCategory: boolean;
}

function CategoryTeamsSection({
  categoryId,
  categoryName,
  onDeleteCategory,
  isDeletingCategory,
}: CategoryTeamsSectionProps) {
  const utils = trpc.useUtils();
  const { data: teams } = trpc.team.listByCategory.useQuery(categoryId);
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

  const createMutation = trpc.team.create.useMutation({
    onSuccess: async () => {
      setShowCreateTeamForm(false);
      setCreateError("");
      setTeamForm({ name: "", institution: "", city: "", state: "" });
      await utils.team.listByCategory.invalidate(categoryId);
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
      await utils.team.listByCategory.invalidate(categoryId);
    },
    onError: (err) => {
      setEditError(err.message || "Erro ao atualizar equipe.");
    },
  });

  const confirmMutation = trpc.team.confirmAttendance.useMutation({
    onSuccess: async () => {
      await utils.team.listByCategory.invalidate(categoryId);
    },
  });

  const revokeMutation = trpc.team.revokeAttendance.useMutation({
    onSuccess: async () => {
      await utils.team.listByCategory.invalidate(categoryId);
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

  function startEditTeam(team: {
    id: string;
    name: string;
    institution: string;
    city: string;
    state: string;
  }) {
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

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{categoryName}</h3>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Mais opções da categoria ${categoryName}`}
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
              <col className="w-[26%]" />
              <col className="w-[20%]" />
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
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
              {!teams || teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma equipe cadastrada
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
                        <Button size="sm" variant="outline" onClick={() => startEditTeam(team)}>
                          Editar
                        </Button>
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
