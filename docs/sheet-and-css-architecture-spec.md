# Especificação de Arquitetura das Fichas e do CSS

**Status:** aprovada para implementação  
**Escopo:** nomenclatura das fichas, relação entre apresentações e organização modular dos estilos  
**Referência funcional:** `docs/character-sheet-objective.md`

## 1. Propósito

Esta especificação define a arquitetura que deve orientar a evolução das fichas e do CSS do Astrael RPG. Seu objetivo é substituir a organização monolítica atual por uma estrutura segmentada por ficha, aplicação e região funcional, sem alterar regras de jogo ou comportamento durante a migração.

As palavras **deve**, **não deve** e **pode** indicam, respectivamente, requisito obrigatório, proibição e decisão opcional.

## 2. Decisões de produto

### 2.1 Ficha padrão de Personagem

- A apresentação atualmente chamada de ficha compacta passa a ser a ficha padrão de Personagem.
- Seu nome de código deve ser `AstraelCharacterSheet`.
- Seu template principal deve ser `templates/actor/character-sheet.hbs`.
- Sua classe raiz de apresentação deve ser `.astrael-character-sheet`.
- Ela deve ser registrada para o Actor `character` com `makeDefault: true`.
- Termos como `compact`, `Compact` e “compacta” devem ser removidos gradualmente de nomes que descrevam a identidade da ficha. Eles podem permanecer temporariamente em contratos persistidos que exijam migração segura.

### 2.2 Apresentações removidas

- A ficha antiga de Personagem e a ficha de NPC foram removidas durante o desenvolvimento, antes do uso público do sistema.
- O sistema registra somente `AstraelCharacterSheet` como apresentação própria de Actor.
- O tipo de Actor `npc` também foi removido do manifesto e não aparece no diálogo de criação.

### 2.3 Base compartilhada

- Comportamentos da ficha padrão podem permanecer em `AstraelBaseActorSheet` durante a modularização do JavaScript.
- Código exclusivo das apresentações removidas não deve permanecer ativo.

## 3. Arquitetura CSS

### 3.1 Modelo adotado

O projeto adota CSS modular orientado a componentes e funcionalidades:

- pastas por ficha ou aplicação;
- arquivos por região funcional;
- estilos fundamentais compartilhados em `foundations`;
- classes inspiradas em BEM, sem exigir BEM estrito;
- seletores sempre limitados por uma classe raiz do sistema ou da apresentação;
- cascata carregada do mais genérico para o mais específico.

### 3.2 Estrutura de destino

```text
styles/
  foundations/
    tokens.css
    typography.css
    controls.css
    accessibility.css

  character-sheet/
    shell.css
    header.css
    navigation.css
    stats.css
    skills.css
    characteristics.css
    docks.css
    settings.css

  applications/
    portrait-editor.css
    specialties-panel.css
    stranger-marks-panel.css

  chat/
    dice-pool-card.css

  dialogs/
    dice-pool.css
    xp-distribution.css
```

Arquivos para Convicções, Virtudes, Hemomancia e Marca do Estranho devem ser adicionados à ficha padrão quando essas regiões forem migradas. A estrutura pode crescer, mas novas pastas de primeiro nível exigem uma responsabilidade diferente das categorias existentes.

### 3.3 Responsabilidade dos diretórios

- `foundations/` contém tokens, tipografia, controles básicos e regras transversais. Não deve conhecer a estrutura interna de uma ficha.
- `character-sheet/` contém somente a ficha padrão de Personagem.
- `applications/` contém janelas auxiliares baseadas em `ApplicationV2`.
- `chat/` contém cartões e elementos renderizados no chat.
- `dialogs/` contém diálogos que não pertencem exclusivamente a uma ficha.

### 3.4 Limites dos arquivos

- Cada arquivo deve possuir uma responsabilidade visual identificável pelo nome.
- `header.css` não deve conter regras de perícias; `skills.css` não deve estilizar o shell da janela.
- Infraestrutura comum a todos os docks da ficha padrão pertence a `character-sheet/docks.css`; conteúdo específico de um dock permanece no arquivo da funcionalidade correspondente.
- Uma regra deve possuir uma única definição efetiva. Durante a migração, regras substituídas devem ser removidas em vez de copiadas para o final de outro arquivo.
- Um arquivo deve ser dividido quando reunir responsabilidades distintas ou se tornar difícil localizar a origem de uma regra. Tamanho, sozinho, não determina a divisão.

### 3.5 Ordem de carregamento

Os arquivos devem ser declarados explicitamente em `system.json`, nesta ordem:

