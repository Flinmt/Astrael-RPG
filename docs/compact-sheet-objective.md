# Objetivo da Nova Ficha Compacta

## Propósito deste documento

Este documento orienta futuras sessões de desenvolvimento do Astrael RPG. Antes de alterar a ficha de Personagem ou NPC, releia estas decisões para evitar que a interface volte a crescer ou que a lógica existente seja reescrita sem necessidade.

## Objetivo principal

Remodelar a ficha de Personagem para uma interface compacta, densa e adequada a um jogo digital. A marcação vermelha em `image.png`, na raiz do projeto, representa a dimensão visual desejada: aproximadamente **440 × 570 px** em comparação com a ficha atual.

O objetivo não é simplesmente reduzir o CSS da ficha existente. Cada região deve ser redesenhada para funcionar nessa escala, mantendo leitura, acesso rápido às ações e identidade visual de dossiê do Astrael RPG.

## Decisão de arquitetura

Criar uma **nova apresentação da ficha**, preservando o Actor, os modelos de dados e a lógica de jogo atuais.

- Não criar outro tipo de Actor.
- Não duplicar atributos, recursos ou regras no modelo de dados.
- Reutilizar cálculos, rolagens, macros, atualizações e localização existentes.
- Preservar, sempre que possível, atributos como `name`, `data-action`, `data-tab` e demais contratos usados pelos event handlers.
- Construir templates compactos e CSS com namespace próprio, evitando acumular remendos sobre o layout legado.
- Manter a ficha antiga disponível durante a migração e removê-la somente após a nova atingir paridade funcional.

As alterações visuais atualmente não commitadas na ficha antiga são experimentos. Elas podem fornecer ideias, mas não devem limitar a arquitetura da nova ficha.

## Direção visual

- Janela-alvo próxima de 440 × 570 px.
- Navegação lateral com botões circulares de ícone, parcialmente posicionados atrás da borda esquerda da ficha.
- Abas sem expansão textual; usar tooltip e estados claros de hover, foco e seleção.
- Cabeçalho baixo, com identidade, retrato, experiência e recursos reorganizados.
- Espaçamento, tipografia e decoração mais econômicos, sem sacrificar legibilidade.
- Corpo rolável, com alta densidade de informação e hierarquia visual clara.
- Interfaces extensas devem usar listas compactas, seções recolhíveis, diálogos ou painéis auxiliares em vez de forçar tudo na tela principal.

## Ordem de implementação

1. Criar a estrutura da nova ficha e a alternância temporária entre layout legado e compacto.
2. Implementar dimensões, navegação e estrutura de rolagem.
3. Remodelar cabeçalho, retrato, experiência e recursos.
4. Migrar Atributos e Perícias.
5. Migrar Vantagens e Convicções.
6. Migrar Virtudes, Hemomancia e Marca do Estranho.
7. Migrar Configurações e validar paridade funcional.
8. Aplicar a mesma linguagem à ficha de NPC e, depois, ao criador de NPC.
9. Tornar o layout compacto padrão e remover o legado apenas após aprovação.

## Critérios de sucesso

A remodelação estará concluída quando a ficha compacta operar na dimensão-alvo, todas as ações da ficha anterior continuarem funcionando, português e inglês permanecerem legíveis e os fluxos principais forem validados manualmente no Foundry VTT v14 para Personagem e NPC.
