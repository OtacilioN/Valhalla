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
import { AdminOverviewTab } from "./components/AdminOverviewTab";
import { AdminCategoriesTab } from "./components/AdminCategoriesTab";
import { AdminTeamsTab } from "./components/AdminTeamsTab";
import { AdminScoringTab } from "./components/AdminScoringTab";
import { AdminArenasTab } from "./components/AdminArenasTab";
import { formatDate } from "@/lib/utils";

interface AdminDashboardClientProps {
  eventId: string;
}

export default function AdminDashboardClient({ eventId }: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "categories" | "scoring" | "arenas">(
    "overview",
  );
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [createEventError, setCreateEventError] = useState("");
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
          {(["overview", "teams", "categories", "scoring", "arenas"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "overview"
                ? "Visão Geral"
                : tab === "teams"
                  ? "Equipes"
                  : tab === "categories"
                    ? "Categorias"
                    : tab === "arenas"
                      ? "Arenas"
                      : "Pontuação"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <AdminOverviewTab
            categoriesCount={visibleCategories.length}
            refereesCount={event.referees.length}
            arenasCount={event.arenas.length}
          />
        )}

        {activeTab === "categories" && <AdminCategoriesTab categories={visibleCategories} />}

        {activeTab === "teams" && (
          <AdminTeamsTab eventId={eventId} categories={visibleCategories} />
        )}

        {activeTab === "scoring" && <AdminScoringTab categories={visibleCategories} />}

        {activeTab === "arenas" && <AdminArenasTab eventId={eventId} />}
      </main>
    </div>
  );
}
