---
name: Arquitetura de Backend
description: Use ao criar ou revisar módulos, casos de uso, controllers, services, repositories, DTOs, validação, transações, tratamento de erros e convenções de API REST do backend.
---

# Skill: Arquitetura de Backend

Arquitetura em camadas:
`Routes → Middlewares → Controllers → Application Services → Domain → Repositories → Models → MySQL`.

Cada camada existe somente com responsabilidade real. Não criar camadas vazias.

## Responsabilidades

- **Routes:** definem endpoints e aplicam middlewares. Sem regra de negócio.
- **Middlewares:** autenticação, autorização, validação transversal, erros.
- **Controllers:** traduzem HTTP ↔ caso de uso; sem regra de negócio.
- **Application Services:** orquestram casos de uso; coordenam domínio + repositórios.
- **Domain:** regras, estados e transições; independente de HTTP/SQL.
- **Repositories:** acesso a dados; sem regra de negócio.
- **Models (Sequelize):** mapeamento entidade ↔ tabela; sem regra de negócio.

## SOLID na prática

- **SRP:** um módulo, um propósito.
- **OCP:** estender via composição/parâmetros, não espalhar `if`s.
- **LSP:** contratos de repositórios/serviços coerentes.
- **ISP:** interfaces focadas no que o consumidor precisa.
- **DIP:** alto nível depende de abstração (ex.: `ProcessoRepository`) quando há
  benefício real — não abstrair por abstrair.

## DTOs e validação

- Entrada validada por Zod na borda (middleware).
- DTOs explícitos separam entrada de persistência e de resposta.
- Nunca vazar model/entidade direto com campos sensíveis (ex.: `senhaHash`).

## Casos de uso

Cada caso de uso: valida contexto → carrega estado → aplica regra de domínio →
persiste (transação quando multi-entidade) → registra movimentação/auditoria →
retorna DTO. Erros de domínio são exceções tipadas.

## Transações e concorrência

- Operações que alteram múltiplas entidades usam transação com rollback integral.
- Avanço de etapa: validar → carregar → identificar etapa atual → validar
  transição → concluir etapa → iniciar próxima → atualizar processo → registrar
  movimentações → commit.
- Usar controle de concorrência (lock/`SELECT ... FOR UPDATE`/versão) para impedir
  avanço duplo inconsistente.

## Exceções customizadas

Base única (ex.: `AppError`) com subclasses: `ValidationError`,
`AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`,
`IntegrityError`, `UnexpectedError`. Cada uma mapeia para status HTTP. Middleware
global traduz para o formato padrão.

## Padrão de API REST

- Base `/api`; recursos no plural; verbos de domínio como sub-recursos de ação
  (ex.: `/api/processos/:id/avancar`).
- Sucesso: `{ "sucesso": true, "dados": ... }`.
- Erro: `{ "sucesso": false, "mensagem": "...", "codigo": "..." }`.
- Nunca expor stack trace, SQL, caminho interno ou variável de ambiente.

## Paginação, filtros e performance

- Paginação no servidor com limite máximo; ordenação por allowlist; filtros
  validados.
- Evitar N+1 (eager loading / joins controlados); selecionar colunas necessárias.
- Índices coerentes com filtros e ordenações.

## Anti-padrões a evitar

Regra de negócio em controller/rota; dependências circulares; repositório
retornando entidades de domínio misturadas a HTTP; duplicar autorização; `any`.
