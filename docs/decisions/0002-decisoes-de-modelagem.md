# ADR 0002 — Decisões de modelagem: monorepo, papéis, normalização e base legal

- **Status:** aceito
- **Data:** 2026-10-17
- **Contexto:** respostas do responsável ao ADR 0001 e início da Fase 1.

## Decisões

1. **Monorepo.** O repositório passa a ser monorepo com `backend/` e `frontend/`.
   O backend é movido para `backend/` agora; o `frontend/` será criado na Fase 10.
   Segue usando `pnpm` com `pnpm-workspace.yaml`.

2. **Papéis a partir dos cargos.** Os papéis de acesso (`Role`) serão criados
   **apenas com os nomes dos cargos** fornecidos. A distinção conceitual
   permanece: cargo funcional ≠ papel de acesso ≠ permissão. As **permissões**
   são atribuídas explicitamente aos papéis por uma matriz de permissões
   (`role_permissions`), e não inferidas do nome do cargo. A autoridade
   administrativa que concede papéis sensíveis deve ser documentada em
   `docs/rbac-matrix.md` (pendência).

3. **Normalização de nomes.** Nomes podem ser normalizados (Title Case) e ter
   grafias corrigidas (ex.: "TÉCNICO EM EFERMAGEM" → "Técnico em Enfermagem").
   O valor de origem é preservado na coluna `nome_original` para rastreabilidade.

4. **Base legal.** Os fluxos serão estruturados com base na **Lei nº 14.133/2021**
   (Nova Lei de Licitações) e demais normas oficiais aplicáveis, citando os
   dispositivos verificados. Não serão inventados artigos, prazos, limites ou
   obrigações. Fontes oficiais (Planalto, PNCP) são a referência.

## Pendências

- **Campos numéricos dos cargos** (§6.1): significado ainda não confirmado.
  Permanecem como colunas genéricas (`campo_numerico_1`, `campo_numerico_2`).
- Autoridade administrativa por papel sensível (§6.5).
- Validação jurídica dos fluxos-modelo antes de uso oficial.

## Consequências

- RBAC inicial com papéis nomeados pelos cargos; a matriz de permissões é
  explícita e auditável.
- Seeds de cargos preservam o nome original.
- Fluxos referenciam a Lei 14.133/2021; qualquer obrigação legal só entra com
  fonte verificada.
