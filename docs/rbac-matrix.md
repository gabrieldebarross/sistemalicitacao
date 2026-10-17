# Matriz de RBAC — Papéis, Permissões e Escopos

> Documento inicial (Fase 0). Matriz completa preenchida na Fase 5.
> **Proposta técnica**, não declaração de competências legais.

## Três conceitos distintos

1. **Cargo funcional** — posição na estrutura organizacional (dados em §6.1 do prompt).
2. **Papel de acesso** — responsabilidades/permissões no sistema.
3. **Permissão** — autorização para uma ação específica em um recurso.

Um cargo **não** concede automaticamente autoridade. Papéis são atribuídos
conforme autorização administrativa documentada.

## Papéis iniciais

| Papel | Propósito |
| --- | --- |
| `SUPER_ADMIN_SISTEMA` | Administração técnica e configuração global. |
| `ADMINISTRADOR` | Administração funcional de usuários, setores e cadastros. |
| `GESTOR_LICITACOES` | Acompanhamento e gestão dos processos. |
| `AGENTE_CONTRATACAO` | Execução de atividades atribuídas. |
| `EQUIPE_PLANEJAMENTO` | Preparação e instrução dos processos. |
| `JURIDICO_PARECERISTA` | Análise jurídica e manifestações. |
| `FINANCEIRO_ORCAMENTARIO` | Etapas financeiras e orçamentárias. |
| `DEMANDANTE` | Abertura de demandas e acompanhamento próprio. |
| `AUTORIDADE_COMPETENTE` | Decisões e aprovações atribuídas. |
| `CONTROLE_INTERNO` | Consulta e fiscalização autorizada. |
| `CONSULTA_AUDITORIA` | Consulta de dados/histórico, sem alteração. |
| `SERVIDOR_OPERADOR` | Tarefas administrativas autorizadas. |

## Permissões (catálogo inicial)

`processos.read|create|update|cancel|advance|return|assign|suspend|resume|supervise|export`,
`fluxos.read|create|update|publish`,
`usuarios.read|create|update|deactivate`,
`roles.read|manage`, `permissions.manage`,
`audit.read`, `reports.read|export`.

Cada endpoint declara e verifica as permissões necessárias. Autorização
centralizada em política reutilizável (proibido `if (perfil === 'admin')`).

## Controle contextual

Além do papel: setor do usuário, setor responsável, responsabilidade na etapa,
situação do processo/etapa, escopo administrativo, permissão específica e
separação de funções. Visualizar ≠ alterar. Menor privilégio. Negar por padrão.

## Pendências

- **Qual autoridade administrativa concede cada papel sensível** (a esclarecer).
- Regras de separação de funções (dupla aprovação, autoconcessão) — configuráveis.
- Papéis padrão de bootstrap (sem senha universal).
