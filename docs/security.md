# Segurança

> Documento inicial (Fase 0). Detalhado na Fase 11.

## Princípios

- Seguro por padrão; negar por padrão na autorização.
- Menor privilégio.
- Nunca confiar na entrada do cliente nem na UI.
- Nunca expor segredos em código, logs, commits ou respostas.

## Controles implementados

- **Autenticação:** hash bcrypt (custo configurável, padrão 12); verificação de
  usuário ativo; mensagens genéricas em falhas de credencial; rate limiting de
  falhas de autenticação em login e MFA (refresh e respostas bem-sucedidas não
  consomem tentativas); bloqueio após 5 falhas por 15 minutos (configurável);
  desbloqueio administrativo auditado.
- **Sessão:** cookies `HttpOnly` (`sl_token`, `sl_refresh`) e `SameSite=Lax`,
  `Secure` em produção. Access token curto (padrão 15 min) com `sid`; refresh
  token de 7 dias, rotacionado a cada uso e persistido somente como hash na
  tabela `sessoes`. A sessão é validada no banco a cada requisição, permitindo
  revogação imediata. Reutilização do refresh token revoga a sessão; há uma
  janela curta de 10 segundos para rotações concorrentes legítimas (ex.: duas
  abas). Logout, troca de senha, desativação e reset de MFA revogam sessões.
- **MFA:** TOTP obrigatório para permissões administrativas
  (`usuarios.create`, `usuarios.update`, `usuarios.deactivate`,
  `roles.manage`, `permissions.manage`), com configuração obrigatória no
  primeiro acesso administrativo. São emitidos 10 códigos de recuperação de uso
  único, armazenados como hash. O segredo TOTP é criptografado com AES-256-GCM
  usando `MFA_ENCRYPTION_KEY` (32 bytes em hex, base64 ou texto). O desafio de
  MFA é uma sessão pendente de 10 minutos, sem access token, limitada a 5
  tentativas. São aceitos códigos TOTP de 4 a 8 dígitos, conforme o aplicativo
  autenticador; formatos fora desse intervalo são tratados como código inválido,
  sem erro interno. O contador é incrementado de forma atômica; ao atingir o limite, o
  desafio é revogado, os cookies são limpos e o cliente retorna ao login. Reset
  administrativo exige outro administrador, revoga sessões e é auditado.
- **Senhas:** mínimo de 8 caracteres, máximo de 128, histórico das últimas 5
  senhas, troca obrigatória de senha provisória e redefinição administrativa com
  revogação de sessões.
- **CSRF:** double-submit cookie (`sl_csrf` + header `x-csrf-token`) nas rotas
  autenticadas que alteram estado.
- **Autorização:** RBAC + escopo contextual em política central; testes
  negativos. Nenhuma permissão é inferida pelo nome do cargo.
- **Entrada:** validação Zod em params/query/body/filtros/paginação; filtros de
  visões salvas usam schema estrito, sem SQL livre.
- **Injeção:** ORM parametrizado; evitar SQL concatenado.
- **Cabeçalhos:** Helmet (CSP, HSTS em produção, `X-Content-Type-Options`,
  `frame-ancestors`, `Referrer-Policy`).
- **CORS:** allowlist por ambiente; sem `*` com credenciais.
- **Rate limiting:** global + específico; limites de payload/upload.
- **Erros:** formato padrão; sem stack trace/SQL/paths em produção.
- **Logs:** estruturados, com correlação, sem dados sensíveis. Segredos de MFA,
  tokens, hashes de senha e códigos de recuperação não são registrados.
- **Auditoria:** registra usuário, ação, recurso, resultado, justificativa e
  correlação. Cobre login/MFA, sessões, alterações de senha, desativação,
  transferências, bloqueio/desbloqueio de login, reset de MFA e visões salvas. Diffs usam allowlist de campos, mascaram senhas/tokens/segredos
  e truncam textos longos. A auditoria não é editável pela interface comum.
- **Dependências:** verificação de vulnerabilidades no CI.
- **Segredos:** `.env` fora do Git; `.env.example` só com placeholders.
  `MFA_ENCRYPTION_KEY` e `JWT_SECRET` são obrigatórios em produção.

## Proteção de arquivos sensíveis (guardrails do agente)

Regras em `opencode.json`: leitura/edição de `.env`, `.env.*`, chaves,
certificados, credenciais e dumps negadas; `.env.example` permitido (leitura) e
sujeito a revisão (edição). Configuração do agente é uma camada de proteção, não
uma sandbox infalível — combinar com `.gitignore`, proteção do SO, segregação de
credenciais e revisão humana.

## Pendências

- Revisão periódica de retenção de logs e de auditoria.
- Definição de política de resposta a incidentes e rotação de chaves.
- Avaliar MFA também para perfis não administrativos, conforme risco institucional.
