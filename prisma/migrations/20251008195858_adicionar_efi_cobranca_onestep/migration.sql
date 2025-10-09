-- AlterTable
ALTER TABLE "Fatura" ADD COLUMN "efiChargeId" TEXT;
ALTER TABLE "Fatura" ADD COLUMN "efiStatus" TEXT;
ALTER TABLE "Fatura" ADD COLUMN "pixCopiaECola" TEXT;
ALTER TABLE "Fatura" ADD COLUMN "qrcode" TEXT;
ALTER TABLE "Fatura" ADD COLUMN "txid" TEXT;

-- CreateTable
CREATE TABLE "EFICobranca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "faturaId" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EFICobranca_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EFICobranca_faturaId_key" ON "EFICobranca"("faturaId");
