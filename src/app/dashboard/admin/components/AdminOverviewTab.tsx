import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";

interface AdminOverviewTabProps {
  categoriesCount: number;
  refereesCount: number;
  arenasCount: number;
  surpriseChallenge: boolean;
  onToggleSurpriseChallenge: () => void;
  isUpdating: boolean;
}

export function AdminOverviewTab({
  categoriesCount,
  refereesCount,
  arenasCount,
  surpriseChallenge,
  onToggleSurpriseChallenge,
  isUpdating,
}: AdminOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>Categorias cadastradas no evento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">{categoriesCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Árbitros</CardTitle>
            <CardDescription>Árbitros registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">{refereesCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arenas</CardTitle>
            <CardDescription>Arenas disponíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">{arenasCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do Evento</CardTitle>
          <CardDescription>Opções gerais aplicadas a todas as arenas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Desafio Surpresa</p>
              <p className="text-sm text-muted-foreground">
                Ativa o sorteio de um desafio surpresa opcional para as rodadas.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={surpriseChallenge}
              disabled={isUpdating}
              onClick={onToggleSurpriseChallenge}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                surpriseChallenge ? "bg-indigo-600" : "bg-input"
              }`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  surpriseChallenge ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
