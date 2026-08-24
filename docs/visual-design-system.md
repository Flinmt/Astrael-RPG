# Sistema Visual do Astrael RPG

**Status:** aprovado para novas interfaces
**Referência visual:** ficha padrão de Personagem

## 1. Direção

As interfaces do Astrael RPG seguem a linguagem de um dossiê ocultista inspirado em **Dishonored**: superfícies escuras, metal envelhecido, bronze contido, osso, detalhes oxidados e hierarquia compacta. A interface deve parecer construída e funcional, não ornamentada sem propósito.

A ficha de Personagem existente é a referência consolidada e não precisa ser refatorada para consumir os componentes descritos aqui. Novas fichas, aplicações, diálogos e cartões adotam o padrão gradualmente.

## 2. Hierarquia visual

- **Shell:** superfície mais escura da janela, sem transparência excessiva.
- **Moldura:** linha estrutural fina, segunda linha interna discreta e um único acento de bronze.
- **Cabeçalho:** identifica o documento e concentra imagem, nome e estatística principal.
- **Painéis:** agrupam uma única responsabilidade e usam contraste por superfície, não por sombras pesadas.
- **Estados:** vermelho indica pendência ou perigo; azul oxidado diferencia informação secundária; bronze indica informação importante ou ação primária.

## 3. Tipografia

- `Inter` é usada para leitura, formulários e valores comuns.
- `Cinzel` é reservada para títulos e nomes de seções.
- `IBM Plex Mono` é usada em kickers, rótulos técnicos, estados e botões.
- Textos em caixa alta devem ser curtos e receber espaçamento entre letras.
- Descrições longas permanecem em caixa normal e priorizam legibilidade.

## 4. Componentes compartilhados

Componentes fundamentais usam a raiz `.astrael-rpg` e o prefixo `.astrael-ui-`:

- `.astrael-ui-frame`: moldura externa de uma interface;
- `.astrael-ui-panel`: superfície interna agrupadora;
- `.astrael-ui-kicker`, `.astrael-ui-title`, `.astrael-ui-section-title` e `.astrael-ui-label`: papéis tipográficos;
- `.astrael-ui-field`: campo integrado à superfície, com estado `.is-invalid`;
- `.astrael-ui-status`: selo compacto de estado;
- `.astrael-ui-property-strip` e `.astrael-ui-property-tag`: faixa de palavras-chave oficiais;
- `.astrael-ui-property-tooltip`: definição contextual de uma propriedade informativa;
- `.astrael-ui-actions`: agrupamento de ações persistentes.

Essas classes são exclusivamente visuais. JavaScript continua usando `data-action` e atributos de dados para localizar comportamento.

## 5. Interação e acessibilidade

- Foco por teclado deve permanecer visível, com contorno externo que não altere o layout.
- Cor nunca é o único indicador de erro ou estado.
- Campos inválidos usam `aria-invalid` e recebem texto contextual próximo.
- Etiquetas informativas expõem sua definição em `hover` e foco. Quando uma etiqueta editável é removida, seu espaço pode receber um seletor pesquisável inline sem persistir a alteração imediatamente.
- Alvos interativos mantêm dimensões confortáveis e estados de hover, foco e desabilitado distintos.
- Animações são opcionais; quando existirem, devem respeitar `prefers-reduced-motion`.
- Interfaces fixas devem usar rolagem apenas na região de conteúdo, preservando cabeçalho e ações.

## 6. Limites de adoção

- Não copiar regras de uma ficha para outra; extrair somente decisões realmente reutilizáveis.
- Não alterar valores de tokens existentes quando isso provocar regressão em interfaces consolidadas.
- Regras específicas permanecem no arquivo da ficha ou aplicação consumidora.
- A ficha de Personagem permanece intacta até que uma mudança própria seja explicitamente planejada.
