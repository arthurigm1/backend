/*
  Warnings:

  - You are about to drop the `Pagamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `faturaId` on the `EFICobranca` table. All the data in the column will be lost.
  - You are about to drop the column `efiChargeId` on the `Fatura` table. All the data in the column will be lost.
  - You are about to drop the column `efiStatus` on the `Fatura` table. All the data in the column will be lost.
  - You are about to drop the column `pixCopiaECola` on the `Fatura` table. All the data in the column will be lost.
  - You are about to drop the column `qrcode` on the `Fatura` table. All the data in the column will be lost.
  - You are about to drop the column `txid` on the `Fatura` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Pagamento";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EFICobranca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chargeId" INTEGER,
    "barcode" TEXT,
    "pixQrcode" TEXT,
    "pixQrcodeImage" TEXT,
    "link" TEXT,
    "billetLink" TEXT,
    "pdfLink" TEXT,
    "expireAt" DATETIME,
    "status" TEXT,
    "total" INTEGER,
    "payment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EFICobranca" ("barcode", "billetLink", "chargeId", "createdAt", "expireAt", "id", "link", "payment", "pdfLink", "pixQrcode", "pixQrcodeImage", "status", "total", "updatedAt") SELECT "barcode", "billetLink", "chargeId", "createdAt", "expireAt", "id", "link", "payment", "pdfLink", "pixQrcode", "pixQrcodeImage", "status", "total", "updatedAt" FROM "EFICobranca";
DROP TABLE "EFICobranca";
ALTER TABLE "new_EFICobranca" RENAME TO "EFICobranca";
CREATE TABLE "new_Fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "valorAluguel" REAL NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "dataGeracao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "efiCobrancaId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Fatura_efiCobrancaId_fkey" FOREIGN KEY ("efiCobrancaId") REFERENCES "EFICobranca" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Fatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Fatura" ("anoReferencia", "atualizadoEm", "contratoId", "criadoEm", "dataGeracao", "dataVencimento", "id", "mesReferencia", "status", "valorAluguel") SELECT "anoReferencia", "atualizadoEm", "contratoId", "criadoEm", "dataGeracao", "dataVencimento", "id", "mesReferencia", "status", "valorAluguel" FROM "Fatura";
DROP TABLE "Fatura";
ALTER TABLE "new_Fatura" RENAME TO "Fatura";
CREATE UNIQUE INDEX "Fatura_efiCobrancaId_key" ON "Fatura"("efiCobrancaId");
CREATE UNIQUE INDEX "Fatura_contratoId_mesReferencia_anoReferencia_key" ON "Fatura"("contratoId", "mesReferencia", "anoReferencia");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
