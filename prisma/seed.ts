import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_CATEGORIES,
  RESCUE_COLUMNS,
  ARTISTIC_COLUMNS,
  RESCUE_SCORING_FORMULA,
  ARTISTIC_SCORING_FORMULA,
} from "../src/domain/entities/category";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.score.deleteMany();
  await prisma.team.deleteMany();
  await prisma.scoreColumn.deleteMany();
  await prisma.category.deleteMany();
  await prisma.referee.deleteMany();
  await prisma.arena.deleteMany();
  await prisma.event.deleteMany();

  // Create a sample event for development
  const event = await prisma.event.create({
    data: {
      name: "OBR Regional 2026 - Dev",
      description: "Development seed event",
      location: "São Paulo, SP",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-02"),
      isActive: true,
      adminPassword: "admin123",
      refereePassword: "referee123",
    },
  });

  // Create default arenas
  await prisma.arena.createMany({
    data: [
      { name: "Arena A", order: 0, eventId: event.id },
      { name: "Arena B", order: 1, eventId: event.id },
    ],
  });

  // Create default categories
  for (const [index, defaultCategory] of DEFAULT_CATEGORIES.entries()) {
    const isRescue = defaultCategory.type === "RESCUE";
    const columns = isRescue ? RESCUE_COLUMNS : ARTISTIC_COLUMNS;
    const formula = isRescue ? RESCUE_SCORING_FORMULA : ARTISTIC_SCORING_FORMULA;

    const category = await prisma.category.create({
      data: {
        name: defaultCategory.name,
        type: defaultCategory.type,
        order: index,
        scoringFormula: formula,
        eventId: event.id,
      },
    });

    await prisma.scoreColumn.createMany({
      data: columns.map((col, colIndex) => ({
        name: col,
        order: colIndex,
        isReadOnly: false,
        categoryId: category.id,
      })),
    });
  }

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
