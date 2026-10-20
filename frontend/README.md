# Frontend — Sistema de Gestão de Licitações

Interface administrativa em **Next.js (App Router) + React + TypeScript +
Tailwind CSS**. Consome a API do backend (`backend/`).

## Requisitos

- Node.js LTS (testado com v22);
- pnpm 10.x;
- Backend em execução (padrão `http://localhost:3000`).

## Configuração

A URL da API é lida de `NEXT_PUBLIC_API_URL` e tem como padrão
`http://localhost:3000/api`. Para apontar para outro host, crie
`frontend/.env.local` com:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

O backend deve permitir a origem do frontend em `CORS_ORIGIN`
(padrão `http://localhost:3001`).

## Execução

```bash
pnpm -C frontend dev        # desenvolvimento (http://localhost:3001)
pnpm -C frontend build      # build de produção
pnpm -C frontend start      # servir o build
pnpm -C frontend typecheck  # tsc --noEmit
pnpm -C frontend lint       # ESLint
```

## Autenticação e segurança

- Sessão por cookie `HttpOnly` (`sl_token`), enviado com `credentials: 'include'`.
- **CSRF** double-submit: o cliente lê o cookie `sl_csrf` e envia o valor no
  header `x-csrf-token` em requisições que alteram estado.
- A interface **esconde** itens de menu e ações sem permissão, mas a autorização
  é sempre validada no backend (a UI nunca é autoridade).

## Estrutura

```text
frontend/src/
├── app/
│   ├── layout.tsx              # layout raiz + SessaoProvider
│   ├── login/page.tsx          # autenticação
│   └── (painel)/               # área autenticada (shell com sidebar)
│       ├── painel/             # indicadores
│       ├── processos/          # lista, novo e detalhe (transições)
│       ├── fluxos/             # lista e editor (fases/etapas)
│       ├── cadastros/          # tipos de processo, setores, cargos
│       ├── usuarios/           # contas e papéis
│       ├── roles/              # matriz de permissões
│       └── auditoria/          # consulta de auditoria
├── components/                 # app-shell e componentes de UI
└── lib/                        # cliente de API, sessão, tipos e formatação
```
