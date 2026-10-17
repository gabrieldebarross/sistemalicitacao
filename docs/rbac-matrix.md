# Matriz de RBAC — Papéis, Permissões e Escopos

> Documento inicial (Fase 0). Matriz completa preenchida na Fase 5.
> **Proposta técnica**, não declaração de competências legais.

## Três conceitos distintos

1. **Cargo funcional** — posição na estrutura organizacional (dados em §6.1 do prompt).
2. **Papel de acesso** — responsabilidades/permissões no sistema.
3. **Permissão** — autorização para uma ação específica em um recurso.

Um cargo **não** concede automaticamente autoridade. Papéis são atribuídos
conforme autorização administrativa documentada.

## Papéis (decisão ADR 0002)

Decisão do responsável: os papéis de acesso (`Role`) são criados **com os nomes
dos cargos funcionais**. Isso **não** elimina a separação conceitual: o nome do
papel vem do cargo, mas as **permissões** são atribuídas explicitamente na tabela
`role_permissions`, sem inferência automática do nome.

Cargos que originam papéis (grafia normalizada; original preservado em
`nome_original`):

- Assistente Administrativo
- Técnico em Enfermagem
- Farmacêutico Bioquímico/Biomédico
- Contador
- Técnico em Análises Clínicas
- Estagiário(a) Setor de Enfermagem
- Estagiário(a) Laboratório
- Advogado
- Enfermeiro
- Técnico em Raio-X
- Técnico em Informática
- Agente Administrativo
- Auxiliar de Serviços Gerais
- Psicólogo
- Coordenador
- Assessor Jurídico
- Diretor Administrativo Financeiro
- Diretor Serviços Saúde
- Supervisor(a) Administrativo

> Pendente (Fase 5): como conceder administração técnica do sistema apenas com
> papéis derivados de cargos, e qual autoridade concede cada permissão sensível.
> Provisionamento inicial de administrador por procedimento seguro (sem senha
> universal).

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
