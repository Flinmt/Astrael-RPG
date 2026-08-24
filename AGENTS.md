# Astrael RPG Agent Guide

## Runtime And Structure

- This is a Foundry VTT v14 system. `system.json` is the manifest, registers the sole entrypoint (`scripts/astrael-rpg.js`), and explicitly loads every stylesheet and locale.
- Foundry loads native ES modules directly; there is no bundler. Use named exports and explicit `.js` extensions.
- Keep JavaScript dependencies flowing `core -> data/rules -> applications/controllers -> sheets -> hooks/bootstrap`. Pure rules must not access Foundry globals at import time; access to `game`, `CONFIG`, `ui`, DOM, and documents belongs at application edges.
- The registered document types are Actor `character` and Items `trait`, `weapon`, and `item`. Do not restore deprecated Actor types such as `pdm`.
- `system.*`, `flags`, and client settings named `compact*` are persisted contracts. Do not rename them without a migration.
- Bind UI behavior through `data-action` and data attributes, not visual CSS classes.

## Sheet And CSS

- Before changing the character sheet, its scripts, or CSS, read `docs/character-sheet-objective.md`, `docs/sheet-and-css-architecture-spec.md`, and `docs/javascript-architecture-spec.md`.
- The standard character sheet is `AstraelCharacterSheet`, rooted at `.astrael-character-sheet`; its template is `templates/actor/character-sheet.hbs`.
- CSS is plain modular CSS: no Sass, bundler, or `@import`. Scope rules under `.astrael-character-sheet` or `.astrael-rpg`, keep a rule's effective definition in one place, and preserve the load order in `system.json`.
- Register a new stylesheet in `system.json`; unregistered CSS is not loaded. New user-facing strings require matching `ASTRAEL.*` keys in both `lang/en.json` and `lang/pt-BR.json`.

## Commands And Verification

- Install development dependencies with `npm install`.
- Run the full check with `npm run validate`; it validates manifest paths, JavaScript syntax/local imports, locale parity and used keys, Handlebars blocks, CSS braces, then runs `node:test`.
- Run a focused test with `node --test test/<file>.test.js`.
- After changing `system.json` or data models, restart Foundry. Smoke-test affected Foundry v14 workflows and both locales after UI, roll, chat, or sheet changes.
- Run `git diff --check` before completing changes. For changed JSON, use `python -m json.tool <file>` because `npm run validate` parses but does not separately report JSON formatting.

## Compendiums And Releases

- `packs/gm-macros/` is generated LevelDB data and ignored. Edit `packs/_source/gm-macros/`; with Foundry stopped, use `npm run pack:build` after cloning/source edits and `npm run pack:unpack` to export edits made in Foundry.
- Develop in `develop`, which is mounted into the development Foundry instance. Release only through a `develop` to `main` PR; update and tag from the separate `../Astrael-RPG-main` worktree.
