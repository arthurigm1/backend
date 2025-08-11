/*
  Warnings:

  - You are about to drop the column `email` on the `Empresa` table. All the data in the column will be lost.
  - You are about to drop the column `endereco` on the `Empresa` table. All the data in the column will be lost.
  - You are about to drop the column `telefone` on the `Empresa` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Empresa" ("cnpj", "criadoEm", "id", "nome") SELECT "cnpj", "criadoEm", "id", "nome" FROM "Empresa";
DROP TABLE "Empresa";
ALTER TABLE "new_Empresa" RENAME TO "Empresa";
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
