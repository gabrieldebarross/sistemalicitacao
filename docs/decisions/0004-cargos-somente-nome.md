# ADR 0004 — Cargos: remoção dos campos numéricos e atributos de origem

- **Status:** aceito
- **Data:** 2026-10-17

## Contexto

Na Fase 1, os dois campos numéricos dos cargos (§6.1 do prompt) ficaram como
pendência. O responsável definiu: **excluir os campos numéricos** e usar
**somente o nome do cargo**.

## Decisão

- A entidade `cargos` armazena **apenas o nome** (normalizado) e um campo técnico
  `nome_original` (anulável) para **rastreabilidade** do valor de origem, além
  das datas de criação/atualização.
- São **removidos** do projeto: os dois campos numéricos e os demais atributos de
  origem (quadro, grupo ocupacional, referência, situação).
- Os papéis de acesso continuam sendo criados a partir dos **nomes dos cargos**
  (ADR 0002).

## Consequências

- Modelo de cargo mínimo e estável.
- A rastreabilidade do valor original é preservada apenas para o nome.
- Caso a autarquia precise de quadro/grupo/referência no futuro, nova migration
  poderá reintroduzi-los.
