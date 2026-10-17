# ADR 0001 — Adoção da stack e organização inicial do repositório

- **Status:** aceito (parcialmente, com pendências)
- **Data:** 2026-10-17
- **Contexto:** Fase 0. Repositório já continha um esqueleto de backend na raiz
  (`src/`, `database/`, `package.json`, `tsconfig.json`), com diretórios e
  arquivos vazios, `.env` real presente (não versionado) e `.env.example`,
  `.gitignore` e `README.md`. Um único commit (`feat: estrutura inicial`).

## Decisões

1. **Preservar a estrutura existente** (backend na raiz) em vez de mover
   imediatamente para `backend/`. Motivo: não sobrescrever/reorganizar trabalho
   existente sem necessidade; o frontend será adicionado em `frontend/` quando a
   Fase 10 iniciar. Reavaliar a migração para monorepo `backend/` + `frontend/`
   antes do frontend.
2. **Stack backend** confirmada: Node.js LTS, TypeScript estrito, Express,
   Sequelize, MySQL, JWT, bcrypt, Zod, dotenv, pnpm.
3. **Guardrails** implementados via `opencode.json` (V2 `permissions`), com
   negação de leitura/edição de arquivos sensíveis e `.env`.
4. **Skills** criadas em `.opencode/skills/` (8 skills).

## Pendências (requerem esclarecimento do responsável)

1. **Campos numéricos dos cargos:** os dois valores numéricos (§6.1 do prompt)
   permanecem genéricos (`campoNumerico1`, `campoNumerico2`) até confirmação do
   significado (ex.: vagas autorizadas/ocupadas). Não renomear por suposição.
2. **Grafias de origem:** registros como "TÉCNICO EM EFERMAGEM" contêm grafias a
   preservar como valor original; normalização, se necessária, será feita em
   campo separado e documentada. Não corrigir silenciosamente.
3. **Autoridade administrativa** que concede papéis/permissões sensíveis —
   necessária para documentar o RBAC (Fase 5).
4. **Fontes legais oficiais** para fundamentos — não inventar dispositivos.
5. **Estrutura monorepo** (`backend/` + `frontend/`) vs. manutenção atual.

## Consequências

- Trabalho existente preservado; nenhuma operação destrutiva executada.
- Reorganização de pastas fica condicionada a decisão registrada.
- Segredos permanecem fora do controle de versão.
