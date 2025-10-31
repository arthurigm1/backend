# PIT2 Backend

API backend em Node.js/TypeScript com Express, Prisma (SQLite) e integração com EFI Pagamentos. Este documento explica como instalar, configurar, executar e consumir os principais endpoints.

## Requisitos
- Node.js 18+ (recomendado)
- npm 9+
- SQLite (usado automaticamente via arquivo `prisma/dev.db`)

## Instalação
1. Clone o repositório e entre na pasta `backend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Gere o cliente Prisma:
   ```bash
   npx prisma generate
   ```
4. Aplique as migrações (se necessário) para criar/atualizar o banco:
   ```bash
   npx prisma migrate dev
   ```
   Por padrão, o banco local é `prisma/dev.db` (SQLite).

## Configuração (.env)
Crie um arquivo `.env` na raiz do projeto com as variáveis abaixo:

```env
# Porta do servidor
PORT=3010

# Autenticação JWT
SEGREDO_JWT=troque_por_um_segredo_seguro
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# EFI Pagamentos
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
# Opcional: base URL da API (padrão de produção/homologação)
EFI_BASE_URL=https://cobrancas-h.api.efipay.com.br/v1
```

Observações:
- O projeto falha ao iniciar se `SEGREDO_JWT` não estiver definido.
- O banco usa SQLite e não requer `DATABASE_URL` (já configurado em `prisma/schema.prisma`).

## Execução
- Ambiente de desenvolvimento:
  ```bash
  npm run dev
  ```
  O servidor inicia em `http://localhost:3010/` (ou na porta definida em `PORT`).

- Verificar saúde:
  - `GET http://localhost:3010/health` → deve retornar `{ status: "OK" }`.

- Base de rotas:
  - Todas as rotas da API estão sob o prefixo `http://localhost:3010/api`.

## Autenticação
- Middleware de autenticação: exige `Authorization: Bearer <token>`.
- Gere o token via login:
  ```bash
  curl -X POST http://localhost:3010/api/usuario/login \
    -H "Content-Type: application/json" \
    -d '{"email":"seu.email@exemplo.com","senha":"sua_senha"}'
  ```
  Use o `accessToken` retornado como `Bearer` nos endpoints protegidos.

## Endpoints Principais

### Usuário
- Registro com empresa (público):
  ```
  POST /api/usuario/registro
  ```
- Login (público):
  ```
  POST /api/usuario/login
  ```
- Listar usuários da empresa (protegido):
  ```
  GET /api/usuario/empresa/usuarios
  Authorization: Bearer <token>
  ```
- Ativar usuário (protegido):
  ```
  PATCH /api/usuario/ativar/:id
  Authorization: Bearer <token>
  ```

Exemplo ativação:
```bash
curl -X PATCH http://localhost:3010/api/usuario/ativar/USUARIO_ID \
  -H "Authorization: Bearer <token>"
```

### Fatura
- Gerar faturas mensais (protegido):
  ```
  POST /api/fatura/gerar-mensais
  Body: { mesReferencia: number, anoReferencia: number }
  Authorization: Bearer <token>
  ```
- Listar faturas com filtros (protegido):
  ```
  GET /api/fatura?mesReferencia=11&anoReferencia=2025&page=1&limit=10
  Authorization: Bearer <token>
  ```
  Resposta otimizada: cada fatura retorna apenas campos essenciais (`id`, `referencia`, `valor`, `valorFormatado`, `dataVencimento`, `status`, `statusDescricao`, `estaVencida`, `loja`, `inquilino`).

- Detalhes da fatura (protegido):
  ```
  GET /api/fatura/detalhes/:id
  Authorization: Bearer <token>
  ```
  Resposta otimizada com blocos: `fatura`, `loja`, `inquilino`, `contrato`.

- Buscar fatura por ID (protegido):
  ```
  GET /api/fatura/:id
  Authorization: Bearer <token>
  ```

- Atualizar status da fatura (protegido):
  ```
  PATCH /api/fatura/:id/status
  Body: { status: "PAGA" | "PENDENTE" | "ATRASADA" }
  Authorization: Bearer <token>
  ```

### EFI Pagamentos
- Criar cobrança one-step (boleto + PIX):
  ```
  POST /api/efi/cobranca/one-step
  Body: conforme contrato `IEFIOneStepCharge`
  ```
- Consultar cobrança e atualizar fatura:
  ```
  GET /api/efi/cobranca/consultar/:efiCobrancaId
  ```

Certifique-se de configurar `EFI_CLIENT_ID`, `EFI_CLIENT_SECRET` e, se necessário, `EFI_BASE_URL`.

## Scripts npm
- `npm run dev`: inicia o servidor com `ts-node-dev` (hot reload).

## Desenvolvimento
- Logs de Prisma estão habilitados (`query`, `info`, `warn`, `error`).
- CORS está liberado para facilitar testes locais.
- Middleware de usuário ativo bloqueia ações para usuários `desativados` ou `VISITANTE`.

## Troubleshooting
- Porta em uso (EADDRINUSE):
  - Altere `PORT` no `.env` ou finalize o processo rodando em `3010`.
- Erro: `JWT_SECRET não definido`:
  - Garanta que `SEGREDO_JWT` esteja definido no `.env`.
- Prisma não gerado:
  - Rode `npx prisma generate` após instalar.
- Banco não criado/atualizado:
  - Rode `npx prisma migrate dev` para aplicar migrações.

## Estrutura das Pastas (resumo)
- `src/app.ts`: configuração do Express, middlewares e roteamento base `/api`.
- `src/rotas/*`: definição das rotas por domínio (usuário, fatura, contrato, etc.).
- `src/controller/*`: controllers que tratam a requisição/resposta.
- `src/service/*`: serviços com lógica de negócio.
- `src/models/*`: acesso a dados via Prisma.
- `src/generated/prisma`: cliente Prisma gerado.
- `prisma/schema.prisma`: esquema do banco (SQLite).

---
Se precisar, posso adicionar exemplos de requisição específicos do seu frontend ou ajustar o README para o seu fluxo de deploy.