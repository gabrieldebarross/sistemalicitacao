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

## Fluxos padrão semeados

O seeder `20260101000007-seed-fluxos-padrao.cjs` cria, para cada tipo de processo,
um fluxo **PUBLICADO** chamado `Fluxo padrão (Lei nº 14.133/2021)`, **editável e
clonável** (a administração pode criar fluxos personalizados). Nesta versão, os
prazos de gestão ficam nulos (a lei fixa prazos legais, não prazos internos) e o
responsável por setor/cargo não é definido (decisão administrativa). Seeder
idempotente: não recria o padrão se ele já existir para o tipo.

**Modalidades de licitação** (Pregão Eletrônico, Concorrência, Concurso, Leilão,
Diálogo Competitivo) — fases do art. 17 e etapas citadas:

| Fase | Etapas (referência) |
| --- | --- |
| Preparatória | ETP (art. 18, I); definição do objeto (art. 18, II); orçamento estimado (art. 18, IV); elaboração do edital (art. 18, V); análise de riscos (art. 18, X); parecer jurídico (art. 53) |
| Divulgação do edital | Publicação no PNCP (art. 17, II e art. 54) |
| Apresentação de propostas e lances | Sessão pública (art. 17, III e § 2º) |
| Julgamento | Julgamento das propostas (art. 17, IV) |
| Habilitação | Habilitação dos licitantes (art. 17, V) |
| Recursal | Fase recursal (art. 17, VI) |
| Homologação | Adjudicação e homologação (art. 17, VII e art. 71, IV) |

**Contratação direta** (Dispensa e Inexigibilidade de Licitação) — instrução do
art. 72:

| Fase | Etapas (referência) |
| --- | --- |
| Instrução do processo | Formalização da demanda/ETP/TR (art. 72, I); estimativa de despesa (art. 72, II); pareceres jurídico e técnicos (art. 72, III); compatibilidade orçamentária (art. 72, IV); habilitação e qualificação (art. 72, V); razão da escolha (art. 72, VI); justificativa de preço (art. 72, VII); autorização (art. 72, VIII) |
| Divulgação | Divulgação do ato de autorização/extrato (art. 72, parágrafo único) |

> Continua sendo **modelo administrativo** sujeito a validação jurídica. O sistema
> não substitui análise jurídica nem afirma conformidade legal.

## Pendências

- Fontes oficiais e dispositivos legais (não inventar) — validar com responsáveis.
- Tratamento de feriados (calendário) — a definir.
- Condições de aplicabilidade por modalidade — validar com a área.
