# Astrael RPG — Agent Guide

## Architecture

- **Foundry VTT v14** system with `ActorSheetV2` + `HandlebarsApplicationMixin` (modern API).
- Pure JS/CSS/Handlebars — no build step, no TypeScript, no bundler.
- Entrypoint: `scripts/astrael-rpg.js` → registered in `system.json` as esmodule.
- Data model: `template.json` — Actor type `character`, Item type `trait`.
- No test framework configured.

## Resource System

- Each resource stores `{ max, active, superficial, aggravated }`.
- `boxes[]` is derived at render time via `buildResourceBoxes()` — **never stored**.
- `RESOURCE_MINIMUMS` (`scripts/astrael-rpg.js:4`): health minimum active = 4, willpower minimum active = 2. Clamped in `normalizeDamage()`; trying to reduce below minimum silently fails.
- Old `track[]` arrays are auto-migrated to `active/superficial/aggravated` format in `normalizeResource()`.
- `DEFAULT_RESOURCES` (`scripts/astrael-rpg.js:5`) provides fallback values for all new actors.

## Damage Boxes Layout

Boxes are ordered: `filled` → `superficial` → `aggravated` → `empty`.
- `filled` = active − superficial − aggravated
- `superficial` = superficial count
- `aggravated` = aggravated count
- `empty` = max − active

Clicking a `filled` box reduces `active`. Clicking `superficial`/`aggravated` removes one step. Clicking `empty` increases `active`. All mutations pass through `normalizeDamage()` which clamps and rebalances overflow.

## Dice & Chat

- `classifyDie(10)` = critical (2 successes), `6-9` = success (1), `1-5` = failure.
- Each pair of 10s adds +2 bonus successes. Pairs produce `paired-critical` styling.
- Rouse Check (`useCriticals: false`): `6-10` = 1 success, `1-5` = 0.
- Chat card template: `templates/chat/dice-pool-card.hbs`. Dice footer starts collapsed; clicking anywhere on the card toggles `details[open]` via a delegated `document.body` listener in the `ready` hook.
- Custom chat card overrides `.chat-message` padding/border/header to zero for full-width layout.

## Sheet Behavior

- Width fixed at 900px. Height auto-adjusted via `#fitWindowToContent()` in `_onRender`.
- Portrait edits via `FilePicker`. Ambition/Desire inputs auto-save on change.
- Buttons use `type="button"` to avoid form submission.
- All event listeners attached in `_onRender` (after template is in DOM).

## Development Setup

- Link/ copy to `FoundryVTT/Data/systems/astrael-rpg` for in-game testing.
- Visual reference prototype lives in `ficha/` (gitignored).
- Only locale file is `lang/pt-BR.json` — i18n keys use `ASTRAEL.*` prefix.
