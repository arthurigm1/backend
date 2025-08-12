/*
  Warnings:

  - Added the required column `empresaId` to the `Loja` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "metragem" REAL NOT NULL,
    "localizacao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Loja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Loja" ("criadoEm", "id", "localizacao", "metragem", "nome", "numero", "status") SELECT "criadoEm", "id", "localizacao", "metragem", "nome", "numero", "status" FROM "Loja";
DROP TABLE "Loja";
ALTER TABLE "new_Loja" RENAME TO "Loja";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
