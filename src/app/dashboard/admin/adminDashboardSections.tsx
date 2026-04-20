import type { ReactNode } from "react";
import { AdminOverviewTab } from "./components/AdminOverviewTab";
import { AdminCategoriesTab } from "./components/AdminCategoriesTab";
import { AdminTeamsTab } from "./components/AdminTeamsTab";
import { AdminScoringTab } from "./components/AdminScoringTab";
import { AdminArenasTab } from "./components/AdminArenasTab";

type CategoryListItem = {
  id: string;
  name: string;
  type: string;
};

export type AdminDashboardSectionId =
  | "overview"
  | "teams"
  | "categories"
  | "scoring"
  | "arenas";

type AdminDashboardSectionsContext = {
  eventId: string;
  categories: CategoryListItem[];
  categoriesCount: number;
  refereesCount: number;
  arenasCount: number;
  surpriseChallenge: boolean;
  onToggleSurpriseChallenge: () => void;
  isUpdatingEvent: boolean;
};

export type AdminDashboardSection = {
  id: AdminDashboardSectionId;
  label: string;
  render: (context: AdminDashboardSectionsContext) => ReactNode;
};

export const ADMIN_DASHBOARD_SECTIONS: AdminDashboardSection[] = [
  {
    id: "overview",
    label: "Visão Geral",
    render: (context) => (
      <AdminOverviewTab
        categoriesCount={context.categoriesCount}
        refereesCount={context.refereesCount}
        arenasCount={context.arenasCount}
        surpriseChallenge={context.surpriseChallenge}
        onToggleSurpriseChallenge={context.onToggleSurpriseChallenge}
        isUpdating={context.isUpdatingEvent}
      />
    ),
  },
  {
    id: "teams",
    label: "Equipes",
    render: (context) => (
      <AdminTeamsTab eventId={context.eventId} categories={context.categories} />
    ),
  },
  {
    id: "categories",
    label: "Categorias",
    render: (context) => <AdminCategoriesTab categories={context.categories} />,
  },
  {
    id: "scoring",
    label: "Pontuação",
    render: (context) => <AdminScoringTab categories={context.categories} />,
  },
  {
    id: "arenas",
    label: "Arenas",
    render: (context) => <AdminArenasTab eventId={context.eventId} />,
  },
];
