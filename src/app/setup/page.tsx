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
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

export default function SetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    startDate: "",
    adminPassword: "",
    refereePassword: "",
  });

  const needsSetupQuery = trpc.event.needsSetup.useQuery(undefined, {
    onSuccess(needsSetup) {
      if (!needsSetup) {
        router.replace("/login");
      }
    },
  });

  const bootstrapMutation = trpc.event.bootstrap.useMutation({
    onSuccess: () => {
      router.push("/dashboard/admin");
    },
    onError: (err) => {
      setError(err.message || "Erro ao criar evento.");
    },
  });

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Nome do evento é obrigatório.");
    if (!form.startDate) return setError("Data de início é obrigatória.");
    if (form.adminPassword.length < 4)
      return setError("Senha do admin deve ter pelo menos 4 caracteres.");
    if (form.refereePassword.length < 4)
      return setError("Senha do árbitro deve ter pelo menos 4 caracteres.");

    // Convert the local date string to an ISO datetime string
    const startDate = new Date(form.startDate).toISOString();

    bootstrapMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      location: form.location || undefined,
      startDate,
      adminPassword: form.adminPassword,
      refereePassword: form.refereePassword,
    });
  }

  // If loading or already set up, show a minimal state
  if (needsSetupQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">⚔️ Valhalla</h1>
          <p className="text-muted-foreground">Configuração Inicial</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar Primeiro Evento</CardTitle>
            <CardDescription>
              Bem-vindo! Configure o primeiro evento da temporada para começar a usar o sistema. As
              4 categorias padrão (Rescue L1, Rescue L2, Artístico L1, Artístico L2) serão criadas
              automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Evento *</Label>
                <Input
                  id="name"
                  placeholder="Ex: OBR Regional São Paulo 2026"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  placeholder="Ex: São Paulo, SP"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição opcional do evento"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  required
                />
              </div>

              <hr className="my-2" />

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Senha do Admin *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  autoComplete="new-password"
                  value={form.adminPassword}
                  onChange={(e) => handleChange("adminPassword", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refereePassword">Senha dos Árbitros *</Label>
                <Input
                  id="refereePassword"
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  autoComplete="new-password"
                  value={form.refereePassword}
                  onChange={(e) => handleChange("refereePassword", e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={bootstrapMutation.isPending}>
                {bootstrapMutation.isPending ? "Criando evento..." : "Criar Evento e Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
