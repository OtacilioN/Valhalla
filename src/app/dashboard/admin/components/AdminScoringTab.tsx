"use client";

import { useState } from "react";
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

interface CategoryListItem {
  id: string;
  name: string;
  type: string;
}

interface AdminScoringTabProps {
  categories: CategoryListItem[];
}

interface EditingCell {
  teamId: string;
  columnIndex: number;
  value: string;
}

export function AdminScoringTab({ categories }: AdminScoringTabProps) {
  const utils = trpc.useUtils();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [saveError, setSaveError] = useState("");

  const { data: rankingData, isLoading: loadingRanking } = trpc.score.getRanking.useQuery(
    selectedCategoryId,
    { enabled: !!selectedCategoryId },
  );

  const submitScoreMutation = trpc.score.submitScore.useMutation({
    onSuccess: async () => {
      setSaveError("");
      setEditingCell(null);
      await utils.score.getRanking.invalidate(selectedCategoryId);
    },
    onError: (err) => {
      setSaveError(err.message || "Erro ao salvar a pontuação.");
    },
  });

  function handleEditScore(teamId: string, columnIndex: number, currentValue: number) {
    setEditingCell({
      teamId,
      columnIndex,
      value: currentValue.toString(),
    });
    setSaveError("");
  }

  function handleSaveScore() {
    if (!editingCell || !selectedCategoryId) return;

    const newValue = parseFloat(editingCell.value);
    if (isNaN(newValue)) {
      setSaveError("Valor inválido");
      return;
    }

    submitScoreMutation.mutate({
      teamId: editingCell.teamId,
      categoryId: selectedCategoryId,
      columnIndex: editingCell.columnIndex,
      value: newValue,
    });
  }

  function handleCancelEdit() {
    setEditingCell(null);
    setSaveError("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSaveScore();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setEditingCell(null);
              }}
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
            Selecione uma categoria acima para editar pontuações.
          </CardContent>
        </Card>
      )}

      {selectedCategoryId && loadingRanking && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Carregando pontuações...
          </CardContent>
        </Card>
      )}

      {rankingData && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{rankingData.category.name}</h2>
            <Badge variant={rankingData.category.type === "RESCUE" ? "default" : "secondary"}>
              {rankingData.category.type === "RESCUE" ? "Resgate" : "Artística"}
            </Badge>
          </div>

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
              {saveError}
            </div>
          )}

          {rankingData.ranking.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma equipe confirmada ou com pontuação nesta categoria.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
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
                        className={`group ${team.rank <= 3 ? "bg-yellow-50/50" : ""}`}
                      >
                        <TableCell className="font-bold">{team.rank}°</TableCell>
                        <TableCell className="font-semibold">{team.teamName}</TableCell>
                        <TableCell className="text-muted-foreground">{team.institution}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {team.city}/{team.state}
                        </TableCell>
                        {team.scores.map((score, colIdx) => (
                          <TableCell key={colIdx} className="text-right">
                            {editingCell?.teamId === team.teamId &&
                            editingCell.columnIndex === colIdx ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  value={editingCell.value}
                                  onChange={(e) =>
                                    setEditingCell((prev) =>
                                      prev ? { ...prev, value: e.target.value } : null,
                                    )
                                  }
                                  onKeyDown={handleKeyDown}
                                  className="w-16 px-2 py-1 border rounded-md text-right text-sm"
                                  autoFocus
                                  step="0.1"
                                />
                                <button
                                  onClick={handleSaveScore}
                                  disabled={submitScoreMutation.isPending}
                                  className="text-green-600 hover:text-green-700 disabled:text-gray-400 p-1"
                                  title="Salvar"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-red-600 hover:text-red-700 p-1"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span>{score}</span>
                                <button
                                  onClick={() => handleEditScore(team.teamId, colIdx, score)}
                                  className="text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                              </div>
                            )}
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
  );
}
