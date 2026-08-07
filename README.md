# Astrael RPG

Sistema em desenvolvimento para Foundry Virtual Tabletop, criado para o cenario/universo Astrael.

Esta primeira versao e uma base em branco para validar instalacao e carregamento no Foundry VTT v14 build 363.

## Desenvolvimento

Nome interno do sistema: `astrael-rpg`.

Para testar no Foundry futuramente, copie ou vincule esta pasta para:

```text
FoundryVTT/Data/systems/astrael-rpg
```

Depois crie um mundo novo usando o sistema `Astrael RPG`.

## Compendios

Os arquivos em `packs/gm-macros/` sao um banco LevelDB gerado e nao devem ser
versionados. A fonte dos macros fica em `packs/_source/gm-macros/`.

Instale as dependencias de desenvolvimento com `npm install`. Com o Foundry
parado, reconstrua ou exporte o pack:

```bash
tools/foundry-pack.sh pack
tools/foundry-pack.sh unpack
```

Use `pack` depois de clonar o repositorio. Use `unpack` para promover alteracoes
feitas no compendio pelo Foundry para os arquivos JSON versionados.
