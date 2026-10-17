---
name: Testes e Qualidade
description: Use ao escrever testes, definir critérios de aceitação, validar entregas ou quando precisar garantir cobertura de unitário, integração, API, autorização, componentes, fluxos críticos, acessibilidade e migrações. Define a estratégia de testes do projeto.
---

# Skill: Testes e Qualidade

Testes desde o início. Uma funcionalidade só é considerada concluída após
implementada, integrada, validada e testada. Nunca remover testes nem reduzir
cobertura para fazer algo passar.

## Pirâmide de testes

- **Unitários:** regras de domínio, transições de estado, validações, políticas
  de autorização, cálculo de prazos internos, cálculo de indicadores, regras de
  atribuição, tratamento de erros.
- **Integração:** repositories, relacionamentos, transações, migrations,
  seeders, autenticação, RBAC, escopo por setor, movimentações, integridade
  referencial.
- **API:** todos os endpoints relevantes (sucesso, dados inválidos, recurso
  inexistente, não autenticado, sem permissão, fora do escopo, estado
  incompatível, conflito concorrente, falha transacional, paginação/filtros).
- **Frontend:** renderização, formulários, validação, loading, erros da API,
  permissões de UI, navegação, responsividade, acessibilidade, fluxos completos.
- **E2E:** cenários reais ponta a ponta (ver abaixo).

## Testes negativos são obrigatórios

Todo endpoint protegido deve testar:

1. Usuário não autenticado.
2. Token inválido/expirado.
3. Usuário inativo.
4. Usuário autenticado **sem** a permissão.
5. Usuário com permissão, mas **fora** do escopo do recurso.
6. Usuário autorizado no escopo correto (positivo).
7. Tentativa de acessar dados de outro setor.
8. Tentativa de modificar parâmetros para ampliar privilégios.
9. Tentativa de atribuir papéis não autorizados.

Além disso: entrada inválida, transição de workflow proibida, falha transacional
(rollback) e concorrência (duas requisições avançando o mesmo processo).

## Cenário E2E de referência

1. Usuário autorizado faz login.
2. Cadastra um processo (etapas instanciadas do fluxo).
3. Consulta a supervisão.
4. Uma etapa é atribuída.
5. A etapa é concluída e a próxima é iniciada.
6. O histórico é atualizado.
7. Usuário sem permissão tenta operação restrita → API rejeita.
8. A auditoria registra os eventos.

## Fixtures e dados de teste

- Dados fictícios e isolados; **nunca** credenciais reais.
- Cada teste cria/limpa seu próprio estado; seeders de teste idempotentes.
- Banco de teste separado do desenvolvimento.
- Nunca usar dados de produção em testes sem autorização e controles.

## Critérios de aceitação e relatório de falhas

- Cada entrega declara critérios de aceitação verificáveis.
- Relatório de falha deve conter: cenário, entrada, resultado esperado,
  resultado obtido, severidade e evidência.
- Falha preexistente não é atribuída automaticamente à mudança atual; verificar.

## Execução obrigatória antes de concluir

- `pnpm build` (tipos), `pnpm lint`, `pnpm test`.
- Nunca afirmar que um teste passou sem tê-lo executado; se não for possível,
  informar a limitação explicitamente.
- Corrigir falhas introduzidas pela própria mudança.
