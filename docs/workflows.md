# Workflows — Estados e Transições

> Documento inicial (Fase 0). Regras consolidadas na Fase 8.

## Estados do processo

`RASCUNHO`, `EM_ANDAMENTO`, `SUSPENSO`, `CONCLUIDO`, `ANULADO`, `REVOGADO`.

Transições **previstas** (a validar condições no serviço de domínio):

| De | Para | Condição |
| --- | --- | --- |
| `RASCUNHO` | `EM_ANDAMENTO` | Fluxo e etapas instanciados; dados mínimos completos. |
| `EM_ANDAMENTO` | `SUSPENSO` | Justificativa + permissão `processos.suspend`. |
| `SUSPENSO` | `EM_ANDAMENTO` | Justificativa + permissão `processos.resume`. |
| `EM_ANDAMENTO` | `CONCLUIDO` | Todas as etapas obrigatórias concluídas. |
| `EM_ANDAMENTO`/`SUSPENSO` | `ANULADO` | Permissão `processos.cancel` + justificativa + auditoria. |
| `CONCLUIDO` | `REVOGADO` | Permissão específica + justificativa + auditoria. |

Não permitir alterar status por endpoint genérico.

## Estados da etapa

`PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `BLOQUEADA`, `PULADA`.

Transições previstas:

| De | Para | Condição |
| --- | --- | --- |
| `PENDENTE` | `EM_ANDAMENTO` | Início da etapa. |
| `EM_ANDAMENTO` | `CONCLUIDA` | Conclusão válida (idempotente/rejeitada se repetida). |
| `EM_ANDAMENTO` | `PENDENTE` | Devolução (`processos.return`). |
| `PENDENTE`/`EM_ANDAMENTO` | `BLOQUEADA` | Motivo registrado. |
| `BLOQUEADA` | `EM_ANDAMENTO` | Desbloqueio autorizado. |
| qualquer | `PULADA` | Somente com regra explícita + autorização; etapa obrigatória não é pulada sem regra. |

## Movimentações

`CRIACAO`, `INICIO_ETAPA`, `CONCLUSAO_ETAPA`, `ENCAMINHAMENTO`, `DEVOLUCAO`,
`ALTERACAO`, `SUSPENSAO`, `RETOMADA`, `OBSERVACAO`.

Histórico tratado como auditoria: sem edição/exclusão arbitrária pela UI comum.

## Prazos internos

`prazoGestaoDias` = prazo **interno de gestão** configurável, **não legal**.
Calcular dias na etapa, data prevista, dias restantes, dias de atraso e situação.
Definir tratamento de fins de semana, feriados, suspensão e retomada. Não
calcular prazo legal sem regra documentada e validada.

## Fluxos iniciais

Pregão, Concorrência, Concurso, Leilão, Diálogo Competitivo, Dispensa de
Licitação, Inexigibilidade — **modelos administrativos configuráveis**, sujeitos
a validação jurídica antes de uso oficial. Não representar como sequência
universalmente obrigatória por lei.

## Pendências

- Fontes oficiais e dispositivos legais (não inventar) — validar com responsáveis.
- Tratamento de feriados (calendário) — a definir.
- Condições de aplicabilidade por modalidade — validar com a área.
