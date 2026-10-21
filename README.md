# TramitaY — Gestão de licitações e contratações públicas

O **TramitaY** é uma plataforma web para gestão, acompanhamento e supervisão de
processos de licitação e contratação pública de uma autarquia municipal
brasileira.

O sistema é uma **ferramenta de gestão**. Não substitui análise jurídica, sistemas
oficiais de publicação, portais governamentais ou decisões administrativas
exigidas por lei.

> Status: **em construção** — fases incrementais. Ver `docs/` e `AGENTS.md`.

## Arquitetura

Monorepo com backend e frontend desacoplados:

```text
Frontend (Next.js)  ──HTTP/JSON──>  Backend (Express)  ──>  MySQL
```

Backend em camadas:

```text
Routes → Middlewares → Controllers → Application Services → Domain → Repositories → Models → MySQL
```

## Estrutura

```text
sistema_licitacao/
├── AGENTS.md            # regras permanentes para agentes de IA
├── PRODUCT.md           # verdade de produto, usuários e marca
├── DESIGN.md            # sistema visual, tokens e padrões de interface
├── opencode.json        # permissões/guardrails do OpenCode
├── pnpm-workspace.yaml
├── .env.example         # modelo de variáveis (sem valores reais)
├── docs/                # documentação (arquitetura, domínio, RBAC, workflows...)
├── .opencode/skills/    # skills especializadas
├── .agents/skills/      # skills de design carregadas pelo agente
├── backend/             # API (Node.js + TypeScript + Express + Sequelize + MySQL)
│   ├── src/
│   ├── database/        # migrations e seeders
│   └── tests/
└── frontend/            # interface (Next.js App Router + React + Tailwind)
    └── src/
```

## Requisitos

- Node.js (LTS) — testado com v22;
- pnpm — testado com 10.x;
- MySQL.

## Configuração

Copie `.env.example` para `.env` (na raiz do monorepo ou em `backend/`) e
preencha os valores **localmente**. O `.env` real nunca é versionado.

O backend carrega, nesta ordem: `backend/.env` e, em seguida, o `.env` da raiz.
Valores vazios são tratados como não definidos (aplicam-se os padrões de
desenvolvimento). Em produção, `JWT_SECRET` é obrigatório (mínimo de 32
caracteres).

### Variáveis principais

| Variável | Descrição |
| --- | --- |
| `NODE_ENV` | `development` \| `test` \| `production` |
| `PORT` | Porta HTTP (padrão 3000) |
| `API_PREFIX` | Prefixo da API (padrão `/api`) |
| `CORS_ORIGIN` | Origens permitidas (separadas por vírgula) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexão MySQL |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Autenticação |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` |
| `ADMIN_NOME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Bootstrap opcional do administrador (apenas pelo seeder) |
| `SEED_DEMO_*` | Usuário de exemplo e processos de demonstração (apenas pelo seeder; opcional) |

> **Bootstrap do administrador.** Nenhum papel recebe permissões por padrão
> (negar por padrão). Para criar o administrador inicial, defina `ADMIN_EMAIL` e
> `ADMIN_PASSWORD` (mínimo de 8 caracteres) e rode `pnpm -C backend db:seed:all`.
> O seeder é idempotente e cria o papel `Administrador` com todas as permissões,
> vinculando o usuário informado. Sem essas variáveis, nada é concedido.

> **Dados padrão e de exemplo.** `db:seed:all` cria os cadastros de referência
> (tipos de processo, cargos, papéis, permissões e um conjunto inicial de
> setores) e um **fluxo padrão por tipo de processo** baseado na Lei nº
> 14.133/2021 (ver `docs/workflows.md`), sempre editável. Opcionalmente, um
> usuário de exemplo é criado quando `SEED_DEMO_EMAIL`/`SEED_DEMO_PASSWORD` estão
> definidos. Nenhuma senha fica no código. Os **processos são criados pela
> interface** enquanto o sistema roda — não há seed de processos fictícios.

## Frontend (Next.js)

O frontend fica em `frontend/` e consome a API em `NEXT_PUBLIC_API_URL`
(padrão `http://localhost:3000/api`). A autenticação usa cookies `HttpOnly`
(`sl_token`) e CSRF double-submit (`sl_csrf` + header `x-csrf-token`).

> **Primeiro acesso.** Usuários criados pela tela de usuários recebem senha
> provisória e precisam definir uma nova senha antes de acessar qualquer recurso.
> A exigência é aplicada no frontend e verificada também no backend.

Configure a origem permitida no backend via `CORS_ORIGIN`
(padrão `http://localhost:3001`, que é a porta do frontend).

```bash
pnpm -C frontend dev        # desenvolvimento em http://localhost:3001
pnpm -C frontend build      # build de produção
pnpm -C frontend start      # inicia o build
pnpm -C frontend typecheck  # verificação de tipos
pnpm -C frontend lint       # ESLint
```

## Banco de dados (desenvolvimento)

Há um MySQL de **desenvolvimento** no `docker-compose.dev.yml` (sem senha de
root, apenas para uso local — **não usar em produção**):

```bash
# na raiz do monorepo
docker compose -f docker-compose.dev.yml up -d      # sobe o MySQL local
docker compose -f docker-compose.dev.yml down       # para o MySQL
docker compose -f docker-compose.dev.yml down -v    # para e apaga os dados
```

Migrations e seeders são versionados e aplicados pela CLI do Sequelize:

```bash
pnpm -C backend db:migrate       # aplica as migrations pendentes
pnpm -C backend db:migrate:undo  # reverte a última migration
pnpm -C backend db:seed:all      # aplica os seeders
pnpm -C backend db:seed:undo     # reverte os seeders
```

Não use `sync({ alter/force })`. Toda mudança de schema passa por migration.

## Execução

```bash
# na raiz do monorepo
pnpm install

# backend
pnpm -C backend dev          # desenvolvimento
pnpm -C backend build        # compilação (tsc / TypeScript 7)
pnpm -C backend typecheck    # verificação de tipos
pnpm -C backend lint         # ESLint
pnpm -C backend test         # testes (Vitest)

# frontend
pnpm -C frontend dev         # interface em http://localhost:3001
pnpm -C frontend build       # build de produção
```

Endpoints de saúde:

- `GET /api/health` — liveness;
- `GET /api/health/readiness` — verifica o banco de dados.

## Documentação

- `AGENTS.md` — regras do projeto;
- `docs/architecture.md` — arquitetura e módulos;
- `docs/domain-model.md` — entidades e relacionamentos;
- `docs/rbac-matrix.md` — papéis, permissões e escopos;
- `docs/workflows.md` — estados e transições (base na Lei nº 14.133/2021);
- `docs/security.md`, `docs/testing.md`, `docs/deployment.md`;
- `docs/decisions/` — decisões arquiteturais (ADRs).

## Base legal

Os fluxos são estruturados com base na **Lei nº 14.133/2021** (Nova Lei de
Licitações), em especial o art. 17 (fases do processo licitatório). Os
fluxos-modelo são configuráveis e sujeitos a validação jurídica antes de uso
oficial. Nenhuma obrigação legal é presumida sem fonte verificada.

## Segurança

- Segredos nunca versionados; `.env` no `.gitignore`;
- Guardrails do agente em `opencode.json` (leitura/edição de arquivos sensíveis
  negada);
- Autorização sempre validada no backend; a interface não é autoridade.

## Convenções

Commits pequenos e descritivos (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`,
`chore:`, `security:`). Detalhes em `AGENTS.md`.
