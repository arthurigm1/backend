-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'GERAL',
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "enviadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Notificacao" ("enviadaEm", "id", "mensagem", "usuarioId") SELECT "enviadaEm", "id", "mensagem", "usuarioId" FROM "Notificacao";
DROP TABLE "Notificacao";
ALTER TABLE "new_Notificacao" RENAME TO "Notificacao";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
