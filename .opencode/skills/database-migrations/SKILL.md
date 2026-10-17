---
name: Migrações de Banco de Dados
description: Use ao modelar tabelas, criar ou revisar migrations e seeders, definir índices, chaves estrangeiras, constraints e planos de rollback. Orienta migrações versionadas e seguras.
---

# Skill: Migrações de Banco de Dados

Toda alteração de schema passa por migration versionada e revisável. Nunca usar
`sequelize.sync({ alter: true })` ou `force: true` como mecanismo de migração.

## Modelagem relacional

- Chave primária explícita em toda tabela.
- Chaves estrangeiras com integridade referencial e política de exclusão
  explícita (`RESTRICT`, `CASCADE`, `SET NULL`) coerente com o domínio.
- `NOT NULL` onde o domínio exigir; `UNIQUE` para natural keys.
- `created_at`/`updated_at`; soft delete apenas com justificativa documentada.
- Restrições de domínio (enums/checks) quando estáveis.
- Campos de auditoria quando aplicável (`created_by`, `updated_by`).

## Índices

Criar índices para colunas usadas em filtros, junções, unicidade e ordenações
frequentes. Evitar índices redundantes. Considerar índices compostos pela ordem
de seletividade.

## Migrations

- Uma migration por mudança lógica; nome versionado com timestamp.
- `up` e `down` implementados; **rollback testado em desenvolvimento**.
- Migrações sem perda de dados quando possível; alterações destrutivas
  (drop de coluna/tabela) exigem aprovação explícita e backup prévio.
- Compatibilidade com a versão anterior da aplicação durante a janela de deploy
  (expand/contract quando necessário).
- Nunca executar migrations destrutivas automaticamente em produção.
- Documentar migrations relevantes e seu plano de rollback.

## Seeders

- Idempotentes sempre que possível (upsert/findOrCreate).
- Dados iniciais seguros: tipos de processo, setores, cargos, papéis, permissões.
- **Nunca** criar senha administrativa universal para produção. Administrador
  inicial via procedimento de provisionamento seguro e documentado.
- Preservar valores de origem (não corrigir grafias silenciosamente); normalizar
  em campo separado e documentar quando necessário.

## Antes de operações de risco

Backup → migration → verificação → plano de rollback. Em produção, nunca aplicar
sem aprovação. Banco de teste separado do de desenvolvimento; desenvolvimento
separado de produção.
