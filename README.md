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

### Fluxo de branches

O checkout deste diretorio permanece na branch `develop`, que alimenta diretamente
o Foundry em Docker. Desenvolva e valide mudancas nela com `npm run validate` e um
teste manual no Foundry.

Releases seguem este fluxo:

1. Prepare a versao em `develop`, incluindo versao, manifesto e compendios.
2. Abra um pull request de `develop` para `main`.
3. Depois do merge, atualize o worktree de release:
   `git -C ../Astrael-RPG-main pull --ff-only origin main`.
4. Crie a tag `vX.Y.Z` e a GitHub Release somente a partir de `main`.

O diretorio `../Astrael-RPG-main` e exclusivo para releases e nao e montado no
Foundry.

## Compendios

Os arquivos em `packs/<nome>/` sao bancos LevelDB gerados e nao devem ser
versionados. As fontes versionadas ficam em `packs/_source/<nome>/`.

Os compendios de Armas, Armaduras, Caracteristicas e Itens iniciam vazios e sao
o local para cadastrar conteudo pronto para uso dos jogadores.

Instale as dependencias de desenvolvimento com `npm install`. Com o Foundry
parado, reconstrua ou exporte o pack:

```bash
npm run pack:build
npm run pack:unpack
```

Use `pack:build` depois de clonar o repositorio. Use `pack:unpack` para promover
alteracoes feitas no compendio pelo Foundry para os arquivos JSON versionados.
Os comandos aceitam opcionalmente um nome de pack: `node tools/foundry-pack.cjs pack weapons`.
