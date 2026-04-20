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
import { formatDate } from "@/lib/utils";
import {
  ADMIN_DASHBOARD_SECTIONS,
  type AdminDashboardSectionId,
} from "./adminDashboardSections";

interface AdminDashboardClientProps {
  eventId: string;
}

export default function AdminDashboardClient({ eventId }: AdminDashboardClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<AdminDashboardSectionId>("overview");
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [createEventError, setCreateEventError] = useState("");
  const [createEventForm, setCreateEventForm] = useState({
    name: "",
    adminPassword: "",
    refereePassword: "",
    secretariatPassword: "",
  });

  const { data: event, isLoading } = trpc.event.getById.useQuery(eventId);
  const { data: categories } = trpc.category.listByEvent.useQuery(eventId);
  const visibleCategories = categories ?? event?.categories ?? [];
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });
  const updateEventMutation = trpc.event.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.event.getById.invalidate(eventId),
        utils.category.listByEvent.invalidate(eventId),
      ]);
    },
  });
  const createEventMutation = trpc.event.create.useMutation({
    onSuccess: () => {
      setShowCreateEventForm(false);
      setCreateEventError("");
      setCreateEventForm({
        name: "",
        adminPassword: "",
        refereePassword: "",
        secretariatPassword: "",
      });
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
    if (createEventForm.secretariatPassword.length < 4) {
      setCreateEventError("Senha da secretaria deve ter pelo menos 4 caracteres.");
      return;
    }

    createEventMutation.mutate({
      name: createEventForm.name,
      startDate: new Date().toISOString(),
      adminPassword: createEventForm.adminPassword,
      refereePassword: createEventForm.refereePassword,
      secretariatPassword: createEventForm.secretariatPassword,
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

  const activeSection =
    ADMIN_DASHBOARD_SECTIONS.find((section) => section.id === activeTab) ??
    ADMIN_DASHBOARD_SECTIONS[0];

  const sectionsContext = {
    eventId,
    categories: visibleCategories,
    categoriesCount: visibleCategories.length,
    refereesCount: event.referees.length,
    arenasCount: event.arenas.length,
    surpriseChallenge: event.surpriseChallenge,
    onToggleSurpriseChallenge: () =>
      updateEventMutation.mutate({
        id: eventId,
        surpriseChallenge: !event.surpriseChallenge,
      }),
    isUpdatingEvent: updateEventMutation.isPending,
  };

  return (
    <div className="valhalla-shell">
      <header className="valhalla-topbar">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary-foreground/70">
                Painel OBR
              </p>
              <span className="text-2xl font-light tracking-[0.08em]">Valhalla</span>
            </div>
            <Badge variant="secondary" className="rounded-sm bg-white/18 text-white">
              Admin
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-foreground/80">{event.name}</span>
            <Button
              variant="default"
              size="sm"
              className="rounded-sm bg-white text-primary hover:bg-white/90"
              onClick={() => setShowCreateEventForm((prev) => !prev)}
            >
              Criar novo evento
            </Button>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showCreateEventForm && (
          <Card className="valhalla-panel mb-6 rounded-sm">
            <CardHeader className="border-b bg-secondary/70">
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
                    className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                    className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                    className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Mínimo 4 caracteres"
                    value={createEventForm.refereePassword}
                    onChange={(e) => handleCreateEventChange("refereePassword", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newEventSecretariatPassword" className="text-sm font-medium">
                    Senha da Secretaria *
                  </label>
                  <input
                    id="newEventSecretariatPassword"
                    type="password"
                    className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Mínimo 4 caracteres"
                    value={createEventForm.secretariatPassword}
                    onChange={(e) => handleCreateEventChange("secretariatPassword", e.target.value)}
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
          <h2 className="text-2xl font-medium text-foreground">{event.name}</h2>
          {event.description && <p className="text-muted-foreground mt-1">{event.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {event.location && (
              <span className="rounded-sm border bg-white px-2 py-1 text-muted-foreground shadow-sm">
                Local: {event.location}
              </span>
            )}
            <span className="rounded-sm border bg-white px-2 py-1 text-muted-foreground shadow-sm">
              Data: {formatDate(event.startDate)}
            </span>
            {event.isActive && (
              <Badge variant="default" className="rounded-sm">
                Ativo
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-border/80">
          {ADMIN_DASHBOARD_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className="valhalla-tab"
              data-active={activeTab === section.id}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection?.render(sectionsContext)}
      </main>
    </div>
  );
}
