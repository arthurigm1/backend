-- CreateTable
CREATE TABLE "Fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "numeroFatura" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "valorAluguel" REAL NOT NULL,
    "valorReajustado" REAL,
    "dataVencimento" DATETIME NOT NULL,
    "dataGeracao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Fatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "faturaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "dataVenc" DATETIME NOT NULL,
    "dataPag" DATETIME,
    "status" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pagamento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pagamento_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pagamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pagamento" ("contratoId", "criadoEm", "dataPag", "dataVenc", "id", "status", "usuarioId", "valor") SELECT "contratoId", "criadoEm", "dataPag", "dataVenc", "id", "status", "usuarioId", "valor" FROM "Pagamento";
DROP TABLE "Pagamento";
ALTER TABLE "new_Pagamento" RENAME TO "Pagamento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_numeroFatura_key" ON "Fatura"("numeroFatura");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_contratoId_mesReferencia_anoReferencia_key" ON "Fatura"("contratoId", "mesReferencia", "anoReferencia");
