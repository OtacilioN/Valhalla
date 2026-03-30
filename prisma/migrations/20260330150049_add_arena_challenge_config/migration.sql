-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_arenas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "checkpointCount" INTEGER NOT NULL DEFAULT 0,
    "checkpointTiles" TEXT NOT NULL DEFAULT '[]',
    "seesaws" INTEGER NOT NULL DEFAULT 0,
    "intersections" INTEGER NOT NULL DEFAULT 0,
    "obstacles" INTEGER NOT NULL DEFAULT 0,
    "ramps" INTEGER NOT NULL DEFAULT 0,
    "gaps" INTEGER NOT NULL DEFAULT 0,
    "speedBumps" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "arenas_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_arenas" ("createdAt", "eventId", "id", "name", "order", "updatedAt") SELECT "createdAt", "eventId", "id", "name", "order", "updatedAt" FROM "arenas";
DROP TABLE "arenas";
ALTER TABLE "new_arenas" RENAME TO "arenas";
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "adminPassword" TEXT NOT NULL,
    "refereePassword" TEXT NOT NULL,
    "surpriseChallenge" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_events" ("adminPassword", "createdAt", "description", "endDate", "id", "isActive", "location", "name", "refereePassword", "startDate", "updatedAt") SELECT "adminPassword", "createdAt", "description", "endDate", "id", "isActive", "location", "name", "refereePassword", "startDate", "updatedAt" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
