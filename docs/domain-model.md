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

## Tabelas criadas na Fase 3

Cadastros e workflow: `cargos`, `setores`, `tipos_processo`, `fluxos`, `fases`,
`etapas`, `processos`, `processo_etapas`, `movimentacoes`.

Acesso e auditoria: `usuarios`, `roles`, `permissions`, `user_roles`,
`role_permissions`, `user_sector_assignments`, `auditoria`.

Detalhes em `backend/database/migrations/`.

## Decisões de modelagem

- **Cargos:** apenas o nome (normalizado) + `nome_original` para rastreabilidade;
  os campos numéricos e demais atributos de origem foram removidos (ADR 0004).
- **Versionamento de fluxo:** o número da versão fica na própria linha de
  `fluxos` (`versao`), com unicidade em `(tipo_processo_id, nome, versao)`. O
  processo guarda a referência da versão usada e a instância de etapa copia
  (snapshot) os dados relevantes, preservando o histórico mesmo que o fluxo
  seja alterado.
- **`movimentacoes` e `auditoria`:** imutáveis (apenas `created_at`).
- **Permissões:** nenhuma concedida por padrão; a matriz papel × permissão deve
  ser definida pela administração (ADR 0002).

## Pendências de modelagem

- Política de soft delete por entidade.
- Definição da matriz papel × permissão (administração).
