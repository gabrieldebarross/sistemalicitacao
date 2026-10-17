# AGENTS.md — Sistema de Gestão de Licitações e Contratações Públicas

Este arquivo é a fonte principal de instruções persistentes para agentes de IA
que trabalham neste repositório. Ele deve ser lido antes de qualquer tarefa e
mantido sincronizado com o código. **Não contém credenciais, tokens ou dados
confidenciais.**

---

## 1. Visão geral do sistema

Sistema web de gestão, acompanhamento e supervisão de processos de licitação e
contratação pública de uma autarquia municipal brasileira. Centraliza processos,
padroniza fluxos de trabalho, controla responsáveis, registra movimentações,
acompanha prazos internos e disponibiliza indicadores gerenciais.

O sistema é uma **ferramenta de gestão**. Não substitui análise jurídica,
sistemas oficiais de publicação, portais governamentais ou decisões
administrativas exigidas por lei.

## 2. Objetivos e limites

**Objetivo:** entregar um sistema real, seguro, consistente, acessível, testável
e preparado para produção, sem código fictício, sem botões sem função real, sem
regras de negócio espalhadas e sem permissões improvisadas.

**Limites:**
- Não inventar obrigações jurídicas, artigos, prazos ou limites legais.
- Não afirmar conformidade legal sem fonte oficial verificada.
- Não armazenar credenciais reais em código, testes, logs ou documentação.
- Não executar operações destrutivas, deploy, migrações destrutivas ou
  alterações externas sem autorização explícita.
- Não criar commit/push sem autorização explícita.

## 3. Stack tecnológica aprovada

**Backend:** Node.js LTS, TypeScript estrito, Express, Sequelize, MySQL, JWT,
bcrypt, Zod, dotenv, CORS por ambiente, pnpm.

**Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS,
shadcn/ui quando apropriado, React Hook Form, Zod, Lucide (ícones),
biblioteca de gráficos apenas quando houver necessidade real.

**Infraestrutura:** Docker, Docker Compose, MySQL em serviço separado, proxy
reverso quando aplicável, CI/CD, logs estruturados, backups e monitoramento.

Não instalar bibliotecas redundantes. Uma solução por responsabilidade.
Dependências novas exigem justificativa documentada.

## 4. Arquitetura

### Backend (camadas)

```text
Routes → Middlewares → Controllers → Application Services → Domain → Repositories → Models → MySQL
```

Cada camada só existe quando possui responsabilidade real. Regras de negócio
nunca ficam em controllers, rotas ou componentes React.

- **Routes:** endpoints + aplicação de middlewares.
- **Middlewares:** autenticação, autorização, validação transversal, erros.
- **Controllers:** interpretação HTTP e formatação de resposta.
- **Application Services:** orquestração de casos de uso.
- **Domain:** regras de negócio, estados e transições válidas.
- **Repositories:** consultas e persistência.
- **Models:** mapeamento entidade ↔ banco.

### Frontend (por funcionalidade)

Separar rotas/layouts, páginas, componentes de domínio, componentes visuais
compartilhados, formulários/schemas, serviços de API, hooks, tipos, tratamento
de erros, sessão e permissões de interface.

A interface **nunca** é a autoridade final de autorização. Toda autorização é
aplicada e validada no backend.

## 5. Convenções de nomenclatura

- Diretórios e arquivos: `kebab-case` (ex.: `processo-service.ts`).
- Classes/tipos/interfaces: `PascalCase`.
- Variáveis/funções: `camelCase`.
- Constantes: `UPPER_SNAKE_CASE`.
- Tabelas/colunas MySQL: `snake_case`.
- Rotas REST: substantivos no plural, `kebab-case` (ex.: `/api/tipos-processo`).
- Enums de domínio: `UPPER_SNAKE_CASE` (ex.: `EM_ANDAMENTO`).
- Testes: `*.test.ts` / `*.spec.ts`, espelhando a estrutura do código.

## 6. Regras de TypeScript

- `strict: true` obrigatório; **evitar `any`** (usar `unknown` + validação).
- Tipos explícitos em fronteiras públicas (funções exportadas, DTOs).
- Preferir `type`/`interface` de domínio a tipos inline repetidos.
- Não usar non-null assertion (`!`) para contornar erros de tipo.
- Validação de entrada com Zod; nunca confiar em dados do cliente.
- Não silenciar erros com `@ts-ignore`/`@ts-expect-error` sem justificativa.

