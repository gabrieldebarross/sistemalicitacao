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

## Pendências

- Escolher ferramentas (Vitest/Jest, Supertest, Testing Library, Playwright).
- Definir banco de teste e estratégia de fixtures.
- Definir meta de cobertura para módulos críticos (domínio/authz).
