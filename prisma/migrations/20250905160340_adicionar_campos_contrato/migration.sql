/*
  Warnings:

  - Added the required column `atualizadoEm` to the `Contrato` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lojaId" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "valorAluguel" REAL NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "reajusteAnual" BOOLEAN NOT NULL DEFAULT false,
    "percentualReajuste" REAL,
    "clausulas" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Contrato_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contrato_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contrato" ("ativo", "criadoEm", "dataFim", "dataInicio", "id", "inquilinoId", "lojaId", "reajusteAnual", "valorAluguel") SELECT "ativo", "criadoEm", "dataFim", "dataInicio", "id", "inquilinoId", "lojaId", "reajusteAnual", "valorAluguel" FROM "Contrato";
DROP TABLE "Contrato";
ALTER TABLE "new_Contrato" RENAME TO "Contrato";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