## 7. Princípios SOLID

Aplicar de forma prática, sem abstrações desnecessárias:
- **S:** cada módulo com um propósito claro.
- **O:** extensão controlada em vez de alterações dispersas.
- **L:** abstrações mantêm contratos coerentes.
- **I:** não forçar dependência de operações desnecessárias.
- **D:** alto nível não depende diretamente de detalhes concretos quando
  abstrações trazem benefício real.

Classes apenas quando houver estado/comportamento/contrato que justifique.

## 8. Organização das pastas

Monorepo (decidido no ADR 0002). O backend vive em `backend/`; o frontend será
criado em `frontend/` na Fase 10.

```text
sistema_licitacao/
├── AGENTS.md  README.md  opencode.json  .env.example
├── pnpm-workspace.yaml
├── .opencode/skills/
├── docs/
├── backend/
│   ├── src/
│   │   ├── config/ controllers/ middlewares/ models/
│   │   ├── repositories/ routes/ services/ domain/
│   │   ├── errors/ types/ utils/ app.ts server.ts
│   ├── database/migrations/  database/seeders/
│   ├── tests/
│   ├── .sequelizerc  tsconfig.json  package.json
└── frontend/                       # Fase 10
```

Não criar pastas vazias ou módulos sem responsabilidade definida.

## 9. Modelagem de banco de dados

- Migrations versionadas para **todas** as tabelas.
- Chaves primárias, estrangeiras, índices, unicidade e obrigatoriedade explícitos.
- Datas `created_at`/`updated_at`; soft delete só com justificativa.
- Integridade referencial com política de exclusão explícita.
- Índices em colunas usadas em filtros, junções e ordenações.
- Evitar N+1; paginação no servidor; transações em casos de uso multi-entidade.
- **Proibido** usar `sequelize.sync({ alter/force })` como migração em produção.
- Nunca apagar registros históricos necessários à auditoria.
- Senhas sempre com hash (bcrypt); nunca em texto puro.
- Seeders idempotentes com dados iniciais seguros.

## 10. Convenções de API REST

- Base: `/api`. Recursos no plural.
- Respostas de sucesso: `{ "sucesso": true, "dados": ... }`.
- Respostas de erro: `{ "sucesso": false, "mensagem": "...", "codigo": "..." }`.
- Nunca expor stack traces, SQL, caminhos internos ou variáveis de ambiente.
- Paginação, ordenação e filtros validados; limite máximo de página.
- Não aceitar `usuarioId`/`setorId`/papel do cliente quando deriváveis do token.

## 11. Regras de validação

- Zod para params, query, body, filtros, paginação, auth e transições.
- Rejeitar dados inválidos de forma consistente (erro 400 tipado).
- Normalizar entradas (ex.: e-mail em minúsculas) antes de persistir/comparar.
- Validação duplicada em frontend é UX, nunca substitui a do backend.

## 12. Erros e exceções

Estratégia centralizada com classes de erro tipadas:
validação, autenticação, autorização, recurso inexistente, conflito de estado,
integridade e erro inesperado. Nunca expor detalhes internos ao cliente.
O middleware global de erros traduz exceções para o formato de resposta padrão.

## 13. Autenticação e autorização

- Login valida dados, verifica usuário ativo, compara hash, emite credenciais.
- Mensagens genéricas para falhas de credencial (evitar enumeração de usuário).
- Proteção contra brute force + rate limiting.
- JWT com expiração/renovação/revogação documentadas. Preferir cookies
  `HttpOnly`, `Secure`, `SameSite` quando viável; se cookie, tratar CSRF.
- Token válido **não** é autorização suficiente: verificar permissões e escopo.
- Toda rota protegida declara e verifica permissões.
- Autorização centralizada em política reutilizável. **Proibido** `if (user.perfil === 'admin')`.
- Negar por padrão quando não houver regra explícita permitindo.

## 14. Auditoria

Registrar usuário, ação, recurso, id, data/hora, resultado, justificativa e
identificador de correlação. Auditar: login, criação/alteração de processos,
avanço/devolução de etapas, suspensão/retomada, cancelamento/anulação/revogação,
atribuições, alterações de fluxos/versões, alterações de papéis/permissões,
exportações e operações administrativas críticas. Não registrar segredos nem
dados pessoais desnecessários. Imutabilidade exige controle de permissões e de
acesso ao banco — não apenas bloqueio de UI.

