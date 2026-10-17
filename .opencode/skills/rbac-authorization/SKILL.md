---
name: Autorização RBAC
description: Use ao implementar ou revisar papéis, permissões, atribuições, escopo por setor/processo, verificação de propriedade, separação de funções e testes de autorização.
---

# Skill: Autorização RBAC

Três conceitos distintos, **nunca** associados automaticamente:

1. **Cargo funcional:** posição na estrutura organizacional.
2. **Papel de acesso:** conjunto de responsabilidades/permissões no sistema.
3. **Permissão:** autorização para uma ação específica em um recurso.

Um cargo funcional **não** implica autoridade para aprovar contratações, alterar
permissões ou acessar todos os processos. Um usuário pode ter um cargo e um ou
mais papéis, conforme autorização administrativa documentada.

## Modelo

- `Role`, `Permission`, `UserRole`, `RolePermission` (RBAC configurável).
- Permissões no formato `recurso.acao` (ex.: `processos.advance`).
- Cada endpoint declara e verifica as permissões necessárias.
- Autorização **centralizada** em política reutilizável. Proibido
  `if (usuario.perfil === 'admin')` espalhado.

## Papéis iniciais (proposta técnica, não competência legal)

`SUPER_ADMIN_SISTEMA`, `ADMINISTRADOR`, `GESTOR_LICITACOES`,
`AGENTE_CONTRATACAO`, `EQUIPE_PLANEJAMENTO`, `JURIDICO_PARECERISTA`,
`FINANCEIRO_ORCAMENTARIO`, `DEMANDANTE`, `AUTORIDADE_COMPETENTE`,
`CONTROLE_INTERNO`, `CONSULTA_AUDITORIA`, `SERVIDOR_OPERADOR`.

Antes de habilitar operações sensíveis, documentar o que cada papel pode fazer
e qual autoridade administrativa concede a permissão.

## Controle contextual (além do papel)

Considerar: setor do usuário; setor responsável pelo processo; responsabilidade
atribuída na etapa; situação do processo/etapa; escopo administrativo; permissão
específica; separação de funções. Visualizar ≠ alterar.

## Escopo

- **Por setor:** usuário só acessa recursos do(s) seu(s) setor(es), quando a
  política assim determinar.
- **Por processo:** acesso limitado a processos atribuídos ou sob sua
  responsabilidade.
- **Propriedade/responsabilidade:** validar que o recurso pertence ao escopo.
- **Menor privilégio:** conceder o mínimo necessário.

## Separação de funções

Regras configuráveis e documentadas, por exemplo: impedir autoconcessão de
privilégios; exigir permissão específica para cancelar/anular; exigir
justificativa em operações críticas; dupla aprovação quando a política exigir;
registrar alterações de papel/permissão na auditoria. Não inventar proibições
legais universais.

## Testes de autorização (obrigatórios)

Para cada endpoint protegido: não autenticado; token inválido; usuário inativo;
autenticado sem permissão; com permissão mas fora do escopo; autorizado no
escopo correto; acesso a dados de outro setor; manipulação de parâmetros para
escalar privilégios; atribuição de papéis não autorizados.

**Negar por padrão** quando não houver regra explícita permitindo.
