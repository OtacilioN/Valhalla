/*
  Warnings:

  - Added the required column `secretariatPassword` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "secretariatPassword" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_events" ("adminPassword", "createdAt", "description", "endDate", "id", "isActive", "location", "name", "refereePassword", "startDate", "updatedAt") SELECT "adminPassword", "createdAt", "description", "endDate", "id", "isActive", "location", "name", "refereePassword", "startDate", "updatedAt" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
