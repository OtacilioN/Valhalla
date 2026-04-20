"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { formatDateRange } from "@/lib/utils";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

type Role = "ADMIN" | "REFEREE" | "SECRETARIAT";

export default function LoginPage() {
  const router = useRouter();
  const [eventId, setEventId] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { data: events, isLoading: loadingEvents } = trpc.event.list.useQuery();

  useEffect(() => {
    if (events?.length && !eventId) {
      const defaultEvent = events.find((event) => event.isActive) ?? events[0];
      setEventId(defaultEvent.id);
    }
  }, [events, eventId]);

  useEffect(() => {
    if (!loadingEvents && events && events.length === 0) {
      router.replace("/setup");
    }
  }, [loadingEvents, events, router]);

  const selectedEvent = events?.find((event) => event.id === eventId);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (data.role === "SECRETARIAT") {
        router.push("/dashboard/secretariat");
      } else {
        router.push("/dashboard/referee");
      }
    },
    onError: (err) => {
      setError(err.message || "Credenciais inválidas");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!eventId) {
      setError("Selecione um evento");
      return;
    }
    loginMutation.mutate({ eventId, role, password });
  }

  return (
    <div className="valhalla-shell flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="rounded-sm bg-primary px-6 py-5 text-center text-primary-foreground shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary-foreground/70">
            Olimpíada Brasileira de Robótica
          </p>
          <h1 className="mt-2 text-4xl font-light tracking-[0.08em]">Valhalla</h1>
          <p className="mt-2 text-sm text-primary-foreground/80">
            Gerenciador oficial de competição e pontuação
          </p>
        </div>

        <Card className="valhalla-panel rounded-sm">
          <CardHeader className="border-b bg-secondary/70">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Selecione seu papel e faça login no evento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="event">Evento</Label>
                {loadingEvents ? (
                  <p className="text-sm text-muted-foreground">Carregando eventos...</p>
                ) : !events || events.length === 0 ? (
                  <p className="text-sm text-amber-600">Nenhum evento cadastrado.</p>
                ) : (
                  <div className="space-y-3">
                    <select
                      id="event"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      className="flex h-9 w-full rounded-sm border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Selecione um evento...</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.isActive ? "[Ativo] " : ""}{ev.name}
                        </option>
                      ))}
                    </select>

                    {selectedEvent && (
                      <div className="rounded-sm border bg-secondary/40 px-3 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{selectedEvent.name}</p>
                          {selectedEvent.isActive && (
                            <span className="rounded-sm bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              Evento ativo
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          {formatDateRange(selectedEvent.startDate, selectedEvent.endDate)}
                          {selectedEvent.location ? ` • ${selectedEvent.location}` : ""}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {selectedEvent.description || "Sem descrição cadastrada."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label>Papel</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={role === "ADMIN" ? "default" : "outline"}
                    onClick={() => setRole("ADMIN")}
                    className="rounded-sm"
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant={role === "REFEREE" ? "default" : "outline"}
                    onClick={() => setRole("REFEREE")}
                    className="rounded-sm"
                  >
                    Árbitro
                  </Button>
                  <Button
                    type="button"
                    variant={role === "SECRETARIAT" ? "default" : "outline"}
                    onClick={() => setRole("SECRETARIAT")}
                    className="rounded-sm"
                  >
                    Secretaria
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Senha do evento"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full rounded-sm" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Apenas visualizar?{" "}
          <a href="/ranking" className="font-medium text-primary hover:underline">
            Ver ranking público
          </a>
        </p>
      </div>
    </div>
  );
}
