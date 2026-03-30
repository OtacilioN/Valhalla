"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/presentation/components/ui/badge";
import { Card, CardContent } from "@/presentation/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";

export default function RankingClient() {
  const searchParams = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    searchParams.get("categoryId") ?? "",
  );

  const { data: activeEvent } = trpc.event.getActive.useQuery();
  const { data: categories } = trpc.category.listByEvent.useQuery(activeEvent?.id ?? "", {
    enabled: !!activeEvent?.id,
  });
  const { data: rankingData, isLoading: loadingRanking } = trpc.score.getRanking.useQuery(
    selectedCategoryId,
    { enabled: !!selectedCategoryId, refetchInterval: 10000 },
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">⚔️ Valhalla</h1>
            <p className="text-indigo-200 text-sm mt-1">Ranking em Tempo Real</p>
          </div>
          {activeEvent && (
            <div className="text-right">
              <p className="font-semibold">{activeEvent.name}</p>
              {activeEvent.location && (
                <p className="text-indigo-200 text-sm">📍 {activeEvent.location}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!activeEvent ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">Nenhum evento ativo no momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Category tabs */}
            {categories && categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategoryId === cat.id
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-600 hover:bg-indigo-50 border"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {!selectedCategoryId && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione uma categoria acima para ver o ranking.
                </CardContent>
              </Card>
            )}

            {selectedCategoryId && loadingRanking && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Carregando ranking...
                </CardContent>
              </Card>
            )}

            {rankingData && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{rankingData.category.name}</h2>
                  <Badge variant={rankingData.category.type === "RESCUE" ? "default" : "secondary"}>
                    {rankingData.category.type === "RESCUE" ? "Resgate" : "Artístico"}
                  </Badge>
                </div>

                {rankingData.ranking.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhuma equipe confirmada ou com pontuação nesta categoria.
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Pos.</TableHead>
                            <TableHead>Equipe</TableHead>
                            <TableHead>Instituição</TableHead>
                            <TableHead>Cidade/UF</TableHead>
                            {rankingData.columns.map((col, i) => (
                              <TableHead key={i} className="text-right">
                                {col}
                              </TableHead>
                            ))}
                            <TableHead className="text-right font-bold">Pontuação Final</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rankingData.ranking.map((team) => (
                            <TableRow
                              key={team.teamId}
                              className={team.rank <= 3 ? "bg-yellow-50/50" : ""}
                            >
                              <TableCell>
                                <RankMedal rank={team.rank} />
                              </TableCell>
                              <TableCell className="font-semibold">{team.teamName}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {team.institution}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {team.city}/{team.state}
                              </TableCell>
                              {team.scores.map((score, i) => (
                                <TableCell key={i} className="text-right">
                                  {score}
                                </TableCell>
                              ))}
                              <TableCell className="text-right font-bold text-indigo-700">
                                {team.finalScore.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auto-refresh indicator */}
      {selectedCategoryId && (
        <div className="fixed bottom-4 right-4">
          <Badge variant="secondary" className="text-xs">
            🔄 Atualização automática a cada 10s
          </Badge>
        </div>
      )}
    </div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-muted-foreground font-mono">{rank}°</span>;
}
