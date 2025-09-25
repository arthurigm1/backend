/*
  Warnings:

  - You are about to drop the column `numeroFatura` on the `Fatura` table. All the data in the column will be lost.
  - You are about to drop the column `observacoes` on the `Fatura` table. All the data in the column will be lost.
  - You are about to drop the column `valorReajustado` on the `Fatura` table. All the data in the column will be lost.

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
    "dataVencimento" INTEGER NOT NULL DEFAULT 5,
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
INSERT INTO "new_Contrato" ("ativo", "atualizadoEm", "clausulas", "criadoEm", "dataFim", "dataInicio", "id", "inquilinoId", "lojaId", "observacoes", "percentualReajuste", "reajusteAnual", "status", "valorAluguel") SELECT "ativo", "atualizadoEm", "clausulas", "criadoEm", "dataFim", "dataInicio", "id", "inquilinoId", "lojaId", "observacoes", "percentualReajuste", "reajusteAnual", "status", "valorAluguel" FROM "Contrato";
DROP TABLE "Contrato";
ALTER TABLE "new_Contrato" RENAME TO "Contrato";
CREATE TABLE "new_Fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "valorAluguel" REAL NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "dataGeracao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Fatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Fatura" ("anoReferencia", "atualizadoEm", "contratoId", "criadoEm", "dataGeracao", "dataVencimento", "id", "mesReferencia", "status", "valorAluguel") SELECT "anoReferencia", "atualizadoEm", "contratoId", "criadoEm", "dataGeracao", "dataVencimento", "id", "mesReferencia", "status", "valorAluguel" FROM "Fatura";
DROP TABLE "Fatura";
ALTER TABLE "new_Fatura" RENAME TO "Fatura";
CREATE UNIQUE INDEX "Fatura_contratoId_mesReferencia_anoReferencia_key" ON "Fatura"("contratoId", "mesReferencia", "anoReferencia");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
