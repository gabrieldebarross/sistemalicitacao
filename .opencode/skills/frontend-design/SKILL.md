---
name: Design de Frontend
description: Use ao criar ou revisar telas, componentes, layout, design system, formulários, tabelas, estados e acessibilidade do frontend administrativo. Orienta uma interface profissional, consistente, responsiva e acessível.
---

# Skill: Design de Frontend

Objetivo: interface administrativa profissional, funcional, consistente e
acessível, que transmita organização e confiabilidade. Evitar aparência de
template genérico de dashboard.

## Design system

Definir e usar tokens para: cores semânticas (sucesso, alerta, erro, informação,
neutros), tipografia, espaçamento, bordas, elevação, raios, tamanhos de
componentes e estados de interação. Cores de status com significado consistente
e **nunca** como único portador de informação (usar texto/ícone também).

## Layout

- Sidebar com navegação por módulos (respeitando permissões de UI).
- Cabeçalho contextual (título da página, breadcrumbs quando úteis, usuário,
  seletor de setor quando aplicável).
- Área principal com hierarquia visual clara.
- Estados de carregamento (skeleton/spinner), vazio e de erro.
- Responsividade para telas menores.

## Tabelas administrativas

Colunas priorizadas, ordenação permitida, filtros validados, busca, paginação no
servidor, ações por linha, seleção em massa apenas quando necessário, densidade
adequada e feedback de operações.

## Formulários

- React Hook Form + Zod; labels associados; mensagens de erro acessíveis.
- Validação inline clara; preservar entrada do usuário em erro.
- Estados de submissão (desabilitar, indicar progresso).
- Confirmar antes de descartar alterações não salvas quando relevante.

## Operações críticas

Cancelamento, anulação, revogação, suspensão e alteração de permissões:
- Confirmação explícita e proporcional ao risco.
- Justificativa quando a política exigir.
- Evitar ação destrutiva por clique acidental.
- **Nunca** simular sucesso antes da resposta do servidor; exibir o resultado real.
- Autorização sempre validada no backend (a UI não é autoridade).

## Acessibilidade (obrigatória)

- Navegação completa por teclado; foco visível.
- Labels e descrições em campos; semântica HTML correta (headings, tabelas, botões).
- Contraste adequado (WCAG AA).
- Mensagens de validação associadas (`aria-describedby`, `aria-live` quando útil).
- Estados de interação claros; alvos de toque adequados.
- Respeitar `prefers-reduced-motion`.

## Modais e drawers

Usar apenas quando apropriado (confirmação, formulário curto, detalhes). Preferir
página dedicada para formulários longos. Gerenciar foco e `Esc` corretamente.

## Evitar

Interfaces genéricas, excesso de cartões, gradientes decorativos, animações
desnecessárias, dashboards visualmente poluídos e botões sem função real.
