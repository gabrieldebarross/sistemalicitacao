# ADR 0003 — Ferramentas de TypeScript, lint, testes e execução

- **Status:** aceito
- **Data:** 2026-10-17
- **Contexto:** Fase 2. O esqueleto trazia TypeScript 7.0.2, cuja API programática
  ainda não existe; o `typescript-eslint` exige a API do TS 6. Além disso, o
  Vitest 5 (baseado em rolldown) falhou por binding nativo ausente no Windows.

## Decisões

1. **TypeScript 7 (compilador nativo) + TypeScript 6 (API) lado a lado**, conforme
   orientação oficial da Microsoft (announcing-typescript-7-0, seção
   "Running Side-by-Side with TypeScript 6.0"). Em `backend/package.json`:
   - `"typescript": "npm:@typescript/typescript6@^6.0.2"` (alias; fornece a API
     usada pelo typescript-eslint; binário `tsc6`);
   - `"@typescript/native": "npm:typescript@^7.0.2"` (alias; fornece o binário
     `tsc` nativo).
   Resultado: `tsc` = 7.0.2 (build/typecheck rápidos) e a API do TS 6 para lint.

2. **ESLint 10 + typescript-eslint 8** (flat config). A regra
   `@typescript-eslint/no-unused-vars` aceita prefixo `_` (necessário para o
   middleware de erro do Express, que exige 4 parâmetros).

3. **Vitest 3** para testes (o Vitest 5/rolldown apresentou falha de binding
   nativo no ambiente Windows) e **Supertest** para testes de API.

4. **Scripts no `backend/`**; execução via `pnpm -C backend <script>` a partir da
   raiz do monorepo.

## Consequências

- `pnpm -C backend lint|typecheck|build|test` passam.
- Revisar quando o TS 7.1 (com nova API) e o suporte do typescript-eslint a TS 7
  estiverem disponíveis: poderemos remover o alias do TS 6.
- Reavaliar o Vitest 5 quando o problema de binding nativo for resolvido.
