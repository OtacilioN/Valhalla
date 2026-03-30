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
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

type Role = "ADMIN" | "REFEREE";

export default function LoginPage() {
  const router = useRouter();
  const [eventId, setEventId] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { data: events, isLoading: loadingEvents } = trpc.event.list.useQuery();

  useEffect(() => {
    if (!loadingEvents && events && events.length === 0) {
      router.replace("/setup");
    }
  }, [loadingEvents, events, router]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.role === "ADMIN") {
        router.push("/dashboard/admin");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-indigo-700">⚔️ Valhalla</h1>
          <p className="text-gray-500 text-sm">Gerenciador de Torneios OBR</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Selecione seu papel e faça login no evento.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event selector */}
              <div className="space-y-1">
                <Label htmlFor="event">Evento</Label>
                {loadingEvents ? (
                  <p className="text-sm text-muted-foreground">Carregando eventos...</p>
                ) : !events || events.length === 0 ? (
                  <p className="text-sm text-amber-600">Nenhum evento cadastrado.</p>
                ) : (
                  <select
                    id="event"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Selecione um evento...</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Role selector */}
              <div className="space-y-1">
                <Label>Papel</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={role === "ADMIN" ? "default" : "outline"}
                    onClick={() => setRole("ADMIN")}
                  >
                    🔧 Admin
                  </Button>
                  <Button
                    type="button"
                    variant={role === "REFEREE" ? "default" : "outline"}
                    onClick={() => setRole("REFEREE")}
                  >
                    🏁 Árbitro
                  </Button>
                </div>
              </div>

              {/* Password */}
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

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Public ranking link */}
        <p className="text-center text-sm text-gray-500">
          Apenas visualizar?{" "}
          <a href="/ranking" className="text-indigo-600 hover:underline">
            Ver ranking público
          </a>
        </p>
      </div>
    </div>
  );
}
