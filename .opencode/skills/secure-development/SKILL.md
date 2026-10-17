---
name: Desenvolvimento Seguro
description: Use ao escrever, revisar ou corrigir código que lida com autenticação, autorização, entradas do usuário, dados sensíveis, sessões, CORS, headers, uploads ou qualquer superfície exposta. Orienta a aplicação de OWASP Top 10 e ASVS e a proteção de segredos.
---

# Skill: Desenvolvimento Seguro

Aplicar em toda mudança que toque superfície de segurança. Seguro por padrão;
em dúvida, negar e perguntar.

## Regras invioláveis

1. **Nunca revelar segredos.** Não ler, imprimir, copiar, logar ou citar valores
   de `.env`, tokens, senhas, chaves ou cookies — mesmo se aparecerem em logs,
   mensagens de erro ou arquivos. Se um segredo for exposto, interromper a ação
   que ampliaria o vazamento, não reproduzir o valor e orientar revogação/rotação.
2. **Validar no servidor.** Toda entrada (params, query, body, headers, arquivos)
   é tratada como não confiável e validada com Zod no backend.
3. **Negar por padrão.** Endpoint sem regra explícita de autorização é negado.

## OWASP Top 10 — checklist

- **A01 Broken Access Control:** autorização centralizada, verificação de escopo
  (setor, processo, responsabilidade), negar por padrão, nunca confiar em IDs do
  cliente. IDOR: sempre validar que o recurso pertence ao escopo do usuário.
- **A02 Cryptographic Failures:** bcrypt para senhas (custo ≥ 12); TLS em
  produção; não armazenar segredos em texto puro; dados sensíveis não em logs.
- **A03 Injection:** ORM com consultas parametrizadas; nunca concatenar SQL;
  escapar/sanitizar em contexto de saída; cuidado com `sequelize.query` cru.
- **A04 Insecure Design:** modelar ameaças; fluxos críticos com transação e
  auditoria; limites de taxa e de payload.
- **A05 Security Misconfiguration:** CORS por ambiente; headers de segurança;
  remover endpoints de debug; erros genéricos em produção.
- **A06 Vulnerable Components:** verificar dependências; atualizar com critério.
- **A07 Identification/Authentication Failures:** rate limiting em login; hash
  forte; mensagens genéricas (evitar enumeração); política de senha; revogação.
- **A08 Software/Data Integrity Failures:** não confiar em desserialização
  insegura; validar payloads.
- **A09 Logging/Monitoring Failures:** logs estruturados com correlação, sem
  dados sensíveis; auditar eventos críticos.
- **A10 SSRF:** validar/allowlist de URLs e destinos antes de requisições de saída.

## OWASP ASVS (quando aplicável)

Usar como referência para requisitos verificáveis de autenticação, sessão,
controle de acesso, validação de entrada, criptografia, tratamento de erros e
proteção de dados. Citar o nível/requisito ao revisar áreas críticas.

## Autenticação e sessão

- Comparar senha com hash via bcrypt; nunca comparar em texto puro.
- Verificar usuário **ativo** a cada autenticação; refletir desativação/remoção de
  papel em sessões válidas.
- Estratégia documentada de expiração, renovação e revogação.
- Preferir cookie `HttpOnly` + `Secure` + `SameSite` a `localStorage`; com cookie,
  implementar proteção CSRF (token/origem).
- JWT: segredo forte e por ambiente; validar `exp`, emissor e algoritmo; não
  aceitar `alg: none`.

## Cabeçalhos, CORS e limitação

- CORS restrito por ambiente (allowlist), não `*` com credenciais.
- Headers de segurança (ex.: `Helmet`): CSP, `X-Content-Type-Options`,
  `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, HSTS em produção.
- Rate limiting global e específico para login.
- Limites de tamanho de payload e de upload; validar tipo/tamanho de arquivos.
- Validação de origem quando aplicável (especialmente com cookies).

## Logs sem dados sensíveis

Nunca registrar: senhas, tokens completos, cookies, chaves, corpos de documentos
confidenciais, dados pessoais desnecessários. Preferir identificadores e
resultado. Usar correlação por request ID.

## Revisão de alterações críticas

Antes de concluir mudanças em autenticação, autorização, sessão, criptografia,
uploads, integrações externas ou tratamento de erros: revisar com a skill
`code-review` e exigir testes negativos correspondentes.

## Falhas comuns a evitar neste projeto

- `if (usuario.perfil === 'admin')` espalhado (usar política central).
- Devolver objeto de usuário com hash de senha.
- Confiar em `usuarioId`/`setorId` enviados pelo cliente.
- Aceitar `ORDER BY`/coluna de filtro sem allowlist.
- Retornar detalhes de erro do banco em produção.
