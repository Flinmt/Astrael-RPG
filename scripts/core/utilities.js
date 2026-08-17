import {
  CONVICTION_CARD_COUNT,
  DEFAULT_RESOURCES,
  RESOURCE_MINIMUMS,
  STRANGER_MARK_OPTIONS,
  SYSTEM_ID
} from "./constants.js";

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function getCharacterPortraitFraming(actor, source = actor.img) {
  const saved = actor.getFlag(SYSTEM_ID, "compactPortrait") || {};
  if (saved.src !== source) return { src: source, x: 50, y: 50, zoom: 1 };
  return {
    src: source,
    x: clampNumber(saved.x, 0, 100),
    y: clampNumber(saved.y, 0, 100),
    zoom: clampNumber(saved.zoom, 1, 3)
  };
}

function prepareCharacterPortraitPresentation(framing) {
  const zoom = clampNumber(framing.zoom, 1, 3);
  const x = clampNumber(framing.x, 0, 100);
  const y = clampNumber(framing.y, 0, 100);
  return {
    ...framing,
    x,
    y,
    zoom,
    panX: (50 - x) * ((zoom - 1) / zoom),
    panY: (50 - y) * ((zoom - 1) / zoom)
  };
}

function applyTokenPortraitsToActorDirectory(application, element) {
  const ActorDirectory = CONFIG.ui?.actors;
  if (!ActorDirectory || !(application instanceof ActorDirectory)) return;

  const root = element instanceof HTMLElement ? element : element?.[0];
  if (!root) return;

  for (const entry of root.querySelectorAll("[data-entry-id]")) {
    const actor = game.actors?.get(entry.dataset.entryId);
    const image = entry.querySelector(":scope > img.thumbnail, :scope > img");
    if (!actor || !image) continue;

    const tokenSource = actor.prototypeToken?.texture?.src;
    if (!tokenSource || tokenSource.includes("*")) continue;

    const frame = document.createElement("span");
    frame.classList.add("astrael-directory-portrait-frame");
    image.before(frame);
    frame.append(image);
    image.src = tokenSource;
    image.style.objectPosition = "50% 50%";
    image.style.transform = "none";
  }
}

function isNumeric(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function getAttributeValue(system, key) {
  return Math.max(1, Number(system.attributes?.[key]?.value) || 1);
}

function calculateResourceActive(resourceId, system) {
  const max = DEFAULT_RESOURCES[resourceId]?.max ?? 0;
  const min = RESOURCE_MINIMUMS[resourceId] ?? 0;
  if (resourceId === "health") return clampNumber(getAttributeValue(system, "stamina") + 3, min, max);
  if (resourceId === "willpower") {
    return clampNumber(
      getAttributeValue(system, "composure") + getAttributeValue(system, "resolve"),
      min,
      max
    );
  }
  return min;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toRomanLevel(value) {
  const levels = ["", "I", "II", "III", "IV", "V"];
  return levels[clampNumber(value, 1, 5)] ?? "I";
}

function toRoman(value) {
  const map = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X" };
  return map[clampNumber(value, 1, 10)] ?? String(value);
}

function normalizeAdvantageLevel(source = {}) {
  const rawLevel = source.level ?? source.value ?? source.points ?? 1;
  if (isNumeric(rawLevel)) return clampNumber(rawLevel, 1, 5);

  const roman = String(rawLevel).replace(/^-/, "").trim().toUpperCase();
  const romanValue = ["", "I", "II", "III", "IV", "V"].indexOf(roman);
  return romanValue > 0 ? romanValue : 1;
}

function prepareAdvantageEntry(source = {}) {
  const level = normalizeAdvantageLevel(source);

  return {
    ...source,
    name: source.name || "Sem nome",
    description: source.description || source.details || "",
    level,
    levelRoman: toRomanLevel(level)
  };
}

function normalizeHemomancyPower(source = {}) {
  const level = clampNumber(source.level ?? 1, 1, 5);
  const cost = clampNumber(source.cost ?? 1, 1, 5);

  return {
    ...source,
    name: source.name || "Sem nome",
    description: source.description || "",
    level,
    levelRoman: toRomanLevel(level),
    cost,
    costIcons: Array.from({ length: cost }, (_, index) => index),
    editing: Boolean(source.editing)
  };
}

function normalizeVirtuePerk(source = {}) {
  return {
    name: source.name || "",
    description: source.description || "",
    expanded: Boolean(source.expanded),
    editing: Boolean(source.editing)
  };
}

function normalizeVirtue(source = {}) {
  const perks = Array.isArray(source.perks) ? source.perks.map(normalizeVirtuePerk) : [];
  return {
    name: source.name || "",
    description: source.description || "",
    perks,
    editing: Boolean(source.editing)
  };
}

function normalizeStrangerMarkAbility(source = {}) {
  const level = clampNumber(source.level ?? 1, 1, 5);
  const cost = clampNumber(source.cost ?? 0, 0, 5);

  return {
    ...source,
    name: source.name || "Sem nome",
    description: source.description || "",
    level,
    levelRoman: toRomanLevel(level),
    cost,
    costIcons: Array.from({ length: cost }, (_, index) => index),
    editing: Boolean(source.editing)
  };
}

function normalizeStrangerMark(source = {}) {
  const level = clampNumber(source.level ?? 0, 0, 5);
  const legacyOption = { veil: "animalismo", echo: "auspex", rift: "celeridade" }[source.option] ?? source.option;
  const option = STRANGER_MARK_OPTIONS.find((o) => o.id === legacyOption) ?? STRANGER_MARK_OPTIONS[0];
  const abilities = Array.isArray(source.abilities) ? source.abilities.map(normalizeStrangerMarkAbility) : [];

  return {
    ...source,
    option: option.id,
    label: option.label,
    icon: option.icon,
    level,
    levelRoman: level ? toRomanLevel(level) : "0",
    abilities
  };
}

function normalizeVisibleTabs(source = {}) {
  return {
    virtues: source.virtues !== false,
    hemomancy: source.hemomancy !== false,
    strangerMark: source.strangerMark !== false
  };
}

function normalizeConviction(source = {}) {
  const sourcePillar = source.pillar ?? {};
  return {
    name: source.name || "",
    description: source.description || "",
    fractures: clampNumber(source.fractures ?? source.fracture ?? 0, 0, 2),
    pillar: {
      name: sourcePillar.name || "",
      description: sourcePillar.description || ""
    }
  };
}

function normalizeConvictionList(source = []) {
  return Array.from({ length: CONVICTION_CARD_COUNT }, (_, index) => normalizeConviction(source[index] ?? {}));
}

function buildFractureBoxes(value) {
  const active = clampNumber(value, 0, 2);
  return Array.from({ length: 2 }, (_, index) => ({
    value: index + 1,
    filled: index < active
  }));
}

export {
  applyTokenPortraitsToActorDirectory,
  buildFractureBoxes,
  calculateResourceActive,
  clampNumber,
  escapeHtml,
  getAttributeValue,
  getCharacterPortraitFraming,
  isNumeric,
  normalizeAdvantageLevel,
  normalizeConviction,
  normalizeConvictionList,
  normalizeHemomancyPower,
  normalizeStrangerMark,
  normalizeStrangerMarkAbility,
  normalizeVirtue,
  normalizeVirtuePerk,
  normalizeVisibleTabs,
  prepareAdvantageEntry,
  prepareCharacterPortraitPresentation,
  toRoman,
  toRomanLevel
};
