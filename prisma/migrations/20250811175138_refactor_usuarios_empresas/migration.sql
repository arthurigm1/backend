/*
  Warnings:

  - You are about to drop the column `cpfCnpj` on the `Usuario` table. All the data in the column will be lost.
  - Added the required column `empresaId` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Made the column `tipo` on table `Usuario` required. This step will fail if there are existing NULL values in that column.

*/

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar empresa padrão para usuários existentes
INSERT INTO "Empresa" ("id", "nome", "cnpj", "criadoEm") 
VALUES ('empresa-padrao-id', 'Empresa Padrão', '00000000000100', datetime('now'));

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "tipo" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Migrar dados existentes com valores padrão
INSERT INTO "new_Usuario" ("id", "nome", "email", "senha", "cpf", "telefone", "tipo", "empresaId", "criadoEm") 
SELECT 
    "id", 
    "nome", 
    "email", 
    "senha", 
    "cpfCnpj" as "cpf", 
    "telefone", 
    COALESCE("tipo", 'ADMIN_EMPRESA') as "tipo", 
    'empresa-padrao-id' as "empresaId", 
    "criadoEm" 
FROM "Usuario";

DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");
