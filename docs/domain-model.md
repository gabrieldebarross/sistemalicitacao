# Modelo de Domínio — Sistema de Gestão de Licitações

> Documento inicial (Fase 0). Consolidado na Fase 1 e no banco (Fase 3).

## Hierarquia de workflow

```text
TipoProcesso → Fluxo → Fase → Etapa
Processo → ProcessoEtapa / Movimentacao / Responsabilidades / Histórico
```

## Entidades principais

| Entidade | Papel |
| --- | --- |
| `TipoProcesso` | Modalidade/tipo de contratação (Pregão, Dispensa, etc.). |
| `Fluxo` | Modelo de trabalho associado a um tipo; versionado. |
| `Fase` | Agrupamento ordenado de etapas dentro de um fluxo. |
| `Etapa` | Etapa **configurada** no fluxo (ordem, obrigatoriedade, prazo interno). |
| `Processo` | Instância real de contratação; referencia a versão de fluxo usada. |
| `ProcessoEtapa` | **Ocorrência** de uma etapa no processo (estado, responsável, datas, prazo). |
| `Movimentacao` | Evento histórico do processo (imutável). |
| `Usuario` | Servidor/operador do sistema. |
| `Cargo` | Cargo funcional (posição na estrutura organizacional). |
| `Setor` | Unidade administrativa. |
| `Role` / `Permission` / `UserRole` / `RolePermission` | RBAC. |
| `Auditoria` | Registro de operações relevantes de segurança. |
| `Sessao` | Sessão revogável; guarda hash do refresh token, estado de MFA e expiração. |
| `SenhaHistorico` | Hashes das últimas senhas, para impedir reutilização. |
| `MfaCodigoRecuperacao` | Códigos de recuperação de MFA, armazenados somente como hash. |
| `VisaoSalva` | Filtros da listagem de processos, privados por usuário. |
| `Delegacao` | Compartilhamento temporário de tarefas entre usuários. |

Entidades adicionais (versões de fluxo, transições, fundamentos legais,
documentos) serão avaliadas quando houver necessidade comprovada.

## Distinções-chave

- **Cargo funcional ≠ papel de acesso ≠ permissão.**
- **Etapa (configuração) ≠ ProcessoEtapa (execução).**
- **Histórico operacional (movimentações) ≠ auditoria de segurança.**

## Estados

- **Processo:** `RASCUNHO`, `EM_ANDAMENTO`, `SUSPENSO`, `CONCLUIDO`, `ANULADO`, `REVOGADO`.
- **Etapa:** `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `BLOQUEADA`, `PULADA`.

Detalhes de transição em `docs/workflows.md`.

## Tabelas criadas na Fase 3

Cadastros e workflow: `cargos`, `setores`, `tipos_processo`, `fluxos`, `fases`,
`etapas`, `processos`, `processo_etapas`, `movimentacoes`.

Acesso e auditoria: `usuarios`, `roles`, `permissions`, `user_roles`,
`role_permissions`, `user_sector_assignments`, `auditoria`.

Sessões e segurança: `sessoes`, `senhas_historico`, `mfa_codigos_recuperacao`.

Produtividade e colaboração: `visoes_salvas`, `delegacoes`.

Detalhes em `backend/database/migrations/`.

## Decisões de modelagem

- **Cargos:** apenas o nome (normalizado) + `nome_original` para rastreabilidade;
  os campos numéricos e demais atributos de origem foram removidos (ADR 0004).
- **Vínculo usuário-setor:** `user_sector_assignments` permite múltiplos setores
  por usuário e marca no máximo um como principal. O setor da etapa acompanha
  automaticamente o setor principal do responsável; o setor do processo é
  independente e definido explicitamente.
- **Sessões:** o access token (curto) carrega o identificador da sessão (`sid`).
  O refresh token é rotacionado e armazenado somente como hash; a reutilização
  fora da janela concorrente revoga a sessão. A sessão pendente de MFA não recebe
  access token até a conclusão do segundo fator.
- **Senhas:** hash bcrypt, mínimo de 12 caracteres e histórico das últimas 5
  senhas para impedir reutilização.
- **MFA:** TOTP para contas com permissões administrativas. O segredo é
  criptografado com AES-256-GCM; os 10 códigos de recuperação são armazenados
  somente como hash e consumidos no uso. A redefinição por administrador revoga
  sessões e é auditada.
- **Versionamento de fluxo:** o número da versão fica na própria linha de
  `fluxos` (`versao`), com unicidade em `(tipo_processo_id, nome, versao)`. O
  processo guarda a referência da versão usada e a instância de etapa copia
  (snapshot) os dados relevantes, preservando o histórico mesmo que o fluxo
  seja alterado. O snapshot de `processo_etapas` inclui `condicional`,
  `condicao_aplicabilidade`, `permite_pulo`, `motivo_pulo` e `pulada_em`.
- **`movimentacoes` e `auditoria`:** imutáveis (apenas `created_at`).
- **Permissões:** nenhuma concedida por padrão; a matriz papel × permissão deve
  ser definida pela administração (ADR 0002).

## Pendências de modelagem

- Política de soft delete por entidade.
- Definição da matriz papel × permissão (administração).
