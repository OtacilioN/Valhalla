"use client";

import { useEffect, useState } from "react";
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
import { formatDateRange } from "@/lib/utils";
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
  const [showEventDetailsPanel, setShowEventDetailsPanel] = useState(false);
  const [showEventsListPanel, setShowEventsListPanel] = useState(false);
  const [eventFormError, setEventFormError] = useState("");
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [createEventError, setCreateEventError] = useState("");
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
  });
  const [createEventForm, setCreateEventForm] = useState({
    name: "",
    adminPassword: "",
    refereePassword: "",
    secretariatPassword: "",
  });

  const { data: event, isLoading } = trpc.event.getById.useQuery(eventId);
  const { data: events } = trpc.event.list.useQuery();
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
        utils.event.list.invalidate(),
        utils.event.getActive.invalidate(),
      ]);
      setEventFormError("");
      setShowEventDetailsPanel(false);
    },
  });
  const setActiveEventMutation = trpc.event.setActive.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.event.getById.invalidate(eventId),
        utils.event.list.invalidate(),
        utils.event.getActive.invalidate(),
      ]);
    },
  });
  const createEventMutation = trpc.event.create.useMutation({
    onSuccess: async () => {
      setShowCreateEventForm(false);
      setCreateEventError("");
      setCreateEventForm({
        name: "",
        adminPassword: "",
        refereePassword: "",
        secretariatPassword: "",
      });
      await utils.event.list.invalidate();
      router.push("/login");
    },
    onError: (err) => {
      setCreateEventError(err.message || "Erro ao criar novo evento.");
    },
  });

  useEffect(() => {
    if (!event) {
      return;
    }

    setEventForm({
      name: event.name,
      description: event.description ?? "",
      location: event.location ?? "",
      startDate: toDateInputValue(event.startDate),
      endDate: event.endDate ? toDateInputValue(event.endDate) : "",
    });
  }, [event]);

  function handleCreateEventChange(field: keyof typeof createEventForm, value: string) {
    setCreateEventForm((prev) => ({ ...prev, [field]: value }));
    setCreateEventError("");
  }

  function handleEventFormChange(field: keyof typeof eventForm, value: string) {
    setEventForm((prev) => ({ ...prev, [field]: value }));
    setEventFormError("");
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

  function handleEventUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEventFormError("");

    if (!eventForm.name.trim()) {
      setEventFormError("Nome do evento é obrigatório.");
      return;
    }

    if (!eventForm.startDate) {
      setEventFormError("Data inicial é obrigatória.");
      return;
    }

    if (eventForm.endDate && eventForm.endDate < eventForm.startDate) {
      setEventFormError("A data final não pode ser anterior à data inicial.");
      return;
    }

    updateEventMutation.mutate({
      id: eventId,
      name: eventForm.name.trim(),
      description: emptyToUndefined(eventForm.description),
      location: emptyToUndefined(eventForm.location),
      startDate: new Date(`${eventForm.startDate}T12:00:00`).toISOString(),
      endDate: eventForm.endDate
        ? new Date(`${eventForm.endDate}T12:00:00`).toISOString()
        : undefined,
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
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-sm border bg-white px-4 py-4 shadow-sm">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-medium text-foreground">{event.name}</h2>
                {event.isActive ? (
                  <Badge variant="default" className="rounded-sm">
                    Evento ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-sm">
                    Evento inativo
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-sm border bg-secondary/40 px-2 py-1 text-muted-foreground">
                  Período: {formatDateRange(event.startDate, event.endDate)}
                </span>
                <span className="rounded-sm border bg-secondary/40 px-2 py-1 text-muted-foreground">
                  Local: {event.location || "Não informado"}
                </span>
              </div>

              <p className="max-w-3xl text-sm text-muted-foreground">
                {event.description || "Nenhuma descrição cadastrada para este evento."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!event.isActive && (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-sm"
                  disabled={setActiveEventMutation.isPending}
                  onClick={() => setActiveEventMutation.mutate(event.id)}
                >
                  {setActiveEventMutation.isPending ? "Ativando..." : "Ativar este evento"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-sm"
                onClick={() => setShowEventDetailsPanel((prev) => !prev)}
              >
                {showEventDetailsPanel ? "Ocultar edição" : "Editar evento"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-sm"
                onClick={() => setShowEventsListPanel((prev) => !prev)}
              >
                {showEventsListPanel ? "Ocultar eventos" : "Ver eventos cadastrados"}
              </Button>
            </div>
          </div>

          {showEventDetailsPanel && (
          <Card className="valhalla-panel rounded-sm">
            <CardHeader className="border-b bg-secondary/70">
              <div>
                <div>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>
                    Dados principais do evento usados nas telas administrativas e públicas.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <form onSubmit={handleEventUpdateSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="eventName" className="text-sm font-medium">
                    Nome do Evento *
                  </label>
                  <input
                    id="eventName"
                    className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={eventForm.name}
                    onChange={(e) => handleEventFormChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="eventLocation" className="text-sm font-medium">
                    Local
                  </label>
                  <input
                    id="eventLocation"
                    className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Ex: Salvador/BA"
                    value={eventForm.location}
                    onChange={(e) => handleEventFormChange("location", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="eventStartDate" className="text-sm font-medium">
                    Data inicial *
                  </label>
                  <input
                    id="eventStartDate"
                    type="date"
                    className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={eventForm.startDate}
                    onChange={(e) => handleEventFormChange("startDate", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="eventEndDate" className="text-sm font-medium">
                    Data final
                  </label>
                  <input
                    id="eventEndDate"
                    type="date"
                    className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={eventForm.endDate}
                    onChange={(e) => handleEventFormChange("endDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="eventDescription" className="text-sm font-medium">
                    Descrição
                  </label>
                  <textarea
                    id="eventDescription"
                    className="flex min-h-24 w-full rounded-sm border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Resumo curto da etapa, sede ou observações públicas."
                    value={eventForm.description}
                    onChange={(e) => handleEventFormChange("description", e.target.value)}
                  />
                </div>

                {eventFormError && (
                  <p className="text-sm text-destructive md:col-span-2">{eventFormError}</p>
                )}

                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-sm"
                    onClick={() => {
                      setEventFormError("");
                      setEventForm({
                        name: event.name,
                        description: event.description ?? "",
                        location: event.location ?? "",
                        startDate: toDateInputValue(event.startDate),
                        endDate: event.endDate ? toDateInputValue(event.endDate) : "",
                      });
                      setShowEventDetailsPanel(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="rounded-sm" disabled={updateEventMutation.isPending}>
                    {updateEventMutation.isPending ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          )}

          {showEventsListPanel && (
          <Card className="valhalla-panel rounded-sm">
            <CardHeader className="border-b bg-secondary/70">
              <CardTitle>Eventos Cadastrados</CardTitle>
              <CardDescription>
                Selecione qual evento deve aparecer como ativo nas telas públicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {events?.map((listedEvent) => (
                <div
                  key={listedEvent.id}
                  className="rounded-sm border bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{listedEvent.name}</p>
                        {listedEvent.id === event.id && (
                          <Badge variant="secondary" className="rounded-sm">
                            Evento do painel
                          </Badge>
                        )}
                        {listedEvent.isActive && (
                          <Badge variant="default" className="rounded-sm">
                            Ativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateRange(listedEvent.startDate, listedEvent.endDate)}
                        {listedEvent.location ? ` • ${listedEvent.location}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {listedEvent.description || "Sem descrição cadastrada."}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={listedEvent.isActive ? "outline" : "default"}
                      size="sm"
                      className="rounded-sm"
                      disabled={listedEvent.isActive || setActiveEventMutation.isPending}
                      onClick={() => setActiveEventMutation.mutate(listedEvent.id)}
                    >
                      {listedEvent.isActive ? "Evento ativo" : "Definir como ativo"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          )}
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

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toDateInputValue(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}
