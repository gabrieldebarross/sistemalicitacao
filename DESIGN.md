# DESIGN.md — Sistema visual do TramitaY

Este documento registra as decisões visuais da interface administrativa do
TramitaY. Ele complementa o `PRODUCT.md` e deve ser consultado antes de criar ou
alterar telas.

## Direção

**Malha cívica.** A interface combina a solidez institucional de uma autarquia
com a lógica visual de uma rota de tramitação: tinta petróleo, papel quente,
laranja de sinal e linhas discretas que organizam o conteúdo. O resultado deve
parecer uma ferramenta de trabalho pública, não um produto de consumo.

- **Modo principal:** Operate. Densidade alta, leitura rápida e ações previsíveis.
- **Prioridade:** desktop operacional; telas menores preservam as funções
  essenciais sem esconder estados.
- **Tom:** institucional, direto, sóbrio e confiável.

## Marca

- Nome: **TramitaY**.
- Símbolo: quadrado arredondado laranja com uma rota contínua em tinta.
- Assinatura: `TramitaY` em branco ou tinta, com o descritor
  `Gestão de licitações`.
- A marca aparece no login, no shell, no favicon/metadados e na documentação.
- O issuer de MFA usa `TramitaY`.
- Não distorcer, recolorir fora da paleta ou usar a marca como decoração de
  fundo.

## Tokens de cor

Definidos em `frontend/src/app/globals.css` no bloco `@theme`.

| Token | Uso |
| --- | --- |
| `papel-50` `#fbf9f5` | Fundo principal da aplicação |
| `papel-100` `#f4f0e8` | Superfícies secundárias, cabeçalhos de tabela |
| `papel-200` `#ebe4d8` | Divisores suaves e realces |
| `linha-100` `#e8e1d5` | Bordas decorativas e esqueletos |
| `linha-200` `#d8cfbf` | Bordas de cartões e divisores |
| `linha-300` `#9b8f7c` | Bordas de controles e foco de entrada |
| `tinta-950` `#0c2631` | Sidebar, títulos e texto principal |
| `tinta-900` `#18343f` | Texto de corpo forte |
| `tinta-800` `#29424c` | Texto de controles e labels |
| `tinta-600` `#465e65` | Texto secundário e descrições |
| `tinta-500` `#566c72` | Texto auxiliar com contraste AA |
| `rota-700` `#1d5851` | Ação primária e foco |
| `rota-600` `#226c63` | Foco visível e estados interativos |
| `rota-50/100` | Fundos informativos |
| `sinal-500` `#dc7a22` | Marca, destaque e sinalização |
| `sinal-300` | Ícones e detalhes sobre fundo escuro |
| `red-*`, `amber-*`, `emerald-*` | Erro, atenção e sucesso |

Regras:

- Texto normal nunca abaixo de `tinta-500` sobre `papel-50` ou branco.
- A cor nunca é o único indicador de estado; sempre acompanhar rótulo, ícone ou
  texto.
- Ações primárias usam `rota-700`; laranja é sinalização, não cor padrão de
  botão.
- Vermelho é reservado a erro, exclusão e risco.

## Tipografia

- Família: `Segoe UI`, `Public Sans`, `Helvetica Neue`, Arial, sans-serif.
- Números tabulares em tabelas, prazos, processos e indicadores.
- Título de página: `1.65rem`, semibold, tracking `-0.02em`.
- Título de cartão: `0.95rem`, semibold.
- Corpo: `0.875rem`, linha `1.5–1.65`.
- Rótulo de campo: `0.8rem`, semibold.
- Metadados: `0.7–0.75rem`, com tracking em caixa alta apenas quando funcional.
- Não usar mais de três tamanhos de título na mesma tela.

## Layout e shell

- Sidebar escura fixa em `tinta-950`, com grupos:
  **Operação**, **Cadastros**, **Administração** e **Conta**.
- Largura expandida: `17rem`; recolhida: `4.75rem`.
- A preferência do menu é persistida em `localStorage` (`tramitay:menu-recolhido`).
- Quando recolhida, os itens exibem ícone, `title` e `aria-label`.
- Cabeçalho contextual com nome da seção, usuário, papel e ação de sair.
- Conteúdo em `max-width: 96rem`, com respiro de `1.75rem` em desktop.
- Em telas menores, a navegação vira gaveta modal com fechamento por `Esc`,
  clique no fundo ou no botão de fechar.