1. `foundations/`;
2. ficha padrão;
3. aplicações;
4. chat;
5. diálogos.

Dentro de cada ficha, carregar primeiro `shell.css`, depois regiões estruturais e, por último, estados contextuais como docks e configurações. A arquitetura inicial não deve introduzir Sass, bundler ou `@import` como requisito.

## 4. Convenções de seletores

### 4.1 Namespace

Todo componente deve estar protegido por uma raiz apropriada:

```css
.astrael-character-sheet .astrael-character-header {}
```

Estilos fundamentais compartilhados podem usar `.astrael-rpg` como raiz.

### 4.2 Nomenclatura inspirada em BEM

- Blocos e componentes usam nomes kebab-case claros: `.astrael-character-header`.
- Elementos podem usar nomes descritivos simples ou `__` quando isso reduzir ambiguidade: `.astrael-character-header__portrait`.
- Variações estruturais podem usar `--`: `.astrael-character-dock--danger`.
- Estados transitórios continuam usando `is-*` ou `has-*`: `.is-active`, `.is-readonly`, `.has-open-dock`.
- JavaScript deve localizar comportamento por `data-action` e atributos de dados, não por classes puramente visuais.
- IDs e seletores de tags não devem ser usados para aumentar especificidade.
- `!important` só pode permanecer quando necessário para neutralizar estilos do Foundry ou de terceiros e deve receber comentário justificando o motivo.

### 4.3 Tokens

- Cores, tipografia, espaçamentos e medidas reutilizadas devem ser propriedades customizadas em `foundations/tokens.css`.
- Tokens específicos de uma apresentação podem ser declarados em sua raiz, mas não devem vazar para outras fichas.
- Valores repetidos não devem ser transformados em tokens quando não representam uma decisão de design reutilizável.

## 5. Estratégia de migração

### Fase 1 — Identidade e registro

1. Promover a antiga ficha compacta para `AstraelCharacterSheet`.
2. Atualizar template, rótulos, classes raiz e registro.
3. Remover as apresentações antiga e de NPC.
4. Preservar apenas chaves `compact*` que ainda sejam contratos persistidos da ficha padrão.

### Fase 2 — Fundamentos CSS

1. Inventariar tokens e regras realmente compartilhadas.
2. Criar `foundations/` sem alterar aparência.
3. Atualizar a ordem de estilos em `system.json`.
4. Validar a ficha padrão antes de mover componentes.

### Fase 3 — Ficha padrão

1. Mover shell, header e navegação.
2. Mover Estatísticas, Atributos, Perícias e Especialidades.
3. Mover Características e docks.
4. Remover regras antigas e sobrescritas após cada região.
5. Comparar visual e comportamento no Foundry depois de cada etapa.

### Fase 4 — Auxiliares

1. Mover aplicações, chat e diálogos.
2. Remover os arquivos monolíticos somente quando não possuírem regras ativas.

## 6. Compatibilidade e contratos

- A reorganização não deve alterar o schema do Actor nem os caminhos `system.*`.
- `name`, `data-action`, `data-tab`, `data-key` e demais contratos usados por handlers devem ser preservados ou migrados junto com seus consumidores.
- A troca da ficha padrão não deve apagar a escolha explícita de ficha feita pelo usuário quando o Foundry puder preservá-la.
- Chaves de configuração `compact*` não devem ser renomeadas sem migração ou alias, pois armazenam preferências de cliente e flags existentes.
- Português e inglês devem ser atualizados juntos para todo nome apresentado ao usuário.

## 7. Critérios de aceitação

A migração arquitetural estará concluída quando:

- a ficha atual compacta estiver registrada e apresentada como ficha padrão;
- as apresentações antiga e de NPC não estiverem registradas nem possuírem templates ou estilos ativos;
- os estilos ativos estiverem distribuídos conforme a estrutura definida;
- não houver regressão visual intencional causada apenas pela movimentação de CSS;
- não houver regras duplicadas entre os arquivos antigos e os novos;
- `system.json`, JavaScript e ambos os idiomas forem válidos;
- as chaves de localização de português e inglês estiverem sincronizadas;
- `git diff --check` não apresentar erros;
- forem testados no Foundry VTT v14: abertura da ficha padrão, troca de abas, edição de campos, atributos, recursos, rolagens e docks.

## 8. Fora do escopo

Esta especificação não determina:

- mudança das regras do Astrael RPG;
- alteração do schema de dados;
- adoção de framework CSS, Sass, PostCSS ou bundler;
- modularização completa do JavaScript, exceto a separação mínima necessária para impedir herança da ficha legada.

Mudanças nesses pontos exigem especificação ou decisão própria.
