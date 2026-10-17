---
name: Revisão de Código
description: Use ao revisar alterações, diffs ou pull requests antes de concluir uma entrega, especialmente em áreas críticas como autenticação, autorização, banco de dados, workflow e tratamento de erros.
---

# Skill: Revisão de Código

Revisar analisando e recomendando correções **antes** de alterar código,
especialmente em áreas críticas. Ser específico: apontar arquivo, linha e o
problema; propor a correção.

## Checklist de revisão

**Funcional**
- Atende ao requisito e ao critério de aceitação?
- Casos de erro, limites e estados vazios tratados?

**Arquitetura / SOLID**
- Responsabilidades separadas? Regra de negócio fora de controller/rota/componente?
- Duplicação evitável? Dependências circulares? Abstração desnecessária?

**Segurança**
- Autorização presente e centralizada em **todos** os acessos?
- Validação de entrada no servidor? Sem confiar em IDs/roles do cliente?
- Sem segredos em código/logs? Erros sem vazar detalhes internos?

**Banco de dados**
- Índices coerentes? Consultas N+1? Transações em operações multi-entidade?
- Migration com `down` e sem perda de dados? Integridade referencial?

**Tipagem / qualidade**
- Sem `any`, sem `@ts-ignore` injustificado, tipos explícitos na borda?
- Build, lint e tipos sem erros introduzidos?

**Testes**
- Há testes (incl. negativos) para o comportamento novo?
- Testes de autorização para endpoints protegidos?

**Acessibilidade / frontend**
- Labels, foco, teclado, contraste, semântica, estados de loading/erro.

**Compatibilidade / documentação**
- Contratos de API alterados com consumidores e docs atualizados?
- Documentação sincronizada?

**Risco de regressão**
- O que mais pode quebrar? Há teste cobrindo?

## Formato do parecer

1. **Resumo** (2–3 linhas).
2. **Bloqueadores** (deve corrigir antes de concluir).
3. **Recomendações** (melhorias não bloqueantes).
4. **Pontos positivos**.
5. **Testes executados/pendentes**.

## Regras

- Nunca aprovar sem verificar autorização e testes em áreas críticas.
- Não reescrever módulos inteiros para corrigir problemas localizados.
- Não remover testes que falham; entender a causa.
- Distinguir falha preexistente de falha introduzida pela mudança.