- O primeiro elemento focável é o atalho “Ir para o conteúdo”.

## Componentes

### Botões

- Altura mínima de 36 px.
- Primário: `rota-700`, texto branco.
- Secundário: branco, borda `linha-300`.
- Perigo: vermelho.
- Sutil: sem borda, para ações de baixa ênfase.
- Sempre com `focus-visible` de 2 px e deslocamento.
- Ícones decorativos recebem `aria-hidden`.

### Campos

- Label sempre visível e associado por `htmlFor`.
- Altura confortável, borda `linha-300` e fundo branco.
- Foco em `rota-600` com anel translúcido.
- Erro exibido abaixo do campo com `role="alert"`.
- Texto de ajuda não substitui mensagem de erro.
- Datas têm largura mínima para não colapsar em grids.

### Cartões

- Raio `1rem`, borda `linha-200`, fundo branco.
- Cabeçalho com fundo `papel-50` e divisória.
- Evitar sombras pesadas; a hierarquia vem de borda, espaçamento e tipografia.

### Etiquetas de estado

- Formato pílula com ponto e texto.
- Tons: neutro, informação, sucesso, atenção e perigo.
- O texto deve ser compreensível sem depender da cor.

### Tabelas

- Cabeçalho em caixa alta, `tinta-600`, fundo `papel-50`.
- Números alinhados com `tabular-nums`.
- Hover discreto em `papel-50`.
- Ações destrutivas nunca são apenas um ícone sem nome acessível.

### Filtros

- Painel com título “Filtros” e ação “Limpar filtros”.
- Grid responsivo de 12 colunas em desktop:
  busca ampla, seleções e datas em colunas estáveis.
- Cada controle tem label visível; `aria-label` é complemento, não substituto.
- Evitar `max-w-*` aleatório em campos dentro do mesmo grid.
- Visões salvas ficam em uma faixa separada, abaixo dos filtros.

### Estados

- Carregamento: indicador com `role="status"` e texto.
- Vazio: ícone, título, explicação e ação quando houver.
- Erro: alerta com ícone, mensagem clara e sem detalhes internos.
- Sucesso: confirmação após resposta do servidor; nunca simular antes.

## Movimento

- Transições curtas (120–200 ms) para cor, borda e largura da sidebar.
- Sem animações de entrada repetitivas em telas operacionais.
- `prefers-reduced-motion` reduz animações e transições.
- A sidebar recolhe por largura, sem deslocar o conteúdo de forma abrupta.

## Acessibilidade — WCAG 2.1 AA

- Contraste mínimo 4.5:1 para texto e 3:1 para componentes.
- Foco visível em todos os controles, inclusive links e itens de navegação.
- Navegação completa por teclado; gaveta fecha com `Esc`.
- `aria-current="page"` no item ativo da navegação.
- Modais com `role="dialog"`, `aria-modal`, título associado e fechamento por
  `Esc`.
- Mensagens de erro e sucesso com regiões vivas apropriadas.
- Não usar placeholders como único rótulo.
- Alvos de toque com pelo menos 36 px de altura.
- Respeitar redução de movimento e zoom de até 200% sem perda de função.

## Responsividade

- Desktop: sidebar fixa, filtros em 12 colunas, tabelas com rolagem horizontal
  quando necessário.
- Tablet: sidebar em gaveta, filtros em 2 colunas, cartões empilhados.
- Mobile: uma coluna, ações principais visíveis, tabelas sem quebra de layout.
- Nunca esconder informação crítica apenas para “caber”; usar rolagem ou
  reorganização.

## Conteúdo e microcopy

- Frases curtas, no imperativo, orientadas à tarefa.
- “Salvar”, “Cancelar”, “Concluir etapa”, “Devolver etapa”, “Sair”.
- Explicar consequências antes de ações críticas.
- Não prometer conformidade legal, prazo legal ou resultado administrativo.
- Erros devem dizer o que aconteceu e o que fazer, sem expor stack, SQL ou
  caminhos internos.

## Implementação

- Tokens e estilos globais: `frontend/src/app/globals.css`.
- Componentes base: `frontend/src/components/ui.tsx`.
- Marca: `frontend/src/components/brand.tsx`.
- Shell e navegação: `frontend/src/components/app-shell.tsx`.
- Login: `frontend/src/app/login/page.tsx`.
- Ao criar uma tela, reutilize os componentes existentes antes de adicionar
  classes ou padrões novos.
