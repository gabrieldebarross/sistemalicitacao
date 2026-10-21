# Testes e Qualidade

> Documento inicial (Fase 0). Ferramentas definidas na Fase 2.

## Estratégia

Testes desde o início (ver skill `testing-quality`):

- Unitários (domínio, transições, validações, autorização, prazos, indicadores).
- Integração (repositories, transações, migrations, seeders, RBAC).
- API (sucesso, inválido, não encontrado, não autenticado, sem permissão, fora do
  escopo, estado incompatível, concorrência, falha transacional, paginação).
- Frontend (renderização, formulários, estados, erros, acessibilidade, fluxos).
- E2E (fluxo completo: login → criar processo → atribuir → concluir → histórico →
  acesso negado → auditoria).

## Testes negativos obrigatórios

Não autenticado; token inválido; usuário inativo; sem permissão; fora do escopo;
dados de outro setor; escalada de privilégios; papéis não autorizados; entrada
inválida; transição proibida; falha transacional; concorrência.

## Critérios de qualidade antes de concluir

`pnpm build` · `pnpm lint` · `pnpm test` · revisão de tipos · logs · documentação ·
regressão. Nunca afirmar que um teste passou sem executá-lo; se não for possível,
informar a limitação.

## Estado atual

- **Backend:** Vitest + Supertest. A suíte cobre domínio de workflow
  (transições, devolução, pulo, pendências obrigatórias/opcionais), RBAC,
  normalização, validação Zod de processos e segurança, auditoria, duração de
  tokens, utilitários de token, obrigatoriedade de MFA e middlewares de
  autorização/senha provisória, além do endpoint de saúde.
- **Execução:** `pnpm -C backend test` (12 arquivos, 83 testes na última
  execução). `pnpm -C backend typecheck` e `pnpm -C backend lint` também são
  obrigatórios.
- **Frontend:** verificação de tipos (`pnpm -C frontend typecheck`), lint e build
  de produção (`pnpm -C frontend build`). Testes automatizados de componentes e
  E2E ainda não foram implementados.
- **Migrações:** validadas em desenvolvimento com MySQL; rollback deve ser
  exercitado antes de qualquer implantação.

## Pendências

- Adicionar testes de integração de sessões/refresh concorrente, MFA e
  desativação transacional contra banco de teste isolado.
- Adicionar testes de API negativos para todas as rotas novas.
- Introduzir testes de componentes e E2E (login, MFA, tarefas, delegações,
  visões salvas, desativação com transferência).
- Definir banco de teste e estratégia de fixtures.
- Definir meta de cobertura para módulos críticos (domínio/authz).
