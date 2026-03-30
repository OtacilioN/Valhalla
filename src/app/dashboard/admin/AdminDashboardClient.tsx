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
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "categories">("overview");

  const { data: event, isLoading } = trpc.event.getById.useQuery(eventId);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

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
            <span className="text-2xl font-bold text-indigo-700">⚔️ Valhalla</span>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{event.name}</span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
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
                <p className="text-3xl font-bold text-indigo-600">{event.categories.length}</p>
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
                    {event.categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant={category.type === "RESCUE" ? "default" : "secondary"}>
                            {category.type === "RESCUE" ? "Resgate" : "Artístico"}
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
            {event.categories.map((category) => (
              <CategoryTeamsSection
                key={category.id}
                categoryId={category.id}
                categoryName={category.name}
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
}

function CategoryTeamsSection({ categoryId, categoryName }: CategoryTeamsSectionProps) {
  const { data: teams } = trpc.team.listByCategory.useQuery(categoryId);
  const confirmMutation = trpc.team.confirmAttendance.useMutation();
  const revokeMutation = trpc.team.revokeAttendance.useMutation();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{categoryName}</h3>
      <Card>
        <CardContent className="p-0">
          <Table>
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
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.institution}</TableCell>
                    <TableCell>
                      {team.city}/{team.state}
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.attendanceConfirmed ? "default" : "outline"}>
                        {team.attendanceConfirmed ? "Confirmada" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {team.attendanceConfirmed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeMutation.mutate(team.id)}
                          disabled={revokeMutation.isPending}
                        >
                          Revogar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => confirmMutation.mutate(team.id)}
                          disabled={confirmMutation.isPending}
                        >
                          Confirmar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
