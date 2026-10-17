---
name: Domínio de Workflow
description: Use ao implementar tipos de processo, fluxos, fases, etapas, instanciação de processos, transições de etapa, prazos internos, bloqueios, versionamento de fluxo e histórico.
---

# Skill: Domínio de Workflow

Hierarquia conceptual:

```text
TipoProcesso → Fluxo → Fase → Etapa
Processo → ProcessoEtapa / Movimentacao / Responsabilidades / Histórico
```

## Configuração vs. execução

- `Etapa` = etapa **configurada** no modelo do fluxo.
- `ProcessoEtapa` = **ocorrência** da etapa em um processo real (estado, ordem,
  responsável, setor, datas, prazo).

Manter configuração separada da execução para preservar histórico. Não impedir
que uma etapa apareça mais de uma vez no mesmo processo (retorno/repetição podem
ser válidos conforme o fluxo).

## Estados do processo

`RASCUNHO`, `EM_ANDAMENTO`, `SUSPENSO`, `CONCLUIDO`, `ANULADO`, `REVOGADO`.
Transições válidas definidas em **serviço de domínio**, com validação das
condições. Nunca permitir alterar status por endpoint genérico.

## Estados da etapa

`PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `BLOQUEADA`, `PULADA`. Documentar
transições permitidas. Concluir duas vezes deve ser idempotente ou rejeitado.
Etapa obrigatória não é ignorada sem regra explícita e autorização compatível.

## Movimentações

Eventos: `CRIACAO`, `INICIO_ETAPA`, `CONCLUSAO_ETAPA`, `ENCAMINHAMENTO`,
`DEVOLUCAO`, `ALTERACAO`, `SUSPENSAO`, `RETOMADA`, `OBSERVACAO`. Registrar
processo, etapa, usuário, setor, tipo, descrição, data/hora, correlação e
metadados seguros. Histórico tratado como registro de auditoria: **sem edição ou
exclusão** pela interface administrativa comum.

## Transações

Operações que alteram processo + etapas + movimentações usam transação com
rollback integral e controle de concorrência para impedir avanço duplo.

## Prazos internos

Diferenciar claramente: prazo interno de gestão, prazo legal, contratual e
informado pelo usuário. `prazoGestaoDias` é **prazo interno configurável**, não
legal. Calcular/apresentar: dias na etapa, data prevista, dias restantes, dias de
atraso, situação do prazo. Definir explicitamente tratamento de fins de semana,
feriados, suspensão e retomada. **Não** implementar cálculo de prazo legal sem
regra documentada e validada por fonte competente.

## Versionamento de fluxo

Versão publicada **não** é modificada silenciosamente. Ao alterar: criar nova
versão, preservar a anterior, registrar autor e justificativa, validar, publicar
conforme permissão e aplicar apenas a processos novos (salvo procedimento
explícito, autorizado e auditado). Ao criar processo: preservar a versão de fluxo
usada e instanciar as etapas. Edição de modelo **nunca** altera retroativamente
processos iniciados.

## Fundamentos legais

Se implementado: registrar norma, artigo, dispositivo, descrição, fonte oficial,
data de verificação, vigência, aplicabilidade, etapas relacionadas e responsável
pela validação. Diferenciar obrigatório/condicional/referência. **Nunca** usar
texto gerado por IA como fonte jurídica primária nem inventar artigos, prazos,
limites ou entendimentos. Fontes oficiais: Portal da Legislação (Governo
Federal), PNCP e demais fontes oficiais aplicáveis. Registrar pendências quando
não for possível verificar.

## Fluxos iniciais (modelos administrativos configuráveis, sujeitos a validação)

Pregão, Concorrência, Concurso, Leilão, Diálogo Competitivo, Dispensa de
Licitação, Inexigibilidade. **Não** apresentar uma sequência simplificada como
universalmente obrigatória por lei.
