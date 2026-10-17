# Sistema de Gestão de Licitações e Contratações Públicas

Sistema web para gestão, acompanhamento e supervisão de processos de licitação e
contratação pública de uma autarquia municipal brasileira.

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
├── opencode.json        # permissões/guardrails do OpenCode
├── pnpm-workspace.yaml
├── .env.example         # modelo de variáveis (sem valores reais)
├── docs/                # documentação (arquitetura, domínio, RBAC, workflows...)
├── .opencode/skills/    # skills especializadas
└── backend/             # API (Node.js + TypeScript + Express + Sequelize + MySQL)
    ├── src/
    ├── database/        # migrations e seeders
    └── tests/
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
```

Endpoints iniciais:

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
