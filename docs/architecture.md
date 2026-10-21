# Arquitetura — TramitaY

> Documento inicial (Fase 0). Detalhamento completo na Fase 1.

## Visão geral

Sistema web com backend e frontend desacoplados, comunicação via API REST.

```text
Frontend (Next.js)  ──HTTP/JSON──>  Backend (Express)  ──>  MySQL
```

## Backend

Arquitetura em camadas:

```text
Routes → Middlewares → Controllers → Application Services → Domain → Repositories → Models → MySQL
```

- **Routes:** endpoints + middlewares.
- **Middlewares:** autenticação, autorização, validação (Zod), erros.
- **Controllers:** tradução HTTP ↔ caso de uso; sem regra de negócio.
- **Application Services:** orquestração de casos de uso; transações.
- **Domain:** regras, estados e transições (workflow, RBAC policy).
- **Repositories:** persistência e consultas.
- **Models (Sequelize):** mapeamento entidade ↔ tabela.

## Frontend

Organização por funcionalidade: rotas/layouts, páginas, componentes de domínio,
componentes visuais compartilhados, formulários/schemas (RHF + Zod), serviços de
API, hooks, tipos, erros, sessão e permissões de UI.

A UI não é autoridade de autorização: toda decisão é validada no backend.

## Módulos previstos

Autenticação; Usuários/Cargos/Setores; Papéis e Permissões (RBAC); Tipos de
Processo; Fluxos/Fases/Etapas; Processos; Workflow (avançar/devolver/suspender/
retomar); Movimentações; Supervisão; Dashboard/Relatórios; Auditoria.

## Decisões e pendências

Ver `docs/decisions/`. Pendências abertas registradas em
`docs/decisions/0001-adocao-da-stack-e-estrutura.md`.
