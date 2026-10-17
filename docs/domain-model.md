# Modelo de Domínio — Sistema de Gestão de Licitações

> Documento inicial (Fase 0). Consolidado na Fase 1 e no banco (Fase 3).

## Hierarquia de workflow

```text
TipoProcesso → Fluxo → Fase → Etapa
Processo → ProcessoEtapa / Movimentacao / Responsabilidades / Histórico
```

## Entidades principais

| Entidade | Papel |
| --- | --- |
| `TipoProcesso` | Modalidade/tipo de contratação (Pregão, Dispensa, etc.). |
| `Fluxo` | Modelo de trabalho associado a um tipo; versionado. |
| `Fase` | Agrupamento ordenado de etapas dentro de um fluxo. |
| `Etapa` | Etapa **configurada** no fluxo (ordem, obrigatoriedade, prazo interno). |
| `Processo` | Instância real de contratação; referencia a versão de fluxo usada. |
| `ProcessoEtapa` | **Ocorrência** de uma etapa no processo (estado, responsável, datas, prazo). |
| `Movimentacao` | Evento histórico do processo (imutável). |
| `Usuario` | Servidor/operador do sistema. |
| `Cargo` | Cargo funcional (posição na estrutura organizacional). |
| `Setor` | Unidade administrativa. |
| `Role` / `Permission` / `UserRole` / `RolePermission` | RBAC. |
| `Auditoria` | Registro de operações relevantes de segurança. |

Entidades adicionais (versões de fluxo, transições, fundamentos legais,
documentos) serão avaliadas quando houver necessidade comprovada.

## Distinções-chave

- **Cargo funcional ≠ papel de acesso ≠ permissão.**
- **Etapa (configuração) ≠ ProcessoEtapa (execução).**
- **Histórico operacional (movimentações) ≠ auditoria de segurança.**

## Estados

- **Processo:** `RASCUNHO`, `EM_ANDAMENTO`, `SUSPENSO`, `CONCLUIDO`, `ANULADO`, `REVOGADO`.
- **Etapa:** `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `BLOQUEADA`, `PULADA`.

Detalhes de transição em `docs/workflows.md`.

## Pendências de modelagem

- Semântica dos dois campos numéricos dos cargos (ver ADR 0001).
- Estratégia de versionamento de fluxo (`fluxo_versoes` vs. campos na própria linha).
- Política de soft delete por entidade.
