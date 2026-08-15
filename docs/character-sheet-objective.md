# Ficha de Personagem — Objetivo e Estado Atual

## Propósito deste documento

Este documento é a fonte de contexto para futuras sessões de desenvolvimento da nova ficha de Personagem do Astrael RPG. Antes de alterar a ficha padrão, releia estas decisões para preservar sua arquitetura, linguagem visual e contratos de interação.

## Objetivo e arquitetura

A nova ficha é uma apresentação densa, pensada como uma interface de videogame inspirada em **Dishonored**: metal envelhecido, bronze moderno, superfícies escuras, tipografia legível e composição de dossiê ocultista. Ela não deve assumir aparência de ficção científica espacial nem copiar visualmente a ficha legada.

- A ficha padrão reutiliza o mesmo Actor, modelo de dados e regras da ficha antiga.
- Não duplicar atributos, recursos ou lógica de jogo.
- Reutilizar cálculos, rolagens, macros, atualizações e localização existentes.
- Preservar contratos como `name`, `data-action`, `data-tab` e chaves de dados sempre que possível.
- Manter template e CSS próprios, com seletores sob `.astrael-character-sheet`.
- Manter a ficha legada disponível até a ficha padrão alcançar paridade funcional.
- Não incorporar à ficha padrão alterações experimentais feitas na ficha legada.

## Estrutura e direção visual consolidadas

- Janela fixa de **560 × 720 px**, sem redimensionamento manual.
- Navbar flutuante fora da lateral esquerda, vertical, transparente e sem trilho conectando a aba ativa à ficha.
- Botões circulares com ícones, acabamento escuro e bronze; apenas o estado ativo recebe destaque.
- O antigo controle de recolher o header foi removido. O header permanece visível em todas as abas.
- Conteúdo interno usa uma escala ligeiramente maior que a proposta inicial, priorizando leitura sem abandonar a densidade.
- O rótulo da primeira aba é **Estatísticas** em português e **Stats** em inglês; o identificador técnico continua `attributes`.
- Listas longas usam `overflow-y` sem scrollbar visível.
- Editores contextuais surgem como painéis dockados na base da ficha, com animação de baixo para cima. Apenas um dock deve competir pela área inferior por vez.
- Ao abrir um dock, o restante da ficha entra em estado de foco: fica escurecido e inerte para mouse e teclado até o dock ser fechado. Tooltips não ativam esse estado.

## Funcionalidades concluídas

### Header e retrato

- Header global com retrato, nome, Pontos de Vida e Força de Vontade.
- Retrato em moldura retangular de **88 × 112 px**, com o botão de visualização completa sobre o canto superior direito.
- O retrato suporta enquadramento próprio: zoom de 1× a 3× e reposicionamento por arraste, persistidos em `flags.astrael-rpg.compactPortrait`.
- A imagem escolhida no editor atualiza `actor.img`; o enquadramento é reiniciado quando a origem da imagem muda.
- O diretório de Atores usa a imagem do token protótipo quando ela é estática e se atualiza após mudanças em `prototypeToken.texture.src` ou `prototypeToken.randomImg`.
- A visualização completa não usa `ImagePopout`. A ficha entra em um modo temporário de visualizador, independente da aba ativa.
- Nesse modo, o chrome nativo, navbar e conteúdo comum são ocultados. Uma barra própria exibe o nome e o botão **Voltar à ficha**.
- A arte usa `contain` dentro de um palco escuro e emoldurado, mostrando a imagem inteira sem deformação. O botão ou `Escape` retornam à ficha e preservam aba e docks anteriores.

### Vida e Força de Vontade

- Toda a área de cada recurso aceita os controles de dano, não apenas as caixas individuais.
- Clique esquerdo recupera dano, clique direito aplica dano superficial e `Shift + clique direito` aplica dano agravado.
- Um tooltip global explica os controles em qualquer aba e aparece como dock na base.
- O tooltip não aparece enquanto um dock de perícia, especialidade ou característica estiver ativo.
- A opção **Não mostrar novamente** é uma preferência por jogador (`scope: client`). Quando desativado, o tooltip e os ícones de alerta em Vida e Vontade desaparecem.
- A reativação não existe no header; será adicionada futuramente na aba Configurações.

