# Matriz de RBAC — Papéis, Permissões e Escopos

> **Proposta técnica**, não declaração de competências legais. Matriz inicial
> definida (Fase 5) e editável pela administração.

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

- Advogado
- Agente Administrativo
- Assessor Jurídico
- Assistente Administrativo
- Contador
- Coordenador
- Diretor Administrativo Financeiro
- Diretor Serviços Saúde
- Supervisor(a) Administrativo

O papel de administração técnica **`Administrador`** não é um cargo: é criado
pelo bootstrap seguro e mantido separadamente.

> A administração técnica do sistema (usuários, papéis, permissões, auditoria
> ampla) fica no papel **`Administrador`**, criado por provisionamento seguro
> (bootstrap por variáveis de ambiente, sem senha universal) e **não** derivado
> de cargo. Os papéis derivados de cargos recebem apenas permissões de operação
> do domínio de contratações, conforme a matriz inicial abaixo.

## Permissões (catálogo)

- **Processos:** `processos.read|create|update|cancel|advance|conclude|return|assign|suspend|resume`.
- **Fluxos:** `fluxos.read|create|update|publish|clone|archive|assign`.
- **Cadastros:** `setores.manage`, `cargos.manage`, `tipos-processo.manage`.
- **Acessos:** `usuarios.read|create|update|deactivate`, `roles.read|manage`,
  `permissions.manage`.
- **Auditoria e painel:** `audit.read`, `reports.read`.

Regras de comportamento ligadas a essas permissões:

- `processos.advance` conclui **uma etapa**; `processos.conclude` conclui o
  **processo**. A última etapa concluída deixa o processo em andamento até a
  conclusão explícita por quem possui `processos.conclude`.
- `fluxos.publish` publica uma versão; `fluxos.archive` arquiva. Publicar **não**
  arquiva automaticamente a versão anterior. O arquivamento é bloqueado quando
  há processos em rascunho, em andamento ou suspensos vinculados ao fluxo.
- `fluxos.clone` cria uma nova versão em rascunho; `fluxos.assign` permite
  atribuir um usuário responsável a uma etapa do fluxo (copiado ao criar o
  processo).
- `roles.manage` inclui atribuir/remover permissões de um papel.
  `permissions.manage` é um alias de compatibilidade para a mesma atribuição de
  permissões; ele **não** edita o catálogo. O catálogo é definido pelo código e
  pelo seeder de permissões.
- Na criação de processo, se houver mais de um fluxo publicado do tipo, o
  usuário escolhe explicitamente qual será usado. Havendo apenas um, ele é
  pré-selecionado.
- `processos.assign` permite atribuir responsável ao processo e, isoladamente,
  a cada etapa ainda não concluída/pulada.
- A devolução não está disponível na primeira etapa. Ao concluir novamente a
  etapa devolvida, o processo retorna automaticamente para a etapa que fez a
  devolução.
- O próprio usuário pode alterar nome, e-mail e senha em **Meu perfil**. Quem
  possui `usuarios.update` também pode redefinir a senha de outro usuário; nesse
  caso a troca é exigida no próximo acesso.
- `reports.read` corresponde ao painel e aos indicadores gerenciais. Não existe
  exportação de relatórios: `reports.export`, `processos.export` e
  `processos.supervise` foram removidas por não possuírem funcionalidade
  implementada.

## Matriz inicial papel × permissão

Aplicada pelo seeder `20260101000011-seed-matriz-papeis.cjs` (aditivo e
idempotente; não altera o papel `Administrador`; cargos sem atuação em
contratações ficam sem permissão — negar por padrão). É uma **proposta técnica**
de menor privilégio e separação de funções, **editável** pela administração.
As permissões novas são garantidas pelo seeder
`20260101000013-seed-permissoes-funcionalidades.cjs`.

Legenda: `R`=ler, `C`=criar, `U`=editar, `A`=concluir etapa, `Cc`=concluir
processo, `D`=devolver, `G`=atribuir, `S`=suspender, `Rm`=retomar,
`X`=anular/revogar; fluxos: `P`=publicar, `Cl`=clonar, `Ar`=arquivar,
`Ga`=atribuir responsável; `R` em relatórios = painel/indicadores.

| Papel (cargo) | processos | fluxos | relatórios | admin |
|---|---|---|---|---|
| Administrador | todas | todas | R | usuários, papéis, permissões, auditoria, cadastros |
| Diretor Administrativo Financeiro | R C U A Cc D G S Rm X | R C U P Cl Ar Ga | R | usuarios.read, roles.read, audit.read; setores/cargos/tipos.manage |
| Diretor Serviços Saúde | R C U A Cc D G S Rm | R | R | — |
| Coordenador | R C U A Cc D G S Rm | R Ga | R | — |
| Supervisor(a) Administrativo | R C U A Cc D G | R | R | — |
| Agente Administrativo | R C U A Cc D G | R | — | — |
| Assistente Administrativo | R U A D | R | — | — |
| Advogado | R A D | R | R | — |
| Assessor Jurídico | R A D | R | R | — |
| Contador | R | — | R | — |

Racional resumido:

- **Operação** (Agente/Supervisor): criam e tramitam processos, concluem etapas
  e o processo, sem anular/suspender.
- **Apoio** (Assistente): tramita etapas existentes, mas não conclui o processo.
- **Supervisão** (Coordenador/Diretores): acrescentam suspender, retomar e
  concluir o processo; anular (`processos.cancel`) é reservado à Direção
  administrativo-financeira (função mais sensível).
- **Jurídico** (Advogado/Assessor): analisam e devolvem, não criam nem anulam.
- **Contábil** (Contador): consulta e painel.

## Controle contextual

Além do papel: setor do usuário, setor responsável, responsabilidade na etapa,
situação do processo/etapa, escopo administrativo, permissão específica e
separação de funções. Visualizar ≠ alterar. Menor privilégio. Negar por padrão.

## Pendências

- **Qual autoridade administrativa concede cada papel sensível** (a esclarecer).
- Regras de separação de funções (dupla aprovação, autoconcessão) — configuráveis.
- Matriz inicial aplicada; ajustes finos são feitos pela administração pela tela
  de papéis (permissões agrupadas por módulo).