## 15. Proteção de arquivos sensíveis

**Nunca** ler, imprimir, copiar ou expor valores de `.env`, `.env.*` reais,
chaves privadas, certificados, tokens ou dumps. `.env.example` pode ser lido e
editado (somente placeholders, nunca valores reais).

Proibido contornar via shell (`cat`, `type`, `Get-Content`, `grep`, `find`,
`Select-String`) ou por outras ferramentas. Para validar configuração, verificar
apenas **presença/formato** de variáveis, nunca seus valores.

Em suspeita de segredo exposto: interromper a ação, não reproduzir o segredo e
orientar revogação/rotação.

## 16. Política de testes

Testes desde o início, não no final. Cobrir unitário, integração, API,
autorização, componentes, fluxos críticos, regressão, acessibilidade e
migração. Exigir **testes negativos** (acesso não autorizado, entrada inválida,
transição proibida, falha transacional, concorrência). Nunca remover testes nem
reduzir cobertura para fazer algo passar. Nunca afirmar que um teste passou sem
executá-lo; se não for possível executar, informar a limitação.

## 17. Interface e acessibilidade

Design system com cores semânticas, tipografia, espaçamento, bordas, elevação,
raios e estados. Layout com sidebar, cabeçalho contextual, breadcrumbs, estados
de carregamento/vazio/erro e responsividade. Acessibilidade: navegação por
teclado, foco visível, labels, contraste, semântica HTML, mensagens acessíveis,
respeito a redução de movimento. Operações críticas: confirmação explícita,
justificativa, autorização no backend e auditoria. Nunca simular sucesso antes
da confirmação do servidor.

## 18. Convenções de Git

- Commits pequenos e descritivos: `feat:`, `fix:`, `refactor:`, `test:`,
  `docs:`, `chore:`, `security:`.
- **Não** criar commits, push ou publicações automaticamente. Ao final de cada
  etapa, sugerir a mensagem e aguardar autorização.

## 19. Procedimentos para migrações

- Toda mudança de schema via migration versionada e revisável.
- Migrações destrutivas exigem aprovação explícita e backup prévio.
- Testar rollback em desenvolvimento.
- Documentar cada migração e seu plano de rollback em `docs/decisions/` quando
  relevante.

## 20. Procedimentos para alterações destrutivas

Exigem autorização explícita: exclusão de arquivos/dados, `force`/`alter` de
sync, `DROP`/`TRUNCATE`, reset de histórico Git, mudança de infraestrutura,
deploy e publicação. Em dúvida, **parar e perguntar**.

## 21. Critérios de conclusão de tarefas

Uma funcionalidade só está concluída quando: implementada, integrada, validada,
testada, documentada e com build/lint/tipos sem erros introduzidos. Ao encerrar
uma etapa, informar: o que foi implementado, arquivos alterados, testes
executados, problemas restantes e sugestão de commit.

## 22. Comandos oficiais

```bash
# na raiz do monorepo
pnpm install                       # instala dependências do workspace

# backend
pnpm -C backend dev                # desenvolvimento (tsx watch)
pnpm -C backend build              # compilação (tsc / TypeScript 7)
pnpm -C backend typecheck          # verificação de tipos
pnpm -C backend lint               # ESLint
pnpm -C backend test               # Vitest
pnpm -C backend db:migrate         # migrações (sequelize-cli)
pnpm -C backend db:seed:all        # seeders
```

---

## Fluxo de trabalho por tarefa

1. Ler este `AGENTS.md`.
2. Carregar as skills relevantes.
3. Inspecionar arquivos relacionados **sem acessar arquivos sensíveis**.
4. Entender o comportamento existente antes de alterar.
5. Identificar requisitos e critérios de aceitação.
6. Fazer um plano curto.
7. Avaliar riscos de segurança e impactos no banco.
8. Implementar a menor alteração coerente.
9. Escrever/atualizar testes.
10. Executar testes e verificações.
11. Corrigir problemas.
12. Atualizar documentação.
13. Resumir a entrega e sugerir commit.

## Skills disponíveis

Carregue a skill adequada ao tipo de tarefa:
`secure-development`, `testing-quality`, `frontend-design`,
`backend-architecture`, `database-migrations`, `rbac-authorization`,
`workflow-domain`, `code-review`.
