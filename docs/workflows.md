# Workflows — Estados e Transições

> Documento inicial. Fase 1: fases com base na Lei nº 14.133/2021; regras
> consolidadas na Fase 8.

## Fases do processo licitatório (base legal)

A Lei nº 14.133/2021 (Planalto), **art. 17**, estabelece que o processo de
licitação observa as seguintes fases, em sequência:

I. preparatória;
II. de divulgação do edital de licitação;
III. de apresentação de propostas e lances, quando for o caso;
IV. de julgamento;
V. de habilitação;
VI. recursal;
VII. de homologação.

Essas fases orientam a **estruturação dos fluxos-modelo** por modalidade. Elas
são modelos administrativos configuráveis, sujeitos a validação jurídica.

Outros dispositivos de referência já verificados na fonte oficial:
- **art. 5º** — princípios (inclui planejamento, segregação de funções, motivação).
- **art. 6º** — definições (agente de contratação, comissão, TR, ETP etc.).
- **art. 7º** — gestão por competências e **segregação de funções**.
- **art. 8º** — agente de contratação; **pregoeiro** no pregão.
- **art. 11** — objetivos do processo licitatório.
- **art. 12** — plano de contratações anual; atos digitais.

**Modalidades** (Lei 14.133/2021, art. 28): pregão, concorrência, concurso,
leilão e diálogo competitivo. **Contratação direta:** dispensa (art. 75) e
inexigibilidade (art. 74). Os tipos de processo no sistema refletem essa
classificação, sem antecipar juízo jurídico sobre enquadramento do caso concreto.

> Pendente: confirmar dispositivos e prazos específicos com a área jurídica antes
> de qualquer uso oficial. Não inventar artigos, prazos ou limites.

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

Estruturados sobre as fases do art. 17 (preparatória → divulgação do edital →
apresentação de propostas/lances → julgamento → habilitação → recursal →
homologação), com fases preliminares internas de gestão quando fizer sentido:

- Pregão;
- Concorrência;
- Concurso;
- Leilão;
- Diálogo Competitivo;
- Dispensa de Licitação;
- Inexigibilidade.

São **modelos administrativos configuráveis**, sujeitos a validação jurídica antes
de uso oficial. Não representar como sequência universalmente obrigatória por lei.

## Pendências

- Fontes oficiais e dispositivos legais (não inventar) — validar com responsáveis.
- Tratamento de feriados (calendário) — a definir.
- Condições de aplicabilidade por modalidade — validar com a área.
