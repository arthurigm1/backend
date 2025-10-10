-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "tipo" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetPasswordExpires" DATETIME,
    "resetPasswordToken" TEXT,
    CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Loja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Loja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrato" (
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
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Contrato_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contrato_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fatura" (
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
    CONSTRAINT "Fatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fatura_efiCobrancaId_fkey" FOREIGN KEY ("efiCobrancaId") REFERENCES "EFICobranca" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'GERAL',
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "enviadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EFICobranca" (
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

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_efiCobrancaId_key" ON "Fatura"("efiCobrancaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_contratoId_mesReferencia_anoReferencia_key" ON "Fatura"("contratoId", "mesReferencia", "anoReferencia");
