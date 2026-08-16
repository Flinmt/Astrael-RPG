# Repository Guidelines

## Context Docs (read first)

Before changing the sheet, scripts, or CSS, read:

- `docs/character-sheet-objective.md` — product decisions, interaction contracts, and the migration status checklist for the sheet.
- `docs/sheet-and-css-architecture-spec.md` — binding architecture: CSS is modular by sheet/application/functional region with `.astrael-character-sheet` (or `.astrael-rpg`) selector roots. No Sass, bundler, or `@import`; no duplicate overridden rules.
- `docs/javascript-architecture-spec.md` — JS layering: `core -> data/rules -> applications/controllers -> sheets -> hooks`; a layer must not import a later one, Foundry-global access stays at the edges, named exports with explicit `.js` extensions, no new globals/prototype changes/mixins, handlers bound by `data-action` not visual classes.

## Project Structure & Module Organization

Foundry VTT v14 system. `system.json` declares the single esmodule, every CSS file (in load order), languages, and packs. New templates go under `templates/{actor,apps,chat}/` and new CSS under `styles/{foundations,character-sheet,applications,chat,dialogs}/`; **both must be registered in `system.json`** or they will not load and `npm run validate` will not catch it.

Runtime behavior is organized as native ES modules under `scripts/`. `scripts/astrael-rpg.js` is the single manifest entry and bootstrap; it exports `SYSTEM_ID`. Keep data models, pure rules, sheets/controllers, applications, chat, and hooks in their respective folders. There is no bundler.

Only the `character` Actor type and `trait` Item type are registered; `npc` and `pdm` types were removed.

Legacy `compact*` names survive only as persisted contracts (`flags.astrael-rpg.compactPortrait`, client settings like `compactAttributesCollapsed`); never rename them without a migration.

Maintain both files in `lang/`. Store reusable SVGs/assets under `assets/`. Treat `packs/gm-macros/` as generated LevelDB data (gitignored); edit its versioned source under `packs/_source/`.

## Build, Test, and Development Commands

Foundry loads sources directly; npm provides validation and compendium tooling.

- `npm install` installs development dependencies.
- `npm run validate` checks every JavaScript module and local import, runs Node characterization tests, and verifies: manifest paths exist, en/pt-BR keys match exactly (both directions), every `ASTRAEL.*` key used in JS/templates is defined, Handlebars blocks balance, and CSS braces balance. Run it after touching scripts, locales, templates, or CSS. For a pure JSON syntax check also run `python -m json.tool system.json` and the same for changed files in `lang/`.
- `npm run pack:build` / `npm run pack:unpack` (also `tools/foundry-pack.sh pack|unpack`) rebuild/export the `gm-macros` LevelDB pack from/to `packs/_source/gm-macros/`. Stop Foundry first — LevelDB holds an exclusive lock.

Restart Foundry after `system.json` or data-model changes. Smoke-test the character sheet, dialogs, rolls, chat cards, and both locales when those areas change.

## Coding Style & Naming Conventions

Two-space indentation, semicolons, double-quoted strings, `camelCase` functions and variables, `UPPER_SNAKE_CASE` constants. Kebab-case names for template, CSS, and asset files. Add user-facing text through `ASTRAEL.*` localization keys in both `lang/` files instead of embedding labels in templates (the validator enforces key parity and usage).

## Testing Guidelines

No automated test framework beyond `node:test`. Tests live in `test/` and are run by `node --test` (part of `npm run validate`). Pure rules modules are unit-tested directly; `test/module-graph.test.js` stubs `globalThis.foundry`, `Hooks`, and `Actor` before importing the entrypoint — mirror that stub pattern when adding integration-style tests.

Every change passes `npm run validate` plus a Foundry v14 smoke test (and `git diff --check`). In pull requests, document the actor type, workflow, and locale tested; include screenshots for sheet, dialog, chat-card, or styling changes.

## Commit & Pull Request Guidelines

Work on `develop`; this checkout is mounted into the development Foundry instance. Promote releases through a pull request from `develop` to `main`. Use the separate `../Astrael-RPG-main` worktree only for release tags and artifacts; update it with `git pull --ff-only origin main`. Tag releases as `vX.Y.Z` only from `main`.

Use short, imperative Conventional Commit subjects with `feat:`, `fix:`, `refactor:`, `chore:`, or `docs:`. Keep commits focused. Pull requests should explain behavior changes, affected Foundry workflows, linked issues, manual verification, and any manifest, localization, or compendium changes.
