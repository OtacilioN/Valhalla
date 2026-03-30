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
}

export function AdminOverviewTab({
  categoriesCount,
  refereesCount,
  arenasCount,
}: AdminOverviewTabProps) {
  return (
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
  );
}
