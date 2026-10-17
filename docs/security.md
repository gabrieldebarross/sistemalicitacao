# Segurança

> Documento inicial (Fase 0). Detalhado na Fase 11.

## Princípios

- Seguro por padrão; negar por padrão na autorização.
- Menor privilégio.
- Nunca confiar na entrada do cliente nem na UI.
- Nunca expor segredos em código, logs, commits ou respostas.

## Controles previstos

- **Autenticação:** hash bcrypt (custo ≥ 12); verificação de usuário ativo;
  mensagens genéricas; rate limiting em login; revogação/expiração documentadas.
- **Sessão:** preferir cookies `HttpOnly`/`Secure`/`SameSite`; se cookie, proteção
  CSRF; validar `exp` e algoritmo do JWT.
- **Autorização:** RBAC + escopo contextual em política central; testes negativos.
- **Entrada:** validação Zod em params/query/body/filtros/paginação.
- **Injeção:** ORM parametrizado; evitar SQL concatenado.
- **Cabeçalhos:** Helmet (CSP, HSTS em produção, `X-Content-Type-Options`,
  `frame-ancestors`, `Referrer-Policy`).
- **CORS:** allowlist por ambiente; sem `*` com credenciais.
- **Rate limiting:** global + específico; limites de payload/upload.
- **Erros:** formato padrão; sem stack trace/SQL/paths em produção.
- **Logs:** estruturados, com correlação, sem dados sensíveis.
- **Dependências:** verificação de vulnerabilidades no CI.
- **Segredos:** `.env` fora do Git; `.env.example` só com placeholders.

## Proteção de arquivos sensíveis (guardrails do agente)

Regras em `opencode.json`: leitura/edição de `.env`, `.env.*`, chaves,
certificados, credenciais e dumps negadas; `.env.example` permitido (leitura) e
sujeito a revisão (edição). Configuração do agente é uma camada de proteção, não
uma sandbox infalível — combinar com `.gitignore`, proteção do SO, segregação de
credenciais e revisão humana.

## Pendências

- Definir armazenamento de token (cookie vs. header) com a arquitetura.
- Definir política de senha e de bloqueio por tentativas.
- Definir retenção de logs e de auditoria.
