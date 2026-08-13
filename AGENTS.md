# Repository Guidelines

## Project Structure & Module Organization

This is a Foundry VTT v14 system. `system.json` declares entry points, compatibility, languages, and packs. Core behavior lives in `scripts/astrael-rpg.js`, presentation in `styles/`, and Handlebars views in `templates/actor/`, `templates/apps/`, and `templates/chat/`. Maintain both files in `lang/`; store reusable SVGs under `assets/`. Treat `packs/gm-macros/` as generated LevelDB data and edit its versioned source under `packs/_source/`.

## Build, Test, and Development Commands

Foundry loads sources directly; npm supports validation and compendium tooling.

- `npm install` installs development dependencies.
- `npm run validate` checks JavaScript syntax and the system manifest.
- `npm run pack:build` rebuilds the generated `gm-macros` LevelDB pack from `packs/_source/`; stop Foundry first.
- `npm run pack:unpack` exports intentional in-Foundry macro changes back to versioned JSON; stop Foundry first.
- `python -m json.tool system.json >/dev/null` validates the manifest; run the same command for changed files in `lang/`.

Restart Foundry after manifest or data-model changes. Exercise character and NPC sheets, dialogs, rolls, chat cards, and both locales when those areas change.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, double-quoted strings, `camelCase` functions and variables, and `UPPER_SNAKE_CASE` constants. Use kebab-case for template and asset filenames. Scope CSS selectors beneath system-specific classes. Add user-facing text through `ASTRAEL.*` localization keys instead of embedding labels in templates.

## Testing Guidelines

No automated test framework or coverage threshold is configured. Every change should pass syntax and JSON validation plus a Foundry v14 smoke test. In pull requests, document the actor type, workflow, and locale tested. Include screenshots for sheet, dialog, chat-card, or styling changes.

## Commit & Pull Request Guidelines

Work on `develop`; this checkout is mounted into the development Foundry instance. Promote releases through a pull request from `develop` to `main`. Use the separate `../Astrael-RPG-main` worktree only for release tags and artifacts; update it with `git pull --ff-only origin main`. Tag releases as `vX.Y.Z` only from `main`.

Use short, imperative Conventional Commit subjects with `feat:`, `fix:`, `refactor:`, `chore:`, or `docs:`. Keep commits focused. Pull requests should explain behavior changes, affected Foundry workflows, linked issues, manual verification, and any manifest, localization, or compendium changes.
