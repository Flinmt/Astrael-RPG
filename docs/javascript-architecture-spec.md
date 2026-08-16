# Especificação de Arquitetura JavaScript

**Status:** aprovada para implementação  
**Escopo:** módulos de dados, regras, aplicações, fichas e hooks do sistema

## 1. Objetivo

O JavaScript do Astrael RPG deve ser organizado por responsabilidade sem alterar regras, dados persistidos ou contratos do Foundry VTT v14. `scripts/astrael-rpg.js` permanece como a única entrada declarada em `system.json` e importa os demais módulos ES por caminhos relativos.

## 2. Camadas e dependências

```text
core -> data/rules -> applications/controllers -> sheets -> hooks/bootstrap
```

- `core/` contém constantes, utilitários e contratos sem dependência de UI.
- `data/` contém `TypeDataModel`, schema e migrações.
- `rules/` contém cálculos e normalizações puras por domínio.
- `chat/` contém preparação e publicação de mensagens e rolagens.
- `applications/` contém janelas auxiliares `ApplicationV2` completas.
- `sheets/` contém as apresentações de documentos e seus controladores funcionais.
- `hooks/` registra integrações com o ciclo de vida do Foundry.
- Uma camada não deve importar uma camada posterior. Acesso a `game`, `CONFIG`, `ui`, DOM e documentos Foundry deve permanecer nas bordas da aplicação.

## 3. Limites dos módulos

- Cada módulo possui uma responsabilidade identificável pelo nome; tamanho isolado não determina uma divisão.
- Regras substituídas são removidas do arquivo de origem no mesmo passo, sem duas fontes de verdade.
- Módulos usam exports nomeados e extensões `.js` explícitas.
- Não usar globals novos, alteração de prototype, mixins improvisados, bundler ou `@import` dinâmico.
- Contratos persistidos `system.*`, flags e settings `compact*` não podem ser renomeados sem migração.
- Handlers continuam ligados por `data-action` e atributos de dados, não por classes visuais.

## 4. Controladores da ficha

A ficha coordena funcionalidades, mas não concentra sua implementação. Cada controlador mantém seu estado transitório e pode implementar, conforme necessário:

- `prepareContext(context)` para enriquecer o contexto do template;
- `activateListeners(root)` para registrar interações de sua região;
- `handleEscape(event)` para consumir fechamento contextual;
- `close()` para limpar docks e rascunhos;
- `destroy()` para timers, aplicações auxiliares e demais recursos.

O coordenador da ficha garante apenas um dock ativo, restauração de foco e fechamento ordenado. Dados persistentes permanecem no Actor, flags ou settings existentes.

## 5. Entrada e inicialização

- `scripts/astrael-rpg.js` importa o registrador de hooks, executa-o e exporta `SYSTEM_ID`.
- Registros `init`, `ready`, `renderApplicationV2` e `updateActor` ficam explícitos em `hooks/` e preservam sua ordem atual.
- Classes que dependem dos globals do Foundry podem acessá-los durante o carregamento do sistema; módulos de regras testáveis não devem acessá-los ao importar.

## 6. Validação

- `npm run validate` verifica recursivamente todos os módulos, imports locais, localizações, templates, CSS e testes Node.
- Regras puras recebem testes de caracterização com `node:test`, sem dependências adicionais.
- Cada migração funcional exige smoke test no Foundry v14 antes da remoção definitiva do código anterior.