### Estatísticas: atributos

- Uma faixa somente leitura entre o header e os Atributos apresenta Iniciativa, Armadura e Movimento com ícones, nomes completos e valores.
- Iniciativa é calculada como Destreza + Astúcia; Armadura permanece em 0 e Movimento em 6 células até que suas regras sejam expandidas.
- Nove atributos organizados em três colunas verticais: físicos, sociais e mentais.
- As categorias não possuem título textual; são diferenciadas por marcadores de cor discretos.
- Cada atributo usa um mostrador circular segmentado de nível 1 a 5, com ação de rolagem integrada.
- A região ocupa toda a largura disponível e encosta no header, sem margem vertical intermediária.
- A seção possui título discreto e pode ser recolhida ou expandida pela seta no extremo direito.
- O estado recolhido é uma preferência do cliente.

### Estatísticas: perícias e especialidades

- Perícias em nível 0 não são exibidas.
- A lista possui uma única coluna, ordenada alfabeticamente; cada card ocupa toda a largura.
- Cards exibem nome, cinco marcadores de nível, acesso às especialidades e edição por ícone de lápis.
- **Adicionar perícia** abre um editor dockado para selecionar uma perícia ainda ausente e definir nível de 1 a 5.
- Editar reutiliza o mesmo dock; salvar, cancelar e remover têm estados e cores distintos. `Escape` cancela ou retorna do estado de remoção.
- Cada perícia aceita zero ou mais especialidades, armazenadas na lista existente `system.specialties`.
- O botão do card abre um dock inferior com as especialidades daquela perícia. Nomes são adicionados no próprio dock e podem ser removidos individualmente; não há ícones por especialidade.

### Características

- A aba Características reutiliza a filosofia de cards e docks das perícias.
- Possui dois modos: **Vantagens** e **Desvantagens**, com contadores e alternador segmentado.
- Vantagens usam bronze/dourado; Desvantagens usam cobre oxidado/bordô, sem fugir da paleta geral.
- Ambas usam os dados existentes `system.advantages` e `system.flaws`.
- Cada entrada possui nome obrigatório, descrição opcional e nível de 1 a 5.
- Listas são ordenadas alfabeticamente para exibição, preservando o índice original para atualizações.
- Cards abrem um inspetor dockado. Proprietários podem adicionar, editar e remover; campos desconhecidos do objeto são preservados durante a edição.
- Apenas Vantagens expõem a rolagem existente de `advantage`; Desvantagens não rolam.
- A interface respeita modo somente leitura e oferece navegação por foco e `Escape`.

## Estado da migração

1. Base, dimensões e navegação: **concluídas**.
2. Header, recursos e retrato: **concluídos**.
3. Estatísticas, perícias e especialidades: **concluídas**.
4. Características — Vantagens e Desvantagens: **concluídas**.
5. Convicções: **pendente**.
6. Virtudes: **pendente**.
7. Hemomancia: **pendente**.
8. Marca do Estranho: **pendente**.
9. Configurações, incluindo reativação do tooltip: **pendente**.
10. Paridade funcional, ficha de NPC e criador de NPC: **pendentes**.

## Critérios permanentes de implementação

- Manter português e inglês sincronizados; não embutir novos textos de interface no template.
- Preservar a ficha legada e os dados existentes enquanto a migração estiver incompleta.
- Priorizar legibilidade, alvos clicáveis claros e hierarquia compacta.
- Não abrir popups quando a interação puder ser resolvida por expansão inline ou dock inferior coerente.
- Um tooltip de recurso nunca deve cobrir ou competir com outro dock ativo.
- Validar JavaScript, manifesto, JSON dos dois idiomas, estrutura Handlebars e `git diff --check` após alterações.
- Fazer smoke test no Foundry VTT v14 das abas e fluxos afetados antes de considerar um módulo concluído.
