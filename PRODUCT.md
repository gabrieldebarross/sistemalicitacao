# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Equipe interna de uma autarquia municipal responsável por licitações e contratações públicas, com prioridade para o uso operacional diário. Gestores e supervisão também usam o sistema para acompanhar prazos, indicadores, auditoria e atribuições. O uso principal ocorre em desktop, em ambiente de escritório, com sessões longas e alta densidade de informação.

## Product Purpose

O TramitaY centraliza processos de licitação e contratação pública, padroniza fluxos de trabalho, registra movimentações, controla responsáveis e prazos internos e oferece indicadores gerenciais. O sucesso significa localizar processos, compreender a etapa atual e executar a próxima ação com segurança, rastreabilidade e pouca fricção.

## Positioning

É uma ferramenta de gestão e acompanhamento, não um substituto de análise jurídica, sistemas oficiais de publicação ou decisão administrativa. Seu diferencial é reunir o fluxo operacional, a responsabilidade e a trilha de auditoria em uma única interface institucional.

## Operating Context

- Uso por servidores em desktop, com navegação frequente entre listas, detalhe de processo, tarefas, usuários e auditoria.
- Processos seguem fluxos configuráveis por tipo, com fases, etapas obrigatórias e opcionais, prazos internos e devolução.
- Operações críticas exigem autorização no backend, justificativa quando aplicável e registro de auditoria.
- Dados e terminologia são institucionais e jurídico-administrativos; a interface não deve inventar obrigações legais.
- Autenticação inclui senha provisória, bloqueio por tentativas, sessões revogáveis e MFA para contas administrativas.

## Capabilities and Constraints

- Cadastros de setores, cargos, tipos de processo, fluxos, fases e etapas.
- Criação, movimentação, atribuição, bloqueio, devolução, suspensão e conclusão de processos.
- Minhas tarefas, filtros avançados, visões salvas e indicadores gerenciais.
- Administração de usuários, papéis, permissões, sessões, desbloqueio e reset de MFA.
- A funcionalidade de delegações não faz parte do produto.
- Toda autorização é aplicada no backend; a interface nunca é a fonte final de permissão.
- O sistema deve funcionar em desktop e adaptar-se a telas menores sem perder funções essenciais.

## Brand Commitments

- Nome do produto: **TramitaY**.
- Idioma da interface: português brasileiro.
- Tom institucional, confiável, direto e operacional. Sem linguagem publicitária, gamificação ou promessas jurídicas.
- O nome deve aparecer no login, shell da aplicação, metadados, documentação e issuer de MFA.

## Evidence on Hand

- Código e documentação existentes descrevem o domínio, RBAC, workflows, segurança e modelo de dados.
- Não há logotipo ou banco de imagens próprio; a identidade visual será criada nesta entrega.
- Não inventar métricas, clientes, cases, certificações ou conformidade legal não verificada.

## Product Principles

1. A tarefa vem antes da decoração: a interface deve desaparecer no fluxo de trabalho.
2. Densidade com legibilidade: exibir o que a operação precisa sem esconder estados e prazos.
3. Segurança visível: ações críticas, sessões e permissões comunicadas com clareza.
4. Consistência institucional: mesmos padrões de navegação, formulários, tabelas e mensagens em todas as telas.
5. Rastreabilidade: toda mudança relevante deve ser compreensível e auditável.

## Accessibility & Inclusion

WCAG 2.1 AA como requisito: contraste adequado, navegação por teclado, foco visível, semântica, labels, mensagens acessíveis, alvos de toque adequados e respeito à redução de movimento.
