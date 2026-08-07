# Repository Guidelines

## Project Structure & Module Organization

This repository is a Foundry Virtual Tabletop v14 system. `system.json` is the system manifest and declares entry points, compatibility, languages, and compendium packs. Core behavior and data models live in `scripts/astrael-rpg.js`; global presentation is in `styles/astrael-rpg.css`. Handlebars views are grouped by purpose under `templates/actor/`, `templates/apps/`, and `templates/chat/`. Put localized strings in both `lang/en.json` and `lang/pt-BR.json`, and store reusable SVGs in `assets/icons/` or `assets/disciplines/`. The `packs/gm-macros/` directory contains Foundry-managed LevelDB data; avoid hand-editing its database files. `tools/` contains maintenance utilities.

## Build, Test, and Development Commands

Foundry loads sources directly; npm supports validation and compendium tooling.

- `npm install` installs development dependencies.
- `npm run validate` checks JavaScript syntax and the system manifest.
- `npm run pack:build` rebuilds the generated `gm-macros` LevelDB pack from `packs/_source/`; stop Foundry first.
- `npm run pack:unpack` exports intentional in-Foundry macro changes back to versioned JSON; stop Foundry first.
- `node --check scripts/astrael-rpg.js` checks JavaScript syntax.
- `python -m json.tool system.json >/dev/null` validates the manifest; run the same command for changed files in `lang/`.
- Link or copy the repository to `FoundryVTT/Data/systems/astrael-rpg`, then create a world using **Astrael RPG** for manual testing.

Restart Foundry after manifest or data-model changes. Exercise character and NPC sheets, dialogs, rolls, chat cards, and both locales when those areas change.

## Coding Style & Naming Conventions

Follow the existing JavaScript style: two-space indentation, semicolons, double-quoted strings, `camelCase` functions and variables, and `UPPER_SNAKE_CASE` constants. Keep Foundry hook registration and system initialization easy to locate. Use kebab-case for template and asset filenames (for example, `dice-pool-card.hbs`). Scope CSS selectors beneath system-specific sheet or application classes. Add user-facing text through `ASTRAEL.*` localization keys instead of embedding new labels in templates.

## Testing Guidelines

No automated test framework or coverage threshold is configured. Every change should pass syntax and JSON validation plus a Foundry v14 smoke test. In pull requests, document the actor type, workflow, and locale tested. Include screenshots for sheet, dialog, chat-card, or styling changes.

## Commit & Pull Request Guidelines

Recent history generally uses short, imperative Conventional Commit subjects such as `feat: add NPC creation flow`, `refactor: remove PDM actor sheet`, and `chore: prepare v0.1.2 release`. Prefer `feat:`, `fix:`, `refactor:`, `chore:`, or `docs:` and keep each commit focused. Pull requests should explain behavior changes, identify affected Foundry workflows, link relevant issues, list manual verification, and call out manifest, localization, or compendium changes.
