const SYSTEM_ID = "astrael-rpg";
const CHARACTER_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/actor/character-sheet.hbs`;
const COMPACT_CHARACTER_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/actor/compact-character-sheet.hbs`;
const COMPACT_PORTRAIT_EDITOR_TEMPLATE = `systems/${SYSTEM_ID}/templates/apps/compact-portrait-editor.hbs`;
const NPC_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/actor/npc-sheet.hbs`;
const SPECIALTIES_PANEL_TEMPLATE = `systems/${SYSTEM_ID}/templates/apps/specialties-panel.hbs`;
const STRANGER_MARKS_PANEL_TEMPLATE = `systems/${SYSTEM_ID}/templates/apps/stranger-marks-panel.hbs`;
const DICE_POOL_CHAT_TEMPLATE = `systems/${SYSTEM_ID}/templates/chat/dice-pool-card.hbs`;
const RESOURCE_MINIMUMS = { health: 4, willpower: 2 };
const CONVICTION_CARD_COUNT = 3;
const CONVICTION_CENTER_INDEX = 1;
const CONVICTION_PILLAR_TYPES = ["Local", "Objeto", "Pessoa"];
const ATTRIBUTE_KEYS = ["strength", "dexterity", "stamina", "charisma", "manipulation", "composure", "intelligence", "wits", "resolve"];
const SKILL_KEYS = ["athletics", "brawl", "crafts", "drive", "firearms", "larceny", "melee", "stealth", "survival", "animalKen", "empathy", "etiquette", "expression", "intimidation", "leadership", "persuasion", "streetwise", "subterfuge", "academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"];
const LOCALIZE_ATTR = { strength: "ASTRAEL.Attribute.Strength", dexterity: "ASTRAEL.Attribute.Dexterity", stamina: "ASTRAEL.Attribute.Stamina", charisma: "ASTRAEL.Attribute.Charisma", manipulation: "ASTRAEL.Attribute.Manipulation", composure: "ASTRAEL.Attribute.Composure", intelligence: "ASTRAEL.Attribute.Intelligence", wits: "ASTRAEL.Attribute.Wits", resolve: "ASTRAEL.Attribute.Resolve" };
const LOCALIZE_SKILL = { athletics: "ASTRAEL.Skill.Athletics", brawl: "ASTRAEL.Skill.Brawl", crafts: "ASTRAEL.Skill.Crafts", drive: "ASTRAEL.Skill.Drive", firearms: "ASTRAEL.Skill.Firearms", larceny: "ASTRAEL.Skill.Larceny", melee: "ASTRAEL.Skill.Melee", stealth: "ASTRAEL.Skill.Stealth", survival: "ASTRAEL.Skill.Survival", animalKen: "ASTRAEL.Skill.AnimalKen", empathy: "ASTRAEL.Skill.Empathy", etiquette: "ASTRAEL.Skill.Etiquette", expression: "ASTRAEL.Skill.Expression", intimidation: "ASTRAEL.Skill.Intimidation", leadership: "ASTRAEL.Skill.Leadership", persuasion: "ASTRAEL.Skill.Persuasion", streetwise: "ASTRAEL.Skill.Streetwise", subterfuge: "ASTRAEL.Skill.Subterfuge", academics: "ASTRAEL.Skill.Academics", awareness: "ASTRAEL.Skill.Awareness", finance: "ASTRAEL.Skill.Finance", investigation: "ASTRAEL.Skill.Investigation", medicine: "ASTRAEL.Skill.Medicine", occult: "ASTRAEL.Skill.Occult", politics: "ASTRAEL.Skill.Politics", science: "ASTRAEL.Skill.Science", technology: "ASTRAEL.Skill.Technology" };

const STRANGER_MARK_OPTIONS = [
  { id: "animalismo", label: "Animalismo", icon: `systems/${SYSTEM_ID}/assets/disciplines/animalismo.svg` },
  { id: "auspex", label: "Auspex", icon: `systems/${SYSTEM_ID}/assets/disciplines/auspex.svg` },
  { id: "celeridade", label: "Celeridade", icon: `systems/${SYSTEM_ID}/assets/disciplines/celeridade.svg` },
  { id: "dominacao", label: "Dominação", icon: `systems/${SYSTEM_ID}/assets/disciplines/dominação.svg` },
  { id: "fortitude", label: "Fortitude", icon: `systems/${SYSTEM_ID}/assets/disciplines/fortitude.svg` },
  { id: "oblivio", label: "Oblívio", icon: `systems/${SYSTEM_ID}/assets/disciplines/oblivio.svg` },
  { id: "ofuscacao", label: "Ofuscação", icon: `systems/${SYSTEM_ID}/assets/disciplines/obfuscação.svg` },
  { id: "potencia", label: "Potência", icon: `systems/${SYSTEM_ID}/assets/disciplines/potencia.svg` },
  { id: "presenca", label: "Presença", icon: `systems/${SYSTEM_ID}/assets/disciplines/presença.svg` },
  { id: "proteanismo", label: "Proteanismo", icon: `systems/${SYSTEM_ID}/assets/disciplines/proteanismo.svg` }
];
const DEFAULT_RESOURCES = {
  health: {
    max: 8,
    active: 4,
    superficial: 0,
    aggravated: 0
  },
  willpower: {
    max: 10,
    active: 2,
    superficial: 0,
    aggravated: 0
  },
  future: {
    label: "Modulo Futuro",
    description: "Espaco reservado para um recurso ainda indefinido."
  }
};

const NPC_OPTIONAL_TABS = ["virtues", "hemomancy", "strangerMark"];
const NPC_LEVELS = [
  {
    id: "common",
    label: "Comum",
    description: "Presenca discreta, com poucos pontos de destaque.",
    attributeSpread: [3, 3, 2, 2, 2, 1, 1, 1, 1],
    skillBonusCount: 0
  },
  {
    id: "notable",
    label: "Marcante",
    description: "Alguem que deixa marca na cena e sustenta conflitos.",
    attributeSpread: [4, 3, 3, 3, 2, 2, 2, 2, 1],
    skillBonusCount: 0
  },
  {
    id: "dangerous",
    label: "Perigoso",
    description: "Uma forca narrativa capaz de complicar os personagens.",
    attributeSpread: [4, 4, 3, 3, 3, 3, 2, 2, 2],
    skillBonusCount: 3
  },
  {
    id: "unique",
    label: "Unico",
    description: "Figura central, rara e dificil de substituir.",
    attributeSpread: [5, 4, 4, 4, 3, 3, 3, 2, 2],
    skillBonusCount: 6
  }
];
const NPC_SKILL_DISTRIBUTIONS = [
  {
    id: "versatile",
    label: "Versatil",
    description: "Muitas competencias uteis, poucas em destaque absoluto.",
    spreads: {
      common: [3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1],
      default: [3, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    }
  },
  {
    id: "balanced",
    label: "Equilibrado",
    description: "Algumas areas fortes, com base funcional ao redor.",
    spreads: {
      common: [3, 3, 2, 2, 2, 1, 1, 1, 1, 1],
      default: [3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1]
    }
  },
  {
    id: "specialist",
    label: "Especialista",
    description: "Poucas competencias, mas uma identidade tecnica clara.",
    spreads: {
      common: [4, 3, 3, 2, 2, 1, 1],
      default: [4, 3, 3, 3, 2, 2, 2, 1, 1, 1]
    }
  }
];
const NPC_ARCHETYPES = [
  {
    id: "witness",
    label: "A Testemunha",
    description: "Viu o que nao devia. Em torno dela, a verdade vira risco.",
    coreAttributes: ["wits", "resolve", "composure"],
    sideAttributes: ["intelligence", "charisma", "dexterity"],
    coreSkills: ["awareness", "investigation", "empathy"],
    sideSkills: ["streetwise", "subterfuge", "persuasion", "academics"]
  },
  {
    id: "guardian",
    label: "O Guardiao",
    description: "Protege um limite, uma promessa ou alguem que nao pode cair.",
    coreAttributes: ["stamina", "composure", "resolve"],
    sideAttributes: ["strength", "charisma", "wits"],
    coreSkills: ["empathy", "leadership", "awareness"],
    sideSkills: ["brawl", "athletics", "intimidation", "persuasion", "survival"]
  },
  {
    id: "shadow",
    label: "A Sombra",
    description: "Move-se onde ninguem olha e some antes da pergunta certa.",
    coreAttributes: ["dexterity", "wits", "composure"],
    sideAttributes: ["resolve", "intelligence", "manipulation"],
    coreSkills: ["stealth", "larceny", "subterfuge"],
    sideSkills: ["investigation", "awareness", "technology", "streetwise"]
  },
  {
    id: "wound",
    label: "A Ferida",
    description: "Carrega uma consequencia que ainda nao terminou.",
    coreAttributes: ["resolve", "stamina", "wits"],
    sideAttributes: ["composure", "strength", "manipulation"],
    coreSkills: ["survival", "empathy", "intimidation"],
    sideSkills: ["streetwise", "medicine", "awareness", "brawl"]
  },
  {
    id: "oracle",
    label: "O Oraculo",
    description: "Sabe coisas demais, por estudo, rua, trauma ou estranho.",
    coreAttributes: ["intelligence", "wits", "resolve"],
    sideAttributes: ["composure", "manipulation", "charisma"],
    coreSkills: ["occult", "investigation", "academics"],
    sideSkills: ["awareness", "science", "politics", "subterfuge"]
  },
  {
    id: "corruptor",
    label: "O Corruptor",
    description: "Oferece atalhos e faz concessoes parecerem inevitaveis.",
    coreAttributes: ["manipulation", "wits", "charisma"],
    sideAttributes: ["composure", "intelligence", "resolve"],
    coreSkills: ["subterfuge", "persuasion", "politics"],
    sideSkills: ["finance", "etiquette", "intimidation", "streetwise"]
  },
  {
    id: "predator",
    label: "O Predador",
    description: "Percebe fraqueza e se move antes que a vitima entenda.",
    coreAttributes: ["dexterity", "wits", "strength"],
    sideAttributes: ["stamina", "composure", "resolve"],
    coreSkills: ["stealth", "awareness", "melee"],
    sideSkills: ["brawl", "athletics", "intimidation", "investigation", "survival"]
  },
  {
    id: "brute",
    label: "O Brutamontes",
    description: "Resolve problemas com presenca fisica, pressao e violencia simples.",
    coreAttributes: ["strength", "stamina", "composure"],
    sideAttributes: ["dexterity", "resolve", "wits"],
    coreSkills: ["brawl", "intimidation", "athletics"],
    sideSkills: ["melee", "survival", "streetwise", "awareness"]
  },
  {
    id: "criminal",
    label: "O Criminoso",
    description: "Conhece a rua, seus atalhos, seus riscos e seus acordos sujos.",
    coreAttributes: ["dexterity", "wits", "manipulation"],
    sideAttributes: ["composure", "strength", "resolve"],
    coreSkills: ["larceny", "streetwise", "stealth"],
    sideSkills: ["brawl", "subterfuge", "drive", "firearms"]
  },
  {
    id: "informant",
    label: "O Informante",
    description: "Ouve demais, fala quando convem e sabe onde procurar respostas.",
    coreAttributes: ["wits", "manipulation", "charisma"],
    sideAttributes: ["composure", "intelligence", "resolve"],
    coreSkills: ["streetwise", "empathy", "investigation"],
    sideSkills: ["subterfuge", "persuasion", "awareness", "etiquette"]
  },
  {
    id: "authority",
    label: "A Autoridade",
    description: "Carrega cargo, influencia ou medo suficiente para dobrar uma sala.",
    coreAttributes: ["composure", "manipulation", "charisma"],
    sideAttributes: ["resolve", "intelligence", "wits"],
    coreSkills: ["leadership", "politics", "intimidation"],
    sideSkills: ["etiquette", "persuasion", "finance", "subterfuge"]
  },
  {
    id: "professional",
    label: "O Profissional",
    description: "Tem metodo, repertorio tecnico e uma resposta pronta para o oficio.",
    coreAttributes: ["intelligence", "resolve", "wits"],
    sideAttributes: ["composure", "dexterity", "manipulation"],
    coreSkills: ["academics", "technology", "investigation"],
    sideSkills: ["medicine", "science", "finance", "politics"]
  },
  {
    id: "executor",
    label: "O Executor",
    description: "Age com frieza quando alguem precisa sumir, cair ou se calar.",
    coreAttributes: ["dexterity", "composure", "wits"],
    sideAttributes: ["strength", "stamina", "resolve"],
    coreSkills: ["firearms", "stealth", "awareness"],
    sideSkills: ["melee", "brawl", "drive", "intimidation"]
  }
];

const { TypeDataModel } = foundry.abstract;
const { ArrayField, BooleanField, NumberField, ObjectField, SchemaField, StringField } = foundry.data.fields;

function stringField(initial = "") {
  return new StringField({ required: true, initial });
}

function traitValueField(initial, min = 0) {
  return new SchemaField({
    value: new NumberField({ required: true, integer: true, min, initial })
  });
}

function resourceField(resourceId) {
  const resource = DEFAULT_RESOURCES[resourceId];

  return new SchemaField({
    max: new NumberField({ required: true, integer: true, min: 0, initial: resource.max }),
    active: new NumberField({ required: true, integer: true, min: RESOURCE_MINIMUMS[resourceId] ?? 0, initial: resource.active }),
    superficial: new NumberField({ required: true, integer: true, min: 0, initial: resource.superficial }),
    aggravated: new NumberField({ required: true, integer: true, min: 0, initial: resource.aggravated })
  });
}

function migrateLegacyResource(resourceId, source) {
  const fallback = DEFAULT_RESOURCES[resourceId];
  const resource = source.resources?.[resourceId];
  if (!Array.isArray(resource?.track) || isNumeric(resource.active)) return;

  const max = clampNumber(resource.max ?? fallback.max, 0, fallback.max);
  const active = resource.track.filter((state) => state && state !== "empty").length;
  const superficial = resource.track.filter((state) => state === "superficial").length;
  const aggravated = resource.track.filter((state) => state === "aggravated").length;
  const normalized = normalizeDamage({ max, active, superficial, aggravated }, resourceId);

  source.resources[resourceId] = {
    max: normalized.max,
    active: normalized.active,
    superficial: normalized.superficial,
    aggravated: normalized.aggravated
  };
}

class AstraelCharacterData extends TypeDataModel {
  static defineSchema() {
    return {
      description: stringField(),
      details: new SchemaField({
        concept: stringField(),
        chronicle: stringField(),
        player: stringField(),
        ambition: stringField(),
        desire: stringField()
      }),
      attributes: new SchemaField(Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, traitValueField(1, 1)]))),
      skills: new SchemaField(Object.fromEntries(SKILL_KEYS.map((key) => [key, traitValueField(0, 0)]))),
      resources: new SchemaField({
        health: resourceField("health"),
        willpower: resourceField("willpower"),
        future: new SchemaField({
          label: stringField(DEFAULT_RESOURCES.future.label),
          description: stringField(DEFAULT_RESOURCES.future.description)
        })
      }),
      xp: new SchemaField({
        total: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        current: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        spent: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      sheetSettings: new SchemaField({
        visibleTabs: new SchemaField({
          virtues: new BooleanField({ required: true, initial: false }),
          hemomancy: new BooleanField({ required: true, initial: false }),
          strangerMark: new BooleanField({ required: true, initial: false })
        })
      }),
      advantages: new ArrayField(new ObjectField(), { required: true, initial: () => [] }),
      flaws: new ArrayField(new ObjectField(), { required: true, initial: () => [] }),
      hemomancy: new SchemaField({
        level: new NumberField({ required: true, integer: true, min: 0, max: 5, initial: 0 }),
        alchemyLevel: new NumberField({ required: true, integer: true, min: 0, max: 5, initial: 0 }),
        powers: new ArrayField(new ObjectField(), { required: true, initial: () => [] }),
        formulas: new ArrayField(new ObjectField(), { required: true, initial: () => [] })
      }),
      strangerMark: new SchemaField({
        selectedMarkId: new StringField({ required: true, initial: "" }),
        selectedAbilityLevel: new NumberField({ required: true, integer: true, min: 1, max: 5, initial: 1 }),
        marks: new ArrayField(new ObjectField(), { required: true, initial: () => [] })
      }),
      convictions: new ArrayField(new ObjectField(), { required: true, initial: () => [] }),
      virtues: new ArrayField(new ObjectField(), { required: true, initial: () => [] }),
      sangria: traitValueField(5, 0),
      vazio: traitValueField(0, 0),
      specialties: new ArrayField(new ObjectField(), { required: true, initial: () => [] }),
      customRolls: new ArrayField(new ObjectField(), { required: true, initial: () => [] })
    };
  }

  static migrateData(source) {
    source.resources ??= {};
    migrateLegacyResource("health", source);
    migrateLegacyResource("willpower", source);

    return super.migrateData(source);
  }
}

class AstraelTraitData extends TypeDataModel {
  static defineSchema() {
    return {
      description: stringField(),
      value: new NumberField({ required: true, integer: true, initial: 0 })
    };
  }
}

async function updateActorSheet(event, form, formData) {
  return this.actor.update(formData.object);
}

function removeDeprecatedActorTypes() {
  const deprecatedTypes = ["pdm"];
  const actorTypes = game.system?.documentTypes?.Actor;

  if (Array.isArray(actorTypes)) {
    game.system.documentTypes.Actor = actorTypes.filter((type) => !deprecatedTypes.includes(type));
  } else if (actorTypes instanceof Set) {
    for (const type of deprecatedTypes) actorTypes.delete(type);
  } else if (actorTypes && typeof actorTypes === "object") {
    for (const type of deprecatedTypes) delete actorTypes[type];
  }

  for (const type of deprecatedTypes) {
    delete CONFIG.Actor.dataModels[type];
    if (CONFIG.Actor.typeLabels) delete CONFIG.Actor.typeLabels[type];
  }
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function getCompactPortraitFraming(actor, source = actor.img) {
  const saved = actor.getFlag(SYSTEM_ID, "compactPortrait") || {};
  if (saved.src !== source) return { src: source, x: 50, y: 50, zoom: 1 };
  return {
    src: source,
    x: clampNumber(saved.x, 0, 100),
    y: clampNumber(saved.y, 0, 100),
    zoom: clampNumber(saved.zoom, 1, 3)
  };
}

function prepareCompactPortraitPresentation(framing) {
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

function getNpcLevel(levelId) {
  return NPC_LEVELS.find((level) => level.id === levelId) ?? NPC_LEVELS[0];
}

function getNpcArchetype(archetypeId) {
  return NPC_ARCHETYPES.find((archetype) => archetype.id === archetypeId) ?? NPC_ARCHETYPES[0];
}

function getNpcSkillDistribution(distributionId) {
  return NPC_SKILL_DISTRIBUTIONS.find((distribution) => distribution.id === distributionId) ?? NPC_SKILL_DISTRIBUTIONS[1];
}

function chooseWeightedTrait(keys, archetype, type, excluded = new Set()) {
  const core = new Set(type === "attribute" ? archetype.coreAttributes : archetype.coreSkills);
  const side = new Set(type === "attribute" ? archetype.sideAttributes : archetype.sideSkills);
  const candidates = keys
    .filter((key) => !excluded.has(key))
    .map((key) => ({
      key,
      weight: core.has(key) ? 8 : side.has(key) ? 4 : 1
    }));
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let roll = Math.random() * total;
  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate.key;
  }
  return candidates.at(-1)?.key ?? keys[0];
}

function buildNpcTraitValues(keys, spread, archetype, type) {
  const values = Object.fromEntries(keys.map((key) => [key, type === "attribute" ? 1 : 0]));
  const used = new Set();
  for (const value of spread) {
    const key = chooseWeightedTrait(keys, archetype, type, used);
    used.add(key);
    values[key] = value;
  }
  return values;
}

function getNpcSkillSpread(level, distribution) {
  if (level.id === "common") return distribution.spreads.common;
  return distribution.spreads.default;
}

function applyNpcSkillBonuses(skills, level, archetype) {
  const max = level.id === "notable" ? 4 : 5;
  for (let i = 0; i < (level.skillBonusCount || 0); i++) {
    const eligible = SKILL_KEYS.filter((key) => (skills[key] || 0) < max);
    if (!eligible.length) break;
    const key = chooseWeightedTrait(eligible, archetype, "skill");
    skills[key] += 1;
  }
  return skills;
}

function getNpcOptionalTab(levelId) {
  if (levelId === "common") return "";
  return NPC_OPTIONAL_TABS[Math.floor(Math.random() * NPC_OPTIONAL_TABS.length)] ?? "";
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

function formatNpcTraitPreview(values, labels, minimum) {
  return Object.entries(values)
    .filter(([, value]) => value > minimum)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, value]) => ({
      key,
      label: labels[key] ? game.i18n.localize(labels[key]) : key,
      value
    }));
}

function createNpcDraft(levelId = "common", archetypeId = "witness", distributionId = "balanced") {
  const level = getNpcLevel(levelId);
  const archetype = getNpcArchetype(archetypeId);
  const skillDistribution = getNpcSkillDistribution(distributionId);
  const attributes = buildNpcTraitValues(ATTRIBUTE_KEYS, level.attributeSpread, archetype, "attribute");
  const skills = applyNpcSkillBonuses(
    buildNpcTraitValues(SKILL_KEYS, getNpcSkillSpread(level, skillDistribution), archetype, "skill"),
    level,
    archetype
  );
  const health = clampNumber((attributes.stamina || 1) + 3, RESOURCE_MINIMUMS.health, DEFAULT_RESOURCES.health.max);
  const willpower = clampNumber((attributes.composure || 1) + (attributes.resolve || 1), RESOURCE_MINIMUMS.willpower, DEFAULT_RESOURCES.willpower.max);
  const optionalTab = getNpcOptionalTab(level.id);
  return {
    level,
    archetype,
    skillDistribution,
    attributes,
    skills,
    health,
    willpower,
    optionalTab,
    optionalTabLabel: optionalTab === "virtues" ? game.i18n.localize("ASTRAEL.Tab.Virtues") :
      optionalTab === "hemomancy" ? game.i18n.localize("ASTRAEL.Tab.Hemomancy") :
      optionalTab === "strangerMark" ? game.i18n.localize("ASTRAEL.Tab.StrangerMark") : "",
    attributePreview: formatNpcTraitPreview(attributes, LOCALIZE_ATTR, 1),
    skillPreview: formatNpcTraitPreview(skills, LOCALIZE_SKILL, 0)
  };
}

function buildNpcDraftUpdateData(draft) {
  const data = {
    [`flags.${SYSTEM_ID}.npcInitialized`]: true,
    [`flags.${SYSTEM_ID}.npcLevel`]: draft.level.id,
    [`flags.${SYSTEM_ID}.npcLevelLabel`]: draft.level.label,
    [`flags.${SYSTEM_ID}.npcImportanceLabel`]: draft.level.label,
    [`flags.${SYSTEM_ID}.npcSkillDistribution`]: draft.skillDistribution.id,
    [`flags.${SYSTEM_ID}.npcSkillDistributionLabel`]: draft.skillDistribution.label,
    [`flags.${SYSTEM_ID}.npcArchetype`]: draft.archetype.id,
    [`flags.${SYSTEM_ID}.npcArchetypeLabel`]: draft.archetype.label,
    "system.resources.health.active": draft.health,
    "system.resources.health.superficial": 0,
    "system.resources.health.aggravated": 0,
    "system.resources.willpower.active": draft.willpower,
    "system.resources.willpower.superficial": 0,
    "system.resources.willpower.aggravated": 0,
    "system.sangria.value": 5,
    "system.vazio.value": 0,
    "system.sheetSettings.visibleTabs.virtues": draft.optionalTab === "virtues",
    "system.sheetSettings.visibleTabs.hemomancy": draft.optionalTab === "hemomancy",
    "system.sheetSettings.visibleTabs.strangerMark": draft.optionalTab === "strangerMark"
  };

  for (const [key, value] of Object.entries(draft.attributes)) {
    data[`system.attributes.${key}.value`] = value;
  }
  for (const [key, value] of Object.entries(draft.skills)) {
    data[`system.skills.${key}.value`] = value;
  }

  return data;
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
    virtues: source.virtues === true,
    hemomancy: source.hemomancy === true,
    strangerMark: source.strangerMark === true
  };
}

function normalizeConviction(source = {}, index = 0) {
  const pillars = Array.isArray(source.pillars) ? source.pillars : [];
  const sourcePillar = pillars[0] ?? {};
  const type = index === CONVICTION_CENTER_INDEX
    ? "Pessoa"
    : (CONVICTION_PILLAR_TYPES.includes(sourcePillar.type) ? sourcePillar.type : "Local");

  return {
    name: source.name || "",
    description: source.description || "",
    fractures: clampNumber(source.fractures ?? source.fracture ?? 0, 0, 2),
    pillars: [{
      name: sourcePillar.name || "",
      type
    }]
  };
}

function normalizeConvictionList(source = []) {
  return Array.from({ length: CONVICTION_CARD_COUNT }, (_, index) => normalizeConviction(source[index] ?? {}, index));
}

function buildFractureBoxes(value) {
  const active = clampNumber(value, 0, 2);
  return Array.from({ length: 2 }, (_, index) => ({
    index,
    filled: index < active
  }));
}

function getConvictionPillarTypeOptions(selectedType) {
  return CONVICTION_PILLAR_TYPES.map((type) => ({
    value: type,
    label: game.i18n.localize(`ASTRAEL.Convictions.PillarType${type}`),
    selected: type === selectedType
  }));
}

function normalizeResource(resourceId, source = {}) {
  const fallback = DEFAULT_RESOURCES[resourceId];
  const max = fallback.max;

  if (Array.isArray(source.track) && !isNumeric(source.active)) {
    const active = source.track.filter((state) => state && state !== "empty").length;
    const superficial = source.track.filter((state) => state === "superficial").length;
    const aggravated = source.track.filter((state) => state === "aggravated").length;

    return normalizeDamage({ max, active, superficial, aggravated }, resourceId);
  }

  return normalizeDamage({
    max,
    active: source.active,
    superficial: source.superficial,
    aggravated: source.aggravated
  }, resourceId);
}

function normalizeDamage(resource, resourceId) {
  const max = resource.max;
  const minActive = RESOURCE_MINIMUMS[resourceId] ?? 0;
  let active = clampNumber(resource.active, minActive, max);
  let superficial = clampNumber(resource.superficial, 0, active);
  let aggravated = clampNumber(resource.aggravated, 0, active);

  const overflow = superficial + aggravated - active;
  if (overflow > 0) {
    const superficialReduction = Math.min(superficial, overflow);
    superficial -= superficialReduction;
    aggravated -= Math.min(aggravated, overflow - superficialReduction);
  }

  return {
    max,
    active,
    superficial,
    aggravated,
    boxes: buildResourceBoxes({ max, active, superficial, aggravated })
  };
}

function buildResourceBoxes(resource) {
  const filled = resource.active - resource.superficial - resource.aggravated;
  const states = [
    ...Array(filled).fill("filled"),
    ...Array(resource.superficial).fill("superficial"),
    ...Array(resource.aggravated).fill("aggravated"),
    ...Array(resource.max - resource.active).fill("empty")
  ];

  return states.map((state, index) => ({ index, state }));
}

function classifyDie(value, { useCriticals = true } = {}) {
  if (useCriticals && value === 10) {
    return {
      type: "critical",
      label: "Sucesso critico"
    };
  }

  if (value >= 6) {
    return {
      type: "success",
      label: "Sucesso"
    };
  }

  return {
    type: "failure",
    label: "Falha"
  };
}

function summarizeDicePool(values, { useCriticals = true } = {}) {
  const totalBase = values.reduce((total, value) => {
    if (value >= 6) return total + 1;
    return total;
  }, 0);
  const numTens = values.filter((v) => v === 10).length;
  const pairBonus = useCriticals ? Math.floor(numTens / 2) * 2 : 0;

  return { successes: totalBase + pairBonus };
}

function prepareDicePoolResults(values, { useCriticals = true, bloodCount = 0, voidCount = 0 } = {}) {
  let pairedCriticals = useCriticals ? Math.floor(values.filter((value) => value === 10).length / 2) * 2 : 0;

  return values.map((value, index) => {
    const classification = classifyDie(value, { useCriticals });
    const isPairedCritical = value === 10 && pairedCriticals > 0;

    if (isPairedCritical) pairedCriticals -= 1;

    return {
      value,
      ...classification,
      type: isPairedCritical ? `${classification.type} paired-critical` : classification.type,
      label: isPairedCritical ? "Par critico" : classification.label,
      isBlood: index < bloodCount,
      isVoid: index >= bloodCount && index < bloodCount + voidCount
    };
  });
}

function getRollValues(roll) {
  return roll.dice.flatMap((die) => die.results.map((result) => result.result));
}

async function renderAstraelTemplate(path, data) {
  const renderer = foundry.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;

  return renderer(path, data);
}

async function createDicePoolMessage({ actor, title, kicker, diceCount, useCriticals = true, preRolledValues = null, preRolledRoll = null, suppressReroll = false, bloodCount = 0, voidCount = 0 }) {
  let values;
  let roll;
  if (preRolledValues) {
    values = preRolledValues;
    roll = preRolledRoll;
  } else {
    roll = await new Roll(`${diceCount}d10`).evaluate();
    values = getRollValues(roll);
  }
  const summary = summarizeDicePool(values, { useCriticals });
  const dice = prepareDicePoolResults(values, { useCriticals, bloodCount, voidCount });
  const isRouseCheck = suppressReroll || (!useCriticals && diceCount === 1);
  const content = await renderAstraelTemplate(DICE_POOL_CHAT_TEMPLATE, {
    title,
    kicker,
    actorName: actor.name,
    actorId: actor.id,
    useCriticals,
    isRouseCheck,
    bloodCount,
    voidCount,
    dice,
    ...summary
  });

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: roll ? [roll] : []
  });
}

async function showRerollDialog(actor, originalValues, useCriticals, card, msg) {
  const bloodCount = Number(card?.dataset?.bloodCount) || 0;
  const voidCount = Number(card?.dataset?.voidCount) || 0;
  const diceHtml = originalValues.map((v, i) => {
    const cls = v >= 10 ? "critical" : v >= 6 ? "success" : "failure";
    const isBlood = i < bloodCount;
    const isVoid = i >= bloodCount && i < bloodCount + voidCount;
    const specClass = isBlood ? " blood-die" : isVoid ? " void-die" : "";
    const specAttr = isBlood ? ' data-blood="true"' : isVoid ? ' data-void="true"' : "";
    return `<span class="reroll-die ${cls}${specClass}" data-index="${i}"${specAttr}>${v}</span>`;
  }).join("");

  const rerollPrompt = game.i18n.localize("ASTRAEL.Chat.RerollPrompt");
  const rerollLimit = game.i18n.localize("ASTRAEL.Chat.RerollLimit");

  return new Dialog({
    title: game.i18n.localize("ASTRAEL.Chat.WillpowerReroll"),
    content: `
      <form class="reroll-form">
        <p>${rerollPrompt}</p>
        <div class="reroll-grid">${diceHtml}</div>
        <p class="reroll-hint">${rerollLimit}</p>
      </form>
    `,
    buttons: {
      reroll: {
        label: game.i18n.localize("ASTRAEL.Chat.WillpowerReroll"),
        callback: async (html) => {
          const selected = html.find(".reroll-die.selected").map((i, el) => Number($(el).data("index"))).get();
          if (selected.length < 1 || selected.length > 3) {
            ui.notifications.warn(rerollLimit);
            return false;
          }
          const newValues = [...originalValues];
          for (const idx of selected) {
            newValues[idx] = (await new Roll("1d10").evaluate()).total;
          }
          game.audio.play(CONFIG.sounds.dice, { context: game.audio.interface });

          const wp = actor.system.resources.willpower;
          const resource = { active: wp.active, superficial: wp.superficial, aggravated: wp.aggravated };
          if (resource.superficial + resource.aggravated < resource.active) {
            resource.superficial += 1;
          } else if (resource.superficial > 0) {
            resource.superficial -= 1;
            resource.aggravated += 1;
          }
          await actor.update({
            "system.resources.willpower.superficial": resource.superficial,
            "system.resources.willpower.aggravated": resource.aggravated
          });

          const title = card?.querySelector(".astrael-chat-header h2")?.textContent?.trim() || "";
          const kicker = card?.querySelector(".astrael-chat-kicker")?.textContent?.trim() || "";
          const actorName = card?.querySelector(".astrael-chat-header p")?.textContent?.trim() || "";
          const summary = summarizeDicePool(newValues, { useCriticals });
          const dice = prepareDicePoolResults(newValues, { useCriticals, bloodCount, voidCount });
          const newContent = await renderAstraelTemplate(DICE_POOL_CHAT_TEMPLATE, {
            title,
            kicker,
            actorName,
            actorId: actor.id,
            useCriticals,
            isRouseCheck: false,
            rerolled: true,
            bloodCount,
            voidCount,
            dice,
            ...summary
          });
          const wrapper = document.createElement('div');
          wrapper.innerHTML = newContent;
          wrapper.querySelector('.astrael-chat-card')?.setAttribute('data-rerolled-values', newValues.join(','));
          return msg.update({ content: wrapper.innerHTML });
        }
      }
    },
    default: "reroll",
    render: (html) => {
      html.find(".reroll-die:not([data-blood]):not([data-void])").on("click", function() {
        const count = html.find(".reroll-die.selected").length;
        if ($(this).hasClass("selected")) {
          $(this).removeClass("selected");
        } else if (count < 3) {
          $(this).addClass("selected");
        }
      });
    }
  }, { classes: ["astrael-dialog"] }).render(true);
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

class AstraelSpecialtiesPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "specialties-panel"],
    position: {
      width: 380,
      height: 680
    },
    window: {
      title: "Especialidades",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: SPECIALTIES_PANEL_TEMPLATE
    }
  };

  constructor(actor, ownerSheet, options = {}) {
    super(options);
    this.actor = actor;
    this.ownerSheet = ownerSheet;
  }

  get title() {
    return `${this.actor.name}: Especialidades`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actorData = this.actor.toObject();
    const specialties = Array.isArray(actorData.system?.specialties) ? actorData.system.specialties : [];

    context.actor = this.actor;
    context.specialties = specialties.map((spec, index) => this.#prepareSpecialty(spec, index));

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelector("[data-action='add-specialty-row']")?.addEventListener("click", this.#onAddSpecialty.bind(this));
    this.element.querySelectorAll("[data-action='edit-specialty-row']").forEach((button) => {
      button.addEventListener("click", this.#onEditSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-specialty-row']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='shift-specialty-level']").forEach((button) => {
      button.addEventListener("click", this.#onSpecialtyLevelClick.bind(this));
      button.addEventListener("contextmenu", this.#onSpecialtyLevelContext.bind(this));
    });
  }

  async close(options) {
    if (this.ownerSheet?._specialtiesPanel === this) this.ownerSheet._specialtiesPanel = null;
    return super.close(options);
  }

  anchorToSheet() {
    const sheetPosition = this.ownerSheet?.position;
    if (!sheetPosition) return;
    const top = sheetPosition.top || 0;
    const width = 380;
    const rightLeft = (sheetPosition.left || 0) + (sheetPosition.width || 900) + 8;
    const left = rightLeft + width > window.innerWidth - 12
      ? Math.max(12, (sheetPosition.left || 0) - width - 8)
      : rightLeft;

    return this.setPosition({
      left,
      top,
      width,
      height: sheetPosition.height || 680
    });
  }

  #prepareSpecialty(spec = {}, index) {
    const skill = spec.skill || "";
    return {
      index,
      skill,
      description: spec.description || "",
      level: normalizeAdvantageLevel(spec),
      levelRoman: toRomanLevel(normalizeAdvantageLevel(spec)),
      skillLabel: LOCALIZE_SKILL[skill] ? game.i18n.localize(LOCALIZE_SKILL[skill]) : "Perícia"
    };
  }

  #getSkillOptions(selected = "") {
    return SKILL_KEYS
      .filter(key => (foundry.utils.getProperty(this.actor.system, `skills.${key}.value`) || 0) > 0 || key === selected)
      .map(key => ({
        key,
        label: game.i18n.localize(LOCALIZE_SKILL[key]),
        selected: key === selected
      }));
  }

  #getSpecialties() {
    const actorData = this.actor.toObject();
    return Array.isArray(actorData.system?.specialties) ? [...actorData.system.specialties] : [];
  }

  #onAddSpecialty(event) {
    event.preventDefault();
    return this.#openSpecialtyDialog();
  }

  #onEditSpecialty(event) {
    event.preventDefault();
    return this.#openSpecialtyDialog(Number(event.currentTarget.dataset.index));
  }

  async #onDeleteSpecialty(event) {
    event.preventDefault();
    const row = event.currentTarget.closest(".specialties-panel-row");
    if (!row) return;

    const index = Number(row.dataset.index);
    if (index < 0) return;

    const specialties = this.#getSpecialties();
    specialties.splice(index, 1);
    await this.actor.update({ "system.specialties": specialties });
    return this.render({ force: true });
  }

  #openSpecialtyDialog(index = -1) {
    const specialties = this.#getSpecialties();
    const current = index >= 0 && specialties[index] ? specialties[index] : { skill: "", description: "", level: 1 };
    const skillOptions = this.#getSkillOptions(current.skill).map(option => (
      `<option value="${option.key}" ${option.selected ? "selected" : ""}>${escapeHtml(option.label)}</option>`
    )).join("");
    const level = normalizeAdvantageLevel(current);
    const title = index >= 0 ? "Editar Especialidade" : "Nova Especialidade";

    return new Dialog({
      title,
      content: `
        <form class="astrael-dialog-form specialty-edit-dialog">
          <header class="specialty-edit-hero">
            <div class="specialty-edit-icon" aria-hidden="true"></div>
            <div>
              <span>Registro tatico</span>
              <h3>${title}</h3>
            </div>
          </header>
          <div class="specialty-edit-grid">
            <div class="specialty-edit-field specialty-level-field">
              <span>Nível</span>
              <button type="button" class="specialty-dialog-rank" data-level="${level}" aria-label="Nível ${level}">${toRomanLevel(level)}</button>
              <input type="hidden" name="level" value="${level}">
            </div>
            <label class="specialty-edit-field specialty-skill-field">
              <span>Perícia</span>
              <select name="skill">${skillOptions || '<option value="">Nenhuma perícia com pontos</option>'}</select>
            </label>
          </div>
          <label class="specialty-edit-field specialty-definition-field">
            <span>Definição</span>
            <input type="text" name="description" value="${escapeHtml(current.description || "")}" placeholder="Ex: Cenas de crime, Duelos...">
          </label>
        </form>
      `,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: "Salvar",
          callback: async (html) => {
            const skill = html.find("[name='skill']").val();
            if (!skill) {
              ui.notifications.warn("Selecione uma perícia.");
              return false;
            }

            const next = {
              skill,
              description: html.find("[name='description']").val()?.trim() || "",
              level: normalizeAdvantageLevel({ level: html.find("[name='level']").val() })
            };
            const list = this.#getSpecialties();
            if (index >= 0 && list[index]) list[index] = next;
            else list.push(next);
            await this.actor.update({ "system.specialties": list });
            return this.render({ force: true });
          }
        }
      },
      default: "save",
      render: (html) => {
        const updateLevel = (button, delta) => {
          const nextLevel = clampNumber((Number(button.dataset.level) || 1) + delta, 1, 5);
          button.dataset.level = String(nextLevel);
          button.textContent = toRomanLevel(nextLevel);
          button.setAttribute("aria-label", `Nível ${nextLevel}`);
          html.find("[name='level']").val(String(nextLevel));
        };

        html.find(".specialty-dialog-rank").on("click", function(event) {
          event.preventDefault();
          updateLevel(this, 1);
        });
        html.find(".specialty-dialog-rank").on("contextmenu", function(event) {
          event.preventDefault();
          updateLevel(this, -1);
        });
      }
    }, { classes: ["astrael-dialog"], jQuery: true }).render(true);
  }

  async #onSpecialtyLevelClick(event) {
    event.preventDefault();
    return this.#shiftSpecialtyLevel(event.currentTarget, 1);
  }

  async #onSpecialtyLevelContext(event) {
    event.preventDefault();
    return this.#shiftSpecialtyLevel(event.currentTarget, -1);
  }

  async #shiftSpecialtyLevel(button, delta) {
    const row = button.closest(".specialties-panel-row");
    if (!row) return;

    const level = clampNumber((Number(button.dataset.level) || 1) + delta, 1, 5);
    button.dataset.level = String(level);
    button.textContent = toRomanLevel(level);

    const index = Number(row.dataset.index);
    if (index < 0) return;

    const specialties = this.#getSpecialties();
    if (!specialties[index]) return;

    specialties[index] = { ...specialties[index], level };
    await this.actor.update({ "system.specialties": specialties });
    return this.render({ force: true });
  }
}

class AstraelCompactPortraitEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "compact-portrait-editor"],
    position: {
      width: 400,
      height: 520
    },
    window: {
      title: "Portrait Framing",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: COMPACT_PORTRAIT_EDITOR_TEMPLATE
    }
  };

  constructor(actor, ownerSheet, options = {}) {
    super(options);
    this.actor = actor;
    this.ownerSheet = ownerSheet;
    this.framing = getCompactPortraitFraming(actor);
    this.dragState = null;
  }

  get title() {
    return `${this.actor.name}: ${game.i18n.localize("ASTRAEL.CompactPortrait.Title")}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.framing = {
      ...prepareCompactPortraitPresentation(this.framing),
      zoomLabel: this.framing.zoom.toFixed(2)
    };
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const preview = this.element.querySelector("[data-portrait-preview]");
    preview?.addEventListener("pointerdown", this.#onPointerDown.bind(this));
    preview?.addEventListener("pointermove", this.#onPointerMove.bind(this));
    preview?.addEventListener("pointerup", this.#onPointerEnd.bind(this));
    preview?.addEventListener("pointercancel", this.#onPointerEnd.bind(this));
    this.element.querySelector("[data-action='change-compact-portrait-image']")?.addEventListener("click", this.#onChangeImage.bind(this));
    this.element.querySelector("[data-action='reset-compact-portrait']")?.addEventListener("click", this.#onReset.bind(this));
    this.element.querySelector("[data-action='cancel-compact-portrait']")?.addEventListener("click", () => this.close());
    this.element.querySelector("[data-action='save-compact-portrait']")?.addEventListener("click", this.#onSave.bind(this));
    this.element.querySelector("[data-action='set-compact-portrait-zoom']")?.addEventListener("input", this.#onZoomInput.bind(this));
  }

  async close(options) {
    if (this.ownerSheet?._compactPortraitEditor === this) this.ownerSheet._compactPortraitEditor = null;
    const result = await super.close(options);
    this.ownerSheet?.element?.querySelector("[data-action='edit-compact-portrait']")?.focus();
    return result;
  }

  #refreshPreview() {
    const image = this.element.querySelector("[data-portrait-preview] img");
    if (image) {
      const presentation = prepareCompactPortraitPresentation(this.framing);
      image.style.objectPosition = `${this.framing.x}% ${this.framing.y}%`;
      image.style.transform = `scale(${presentation.zoom}) translate(${presentation.panX}%, ${presentation.panY}%)`;
    }
    const zoomLabel = this.element.querySelector("[data-portrait-zoom-label]");
    if (zoomLabel) zoomLabel.textContent = `${this.framing.zoom.toFixed(2)}×`;
  }

  #onPointerDown(event) {
    if (event.button !== 0) return;
    const preview = event.currentTarget;
    preview.setPointerCapture(event.pointerId);
    preview.classList.add("is-dragging");
    this.dragState = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: this.framing.x,
      y: this.framing.y
    };
  }

  #onPointerMove(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    this.framing.x = clampNumber(this.dragState.x - ((event.clientX - this.dragState.clientX) / rect.width) * 100, 0, 100);
    this.framing.y = clampNumber(this.dragState.y - ((event.clientY - this.dragState.clientY) / rect.height) * 100, 0, 100);
    this.#refreshPreview();
  }

  #onPointerEnd(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    event.currentTarget.classList.remove("is-dragging");
    this.dragState = null;
  }

  #onZoomInput(event) {
    this.framing.zoom = clampNumber(event.currentTarget.value, 1, 3);
    this.#refreshPreview();
  }

  #onChangeImage(event) {
    event.preventDefault();
    const picker = new FilePicker({
      type: "image",
      current: this.framing.src,
      callback: (path) => {
        this.framing = { src: path, x: 50, y: 50, zoom: 1 };
        return this.render({ force: true });
      }
    });
    return picker.browse();
  }

  #onReset(event) {
    event.preventDefault();
    this.framing = { ...this.framing, x: 50, y: 50, zoom: 1 };
    return this.render({ force: true });
  }

  async #onSave(event) {
    event.preventDefault();
    const framing = {
      src: this.framing.src,
      x: this.framing.x,
      y: this.framing.y,
      zoom: this.framing.zoom
    };
    await this.actor.update({
      img: framing.src,
      [`flags.${SYSTEM_ID}.compactPortrait`]: framing
    });
    return this.close();
  }
}

class AstraelStrangerMarksPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "stranger-marks-panel"],
    position: {
      width: 330,
      height: 680
    },
    window: {
      title: "Marcas",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: STRANGER_MARKS_PANEL_TEMPLATE
    }
  };

  constructor(actor, ownerSheet, options = {}) {
    super(options);
    this.actor = actor;
    this.ownerSheet = ownerSheet;
  }

  get title() {
    return `${this.actor.name}: Marcas`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sm = this.#getStrangerMarkData();
    const sortedMarks = [...sm.marks].sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.label.localeCompare(b.label);
    });
    const selectedMarkId = sm.selectedMarkId && sm.marks.some(m => m.option === sm.selectedMarkId)
      ? sm.selectedMarkId
      : (sortedMarks[0]?.option || "");

    context.actor = this.actor;
    context.marks = STRANGER_MARK_OPTIONS.map((opt) => {
      const owned = sm.marks.find((m) => m.option === opt.id);
      return {
        ...opt,
        option: opt.id,
        level: owned ? owned.level : 0,
        owned: !!owned,
        selected: opt.id === selectedMarkId
      };
    });

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelectorAll("[data-action='select-stranger-mark']").forEach((button) => {
      button.addEventListener("click", this.#onSelectStrangerMark.bind(this));
    });
  }

  async close(options) {
    if (this.ownerSheet?._strangerMarksPanel === this) this.ownerSheet._strangerMarksPanel = null;
    return super.close(options);
  }

  anchorToSheet() {
    const sheetPosition = this.ownerSheet?.position;
    if (!sheetPosition) return;
    const width = 330;
    const left = Math.max(12, (sheetPosition.left || 0) - width - 8);
    const top = sheetPosition.top || 0;

    return this.setPosition({
      left,
      top,
      width,
      height: sheetPosition.height || 680
    });
  }

  #getStrangerMarkData() {
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    return {
      selectedMarkId: sm.selectedMarkId || "",
      selectedAbilityLevel: clampNumber(sm.selectedAbilityLevel ?? 1, 1, 5),
      marks: Array.isArray(sm.marks) ? sm.marks.map(normalizeStrangerMark) : []
    };
  }

  async #updateStrangerMark(data) {
    const current = this.#getStrangerMarkData();
    await this.actor.update({ "system.strangerMark": { ...current, ...data } });
    await this.ownerSheet?.render({ force: true });
    return this.render({ force: true });
  }

  async #onSelectStrangerMark(event) {
    event.preventDefault();
    const optionId = event.currentTarget.dataset.option;
    const sm = this.#getStrangerMarkData();
    const owned = sm.marks.some((m) => m.option === optionId);
    if (!owned) {
      sm.marks.push({ option: optionId, level: 0, abilities: [] });
    }
    return this.#updateStrangerMark({
      selectedMarkId: optionId,
      selectedAbilityLevel: 1,
      marks: sm.marks
    });
  }
}

class AstraelCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static LAYOUT_OPTIONS = {
    width: 900,
    minWidth: 900,
    minHeight: 450,
    heightSetting: "sheetHeight"
  };

  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "sheet", "actor"],
    position: {
      width: 900,
      height: 680
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: updateActorSheet
    },
    window: {
      title: "Astrael RPG Character Sheet",
      resizable: true
    }
  };

  static PARTS = {
    form: {
      template: CHARACTER_SHEET_TEMPLATE
    }
  };

  get title() {
    return `${game.i18n.localize("ASTRAEL.Sheet.Character")}: ${this.actor.name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const systemData = this.actor.system?.toObject?.() ?? this.actor.system;

    context.actor = this.actor;
    context.system = foundry.utils.mergeObject(
      { resources: DEFAULT_RESOURCES },
      systemData,
      { inplace: false }
    );
    context.system.attributes ??= {};
    for (const key of ATTRIBUTE_KEYS) {
      const attr = context.system.attributes[key];
      if (!attr || !Number.isFinite(Number(attr.value)) || Number(attr.value) < 1) {
        context.system.attributes[key] = { value: 1 };
      }
    }
    const resourceUpdate = {};
    for (const resourceId of ["health", "willpower"]) {
      const raw = context.system.resources[resourceId] ?? {};
      const normalized = normalizeResource(resourceId, {
        ...raw,
        active: calculateResourceActive(resourceId, context.system)
      });
      context.system.resources[resourceId] = normalized;
      for (const key of ["max", "active", "superficial", "aggravated"]) {
        if (raw[key] !== normalized[key]) {
          resourceUpdate[`system.resources.${resourceId}.${key}`] = normalized[key];
        }
      }
    }
    if (Object.keys(resourceUpdate).length) await this.actor.update(resourceUpdate);
    context.system.sheetSettings ??= {};
    context.system.sheetSettings.visibleTabs = normalizeVisibleTabs(context.system.sheetSettings.visibleTabs);
    if (["character", "npc"].includes(this.actor.type) && this.#isCharacterTabHidden(this._activeTab, context.system.sheetSettings.visibleTabs)) {
      this._activeTab = "attributes";
    }
    context.system.resources.health.activeRoman = toRoman(context.system.resources.health.active);
    context.system.resources.willpower.activeRoman = toRoman(context.system.resources.willpower.active);
    context.system.sangria ??= { value: 5 };
    if (!Number.isFinite(Number(context.system.sangria.value))) context.system.sangria.value = 5;
    context.system.vazio ??= { value: 0 };
    if (!Number.isFinite(Number(context.system.vazio.value))) context.system.vazio.value = 0;
    context.system.skills ??= {};
    for (const key of SKILL_KEYS) {
      const skill = context.system.skills[key];
      if (!skill || !Number.isFinite(Number(skill.value))) {
        context.system.skills[key] = { value: 0 };
      }
    }
    context.system.specialties = Array.isArray(context.system.specialties) ? context.system.specialties : [];
    context.system.customRolls = Array.isArray(context.system.customRolls) ? context.system.customRolls : [];
    context.system.advantages = Array.isArray(context.system.advantages) ? context.system.advantages : [];
    context.system.flaws = Array.isArray(context.system.flaws) ? context.system.flaws : [];
    context.system.convictions = normalizeConvictionList(Array.isArray(context.system.convictions) ? context.system.convictions : []).map((conviction, index) => {
      const normalized = normalizeConviction(conviction, index);
      return {
        ...normalized,
        index,
        editing: index === this._editingConvictionIndex,
        isCenter: index === CONVICTION_CENTER_INDEX,
        pillar: normalized.pillars[0],
        fractureBoxes: buildFractureBoxes(normalized.fractures),
        pillarTypeOptions: getConvictionPillarTypeOptions(normalized.pillars[0].type)
      };
    });
    context.system.hemomancy ??= { level: 0, alchemyLevel: 0, powers: [], formulas: [] };
    context.system.hemomancy.level = clampNumber(context.system.hemomancy.level, 0, 5);
    context.system.hemomancy.alchemyLevel = clampNumber(context.system.hemomancy.alchemyLevel, 0, 5);
    context.system.hemomancy.powers = Array.isArray(context.system.hemomancy.powers) ? context.system.hemomancy.powers.map(normalizeHemomancyPower) : [];
    context.system.hemomancy.formulas = Array.isArray(context.system.hemomancy.formulas) ? context.system.hemomancy.formulas.map(normalizeHemomancyPower) : [];
    context.system.advantages = context.system.advantages.map(prepareAdvantageEntry);
    context.system.flaws = context.system.flaws.map(prepareAdvantageEntry);
    this.#prepareAdvantageSelection(context.system);
    this.#prepareHemomancySelection(context.system);
    context.system.virtues = Array.isArray(context.system.virtues) ? context.system.virtues.map(normalizeVirtue) : [];
    this.#prepareVirtueSelection(context.system);
    context.system.strangerMark ??= { selectedMarkId: "", selectedAbilityLevel: 1, marks: [] };
    {
      const sm = context.system.strangerMark;
      sm.selectedAbilityLevel = clampNumber(sm.selectedAbilityLevel ?? 1, 1, 5);
      sm.selectedAbilityLevelRoman = toRomanLevel(sm.selectedAbilityLevel);
      sm.marks = Array.isArray(sm.marks) ? sm.marks.map(normalizeStrangerMark) : [];

      const existingIds = new Set(sm.marks.map((m) => m.option));
      for (const opt of STRANGER_MARK_OPTIONS) {
        if (!existingIds.has(opt.id)) {
          sm.marks.push(normalizeStrangerMark({ option: opt.id, level: 0, abilities: [] }));
        }
      }

      const hasSelectedMark = sm.marks.some((m) => m.option === sm.selectedMarkId);
      if (!hasSelectedMark) {
        const sortedMarks = [...sm.marks].sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          return a.label.localeCompare(b.label);
        });
        const defaultId = sortedMarks[0]?.option || "";
        sm.selectedMarkId = defaultId;
        if (defaultId && this.isEditable) {
          void this.actor.update({ "system.strangerMark.selectedMarkId": defaultId });
        }
      }
      sm.marks = sm.marks.map((mark) => ({
        ...mark,
        selected: mark.option === sm.selectedMarkId
      }));

      const selectedMark = sm.marks.find((m) => m.option === sm.selectedMarkId) ?? null;
      sm.selectedMark = selectedMark ? { ...selectedMark } : null;

      const ownedOptionIds = sm.marks.map((m) => m.option);
      sm.availableOptions = STRANGER_MARK_OPTIONS.reduce((acc, opt) => {
        acc[opt.id] = { ...opt, owned: ownedOptionIds.includes(opt.id) };
        return acc;
      }, {});

      if (selectedMark) {
        const visibleAbilities = selectedMark.abilities
          .map((a, i) => ({ ...a, index: i }))
          .filter((a) => a.level === sm.selectedAbilityLevel && a.level <= selectedMark.level);
        sm.abilityLevelTabs = [1, 2, 3, 4, 5].map((level) => ({
          level,
          roman: toRomanLevel(level),
          active: level === sm.selectedAbilityLevel
        }));

        const selectedAbilityIndex = Number.isInteger(this._selectedStrangerMarkAbilityIndex) ? this._selectedStrangerMarkAbilityIndex : -1;
        const selectedAbility = selectedMark.abilities[selectedAbilityIndex];
        const idx = selectedAbility && selectedAbility.level <= selectedMark.level
          ? selectedAbilityIndex
          : (visibleAbilities[0]?.index ?? -1);
        this._selectedStrangerMarkAbilityIndex = idx;
        sm.visibleAbilities = visibleAbilities.map((ability) => ({
          ...ability,
          selected: ability.index === idx
        }));
        sm.selectedAbility = idx >= 0
          ? { ...selectedMark.abilities[idx], index: idx, rollFormula: `${selectedMark.label} (Nível ${selectedMark.levelRoman})` }
          : null;
        sm.abilityRows = [1, 2, 3, 4, 5].map((level) => ({
          level,
          roman: toRomanLevel(level),
          active: level === sm.selectedAbilityLevel,
          abilities: selectedMark.abilities
            .map((ability, index) => ({ ...ability, index, selected: index === idx }))
            .filter((ability) => ability.level === level)
        }));
      } else {
        sm.visibleAbilities = [];
        sm.abilityLevelTabs = [1, 2, 3, 4, 5].map((level) => ({
          level,
          roman: toRomanLevel(level),
          active: level === sm.selectedAbilityLevel
        }));
        sm.abilityRows = [1, 2, 3, 4, 5].map((level) => ({
          level,
          roman: toRomanLevel(level),
          active: false,
          abilities: []
        }));
        sm.selectedAbility = null;
        this._selectedStrangerMarkAbilityIndex = -1;
      }
    }
    {
      const hasMarkLevel = (context.system.strangerMark?.marks || []).some(m => Number(m.level) >= 1);
      const minVazio = hasMarkLevel ? 1 : 0;
      const currentVazio = Number(context.system.vazio?.value) ?? 0;
      if (currentVazio < minVazio) {
        context.system.vazio.value = minVazio;
        await this.actor.update({ "system.vazio.value": minVazio });
      }
    }
    context.system.specialties = context.system.specialties.map(spec => ({
      ...spec,
      skillLabel: LOCALIZE_SKILL[spec.skill] ? game.i18n.localize(LOCALIZE_SKILL[spec.skill]) : spec.skill || ""
    }));
    context.system.xp ??= { total: 0, current: 0, spent: 0 };
    context.system.xp.total = Math.max(0, context.system.xp.total || 0);
    context.system.xp.current = Math.max(0, context.system.xp.total - (context.system.xp.spent || 0));
    context.cssClass = this.isEditable ? "editable" : "locked";

    return context;
  }

  _preRender(options) {
    this.#saveSheetScroll();
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.#restoreSheetScroll();

    this.element.querySelectorAll(".resource-box").forEach((box) => {
      box.addEventListener("click", this.#onResourceBoxClick.bind(this));
      box.addEventListener("contextmenu", this.#onResourceBoxContext.bind(this));
    });

    this.element.querySelectorAll(".astrael-compact-resource").forEach((resource) => {
      resource.addEventListener("click", this.#onCompactResourceClick.bind(this));
      resource.addEventListener("contextmenu", this.#onCompactResourceContext.bind(this));
    });

    this.element.querySelectorAll(".fracture-box").forEach((box) => {
      box.addEventListener("click", this.#onFractureBoxClick.bind(this));
      box.addEventListener("contextmenu", this.#onFractureBoxContext.bind(this));
    });

    this.element.querySelectorAll("[data-damage]").forEach((button) => {
      button.addEventListener("click", this.#onDamageButtonClick.bind(this));
      button.addEventListener("contextmenu", this.#onDamageButtonContext.bind(this));
    });

    this.element.querySelectorAll("input[name]").forEach((input) => {
      input.addEventListener("change", this.#onInputChange.bind(this));
    });

    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach((btn) => {
      btn.addEventListener("click", this.#onTabClick.bind(this));
    });

    this.element.querySelectorAll(".dot-track").forEach((track) => {
      track.addEventListener("click", this.#onDotClick.bind(this));
      track.addEventListener("contextmenu", this.#onDotContext.bind(this));
    });

    this.element.querySelectorAll("[data-action='adjust-resource']").forEach((btn) => {
      btn.addEventListener("click", this.#onAdjustResource.bind(this));
    });

    this.element.querySelectorAll(".rollable").forEach((el) => {
      el.addEventListener("click", this.#onRollClick.bind(this));
    });

    this.element.querySelector("[data-action='open-specialties']")?.addEventListener("click", this.#onOpenSpecialties.bind(this));

    this.element.querySelector("[data-action='add-custom-roll']")?.addEventListener("click", this.#onAddCustomRoll.bind(this));

    this.#restoreAdvantageScrolls();
    this.element.querySelectorAll("[data-action='edit-custom-roll']").forEach((el) => {
      el.addEventListener("click", this.#onEditCustomRoll.bind(this));
    });
    this.element.querySelectorAll(".custom-roll-entry").forEach((el) => {
      el.addEventListener("click", this.#onCustomRollClick.bind(this));
    });
    this.element.querySelector("[data-action='add-advantage-entry']")?.addEventListener("click", this.#onAddAdvantageEntry.bind(this));
    this.element.querySelectorAll("[data-action='set-advantage-mode']").forEach((button) => {
      button.addEventListener("click", this.#onSetAdvantageMode.bind(this));
    });
    this.element.querySelectorAll("[data-action='select-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onSelectAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll("[data-action='edit-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onEditAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onSaveAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll("[data-action='roll-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onRollAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll(".advantage-rank").forEach((rank) => {
      rank.addEventListener("click", this.#onAdvantageRankClick.bind(this));
      rank.addEventListener("contextmenu", this.#onAdvantageRankContext.bind(this));
    });
    this.element.querySelectorAll("[data-action='edit-conviction']").forEach((button) => {
      button.addEventListener("click", this.#onEditConviction.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-conviction']").forEach((button) => {
      button.addEventListener("click", this.#onSaveConviction.bind(this));
    });
    this.element.querySelectorAll("[data-action='set-hemomancy-mode']").forEach((button) => {
      button.addEventListener("click", this.#onSetHemomancyMode.bind(this));
    });
    this.element.querySelectorAll("[data-action='set-hemomancy-list-mode']").forEach((button) => {
      button.addEventListener("click", this.#onSetHemomancyListMode.bind(this));
    });
    this.element.querySelector("[data-action='add-hemomancy-power']")?.addEventListener("click", this.#onAddHemomancyPower.bind(this));
    this.element.querySelectorAll("[data-action='select-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onSelectHemomancyPower.bind(this));
    });
    this.element.querySelectorAll("[data-action='edit-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onEditHemomancyPower.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onSaveHemomancyPower.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteHemomancyPower.bind(this));
    });
    this.element.querySelectorAll("[data-action='roll-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onRollHemomancyPower.bind(this));
    });
    this.element.querySelector(".hemomancy-level-control")?.addEventListener("click", this.#onHemomancyLevelClick.bind(this));
    this.element.querySelector(".hemomancy-level-control")?.addEventListener("contextmenu", this.#onHemomancyLevelContext.bind(this));

    this.element.querySelectorAll("[data-action='select-virtue']").forEach((button) => {
      button.addEventListener("click", this.#onSelectVirtue.bind(this));
    });
    this.element.querySelector("[data-action='add-virtue']")?.addEventListener("click", this.#onAddVirtue.bind(this));
    this.element.querySelectorAll("[data-action='edit-virtue']").forEach((button) => {
      button.addEventListener("click", this.#onEditVirtue.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-virtue']").forEach((button) => {
      button.addEventListener("click", this.#onSaveVirtue.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-virtue']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteVirtue.bind(this));
    });
    this.element.querySelectorAll("[data-action='add-virtue-perk']").forEach((button) => {
      button.addEventListener("click", this.#onAddVirtuePerk.bind(this));
    });
    this.element.querySelectorAll("[data-action='toggle-virtue-perk']").forEach((button) => {
      button.addEventListener("click", this.#onToggleVirtuePerk.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-virtue-perk']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteVirtuePerk.bind(this));
    });
    this.element.querySelectorAll("[data-action='toggle-character-tab']").forEach((button) => {
      button.addEventListener("click", this.#onToggleCharacterTab.bind(this));
    });

    this.element.querySelectorAll("[data-action='open-stranger-mark-picker']").forEach((btn) => {
      btn.addEventListener("click", this.#onOpenStrangerMarkPicker.bind(this));
    });
    this.element.querySelectorAll("[data-action='add-stranger-mark']").forEach((btn) => {
      btn.addEventListener("click", this.#onAddStrangerMark.bind(this));
    });
    this.element.querySelectorAll("[data-action='select-stranger-mark']").forEach((btn) => {
      btn.addEventListener("click", this.#onSelectStrangerMark.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-stranger-mark']").forEach((btn) => {
      btn.addEventListener("click", this.#onDeleteStrangerMark.bind(this));
    });
    this.element.querySelector(".stranger-mark-level-control")?.addEventListener("click", this.#onStrangerMarkLevelClick.bind(this));
    this.element.querySelector(".stranger-mark-level-control")?.addEventListener("contextmenu", this.#onStrangerMarkLevelContext.bind(this));
    this.element.querySelectorAll("[data-action='set-stranger-mark-ability-level']").forEach((btn) => {
      btn.addEventListener("click", this.#onSetStrangerMarkAbilityLevel.bind(this));
    });
    this.element.querySelectorAll("[data-action='add-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onAddStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='select-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onSelectStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='edit-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onEditStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onSaveStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onDeleteStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='roll-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onRollStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='toggle-stranger-marks-panel']").forEach((btn) => {
      btn.addEventListener("click", this.#onToggleStrangerMarksPanel.bind(this));
    });
    this.element.querySelector("[data-action='editImage']")?.addEventListener("click", this.#onEditImage.bind(this));
    this.element.querySelector("[data-action='rouseCheck']")?.addEventListener("click", this.#onRouseCheck.bind(this));

    {
      const card = this.element.querySelector(".custom-roll-card");
      if (card) {
        if (this._customRollsOpen) card.setAttribute("open", "");
        card.addEventListener("toggle", () => { this._customRollsOpen = card.open; });
      }
    }

    if (this._activeTab) this.#activateTab(this._activeTab);
    else this.element.dataset.activeTab = "attributes";
  }

  async #onRollClick(event) {
    event.preventDefault();
    if (event.target.closest("button, input, textarea, select")) return;
    const element = event.currentTarget;
    if (element.classList.contains("is-editing")) return;
    const type = element.dataset.type;
    const key = element.dataset.key;

    const ROLL_MODES = [
      { key: "skill", label: "Perícia" },
      { key: "attribute", label: "Atributo" },
      { key: "advantage", label: "Vantagem" }
    ];

    const allAttrOptions = ATTRIBUTE_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
    ).join("");

    const allSkillOptions = SKILL_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`
    ).join("");

    const allAdvantageOptions = (() => {
      const advs = Array.isArray(this.actor.system.advantages) ? this.actor.system.advantages : [];
      if (!advs.length) return '<option value="">Nenhuma vantagem</option>';
      return advs.map((a, i) => `<option value="${i}">${a.name}</option>`).join("");
    })();

    const initialModeIndex = type === "attribute" ? 1 : type === "advantage" ? 2 : 0;
    const initialMode = ROLL_MODES[initialModeIndex];
    const initialSecondOptions =
      initialMode.key === "attribute" ? allAttrOptions :
      initialMode.key === "advantage" ? allAdvantageOptions :
      allSkillOptions;

    const content = `
      <form class="astrael-dialog-form">
        <div class="form-row">
          <div class="form-group">
            <label>Atributo</label>
            <select name="attribute">${allAttrOptions}</select>
          </div>
          <div class="form-group mode-group">
            <div class="mode-header">
              <button type="button" class="mode-arrow" data-dir="prev">&#9664;</button>
              <span class="mode-label">${initialMode.label}</span>
              <button type="button" class="mode-arrow" data-dir="next">&#9654;</button>
            </div>
            <select name="second">${initialSecondOptions}</select>
            <input type="hidden" name="mode" value="${initialMode.key}">
          </div>
        </div>
        <div class="pool-preview">
          <span class="pool-total"></span>
        </div>
        <div class="bottom-row">
          <div class="form-group modifier-group">
            <label>Modificador</label>
            <input type="number" name="modifier" value="0" step="1">
          </div>
          <div class="form-group specialty-group">
            <label>Especialidade</label>
            <select name="specialty">
              <option value="">Nenhuma</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const dialog = new Dialog({
      title: "Teste de Parada de Dados",
      content,
      buttons: {
        roll: {
          label: "Rolar",
          callback: (html) => {
            const attrKey = html.find("[name='attribute']").val();
            const secondKey = html.find("[name='second']").val();
            const modeKey = html.find("[name='mode']").val();
            const modifier = Number(html.find("[name='modifier']").val()) || 0;
            const specialty = modeKey === "skill" ? html.find("[name='specialty']").val() : "";
            const specialtyBonus = specialty ? 1 : 0;
            const system = this.actor.system;

            const attrValue = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
            let secondValue, titleLeft, titleRight;

            if (modeKey === "skill") {
              secondValue = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
              titleLeft = game.i18n.localize(LOCALIZE_SKILL[secondKey]);
              titleRight = game.i18n.localize(LOCALIZE_ATTR[attrKey]);
            } else if (modeKey === "advantage") {
              const advs = Array.isArray(system.advantages) ? system.advantages : [];
              const adv = advs[Number(secondKey)];
              secondValue = adv ? (adv.level || 1) : 0;
              titleLeft = adv ? adv.name : "Vantagem";
              titleRight = game.i18n.localize(LOCALIZE_ATTR[attrKey]);
            } else {
              secondValue = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
              titleLeft = game.i18n.localize(LOCALIZE_ATTR[secondKey]);
              titleRight = game.i18n.localize(LOCALIZE_ATTR[attrKey]);
            }

            const diceCount = Math.max(1, attrValue + secondValue + modifier + specialtyBonus);

            console.group("Astrael RPG | Detalhes da Rolagem");
            console.log("Atributo:", attrKey, attrValue);
            console.log("Modo:", modeKey, "Chave:", secondKey, secondValue);
            console.log("Modificador:", modifier);
            if (specialty) console.log("Especialidade:", specialty, "+1 dado");
            console.log("Total de Dados:", diceCount);
            console.groupEnd();

            const titleSuffix = specialty ? ` (${specialty})` : "";

            const rawBlood = Math.max(0, 5 - (Number(this.actor.system.sangria?.value) || 5));
            const rawVoid = Math.max(0, Number(this.actor.system.vazio?.value) || 0);
            const actualBlood = Math.min(rawBlood, diceCount);
            const actualVoid = Math.min(rawVoid, diceCount - actualBlood);
            return createDicePoolMessage({
              actor: this.actor,
              title: `${titleLeft} + ${titleRight}${titleSuffix}`,
              kicker: "Teste de Perícia",
              diceCount: diceCount,
              bloodCount: actualBlood,
              voidCount: actualVoid
            });
          }
        }
      },
      default: "roll",
      render: (html) => {
        let modeIndex = initialModeIndex;

        const buildOptions = (modeKey, excludeAttr) => {
          if (modeKey === "attribute") {
            return ATTRIBUTE_KEYS
              .filter((k) => k !== excludeAttr)
              .map((k) => `<option value="${k}">${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`)
              .join("");
          }
          if (modeKey === "advantage") {
            const advs = Array.isArray(this.actor.system.advantages) ? this.actor.system.advantages : [];
            if (!advs.length) return '<option value="">Nenhuma vantagem</option>';
            return advs.map((a, i) => `<option value="${i}">${a.name}</option>`).join("");
          }
          return SKILL_KEYS
            .map((k) => `<option value="${k}">${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`)
            .join("");
        };

        const switchMode = (dir) => {
          modeIndex = (modeIndex + dir + ROLL_MODES.length) % ROLL_MODES.length;
          const mode = ROLL_MODES[modeIndex];
          const attrKey = html.find("[name='attribute']").val();
          const options = buildOptions(mode.key, mode.key === "attribute" ? attrKey : null);
          html.find(".mode-label").text(mode.label);
          html.find("[name='mode']").val(mode.key);
          html.find("[name='second']").html(options);
          html.find("[name='second'] option:first").prop("selected", true);
          html.find(".specialty-group").toggle(mode.key === "skill");
          html.find(".modifier-group").toggleClass("span-full", mode.key !== "skill");
          if (mode.key === "skill") populateSpecialties(html.find("[name='second']").val());
          updatePreview();
        };

        const populateSpecialties = (skillKey) => {
          const select = html.find("[name='specialty']");
          const actorData = this.actor.toObject();
          const specialties = Array.isArray(actorData.system.specialties) ? actorData.system.specialties : [];
          const filtered = specialties.filter(s => s.skill === skillKey);
          let opts = '<option value="">Nenhuma</option>';
          filtered.forEach(s => {
            opts += `<option value="${s.description}">${s.description}</option>`;
          });
          select.html(opts);
          select.prop("disabled", filtered.length === 0);
        };

        const updatePreview = () => {
          const attrKey = html.find("[name='attribute']").val();
          const secondKey = html.find("[name='second']").val();
          const modeKey = html.find("[name='mode']").val();
          const modifier = Number(html.find("[name='modifier']").val()) || 0;
          const specialtyBonus = modeKey === "skill" && html.find("[name='specialty']").val() ? 1 : 0;
          const system = this.actor.system;

          const attrVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
          let secondVal;
          if (modeKey === "skill") {
            secondVal = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
          } else if (modeKey === "advantage") {
            const advs = Array.isArray(system.advantages) ? system.advantages : [];
            const adv = advs[Number(secondKey)];
            secondVal = adv ? (adv.level || 1) : 0;
          } else {
            secondVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
          }

          html.find(".pool-total").text(`${Math.max(1, attrVal + secondVal + modifier + specialtyBonus)} dados`);
        };

        html.find(".mode-arrow").on("click", (e) => {
          const dir = $(e.currentTarget).data("dir") === "next" ? 1 : -1;
          switchMode(dir);
        });

        html.find("[name='attribute']").on("change", () => {
          if (html.find("[name='mode']").val() === "attribute") {
            const attrKey = html.find("[name='attribute']").val();
            const currentVal = html.find("[name='second']").val();
            const options = buildOptions("attribute", attrKey);
            html.find("[name='second']").html(options);
            if (html.find(`[name='second'] option[value="${currentVal}"]`).length) {
              html.find("[name='second']").val(currentVal);
            } else {
              html.find("[name='second'] option:first").prop("selected", true);
            }
          }
          updatePreview();
        });

        html.find("[name='second']").on("change", function() {
          if (html.find("[name='mode']").val() === "skill") {
            populateSpecialties($(this).val());
          }
        });

        html.find("[name='second'], [name='modifier']").on("change input", updatePreview);

        html.find("[name='specialty']").on("change", updatePreview);

        if (type === "attribute") {
          const differentAttr = ATTRIBUTE_KEYS.find((k) => k !== key) || ATTRIBUTE_KEYS[0];
          html.find("[name='attribute']").val(differentAttr);
          html.find("[name='second']").val(key);
        } else if (type === "advantage") {
          html.find("[name='attribute']").val(ATTRIBUTE_KEYS[0]);
          html.find("[name='second']").val(key);
        } else {
          html.find("[name='second']").val(key);
        }

        updatePreview();
        html.find(".specialty-group").toggle(initialMode.key === "skill");
        html.find(".modifier-group").toggleClass("span-full", initialMode.key !== "skill");
        if (initialMode.key === "skill") populateSpecialties(html.find("[name='second']").val());
      }
    }, { classes: ["astrael-dialog"] });

    return dialog.render(true);
  }

  async #onInputChange(event) {
    const input = event.currentTarget;
    let value = input.value;
    if (input.type === "number" && input.name?.startsWith("system.skills.")) {
      value = Math.max(0, Number(input.value) || 0);
      input.value = value;
    }

    return this.actor.update({ [input.name]: value });
  }

  #getSpecialDiceCounts(diceCount) {
    const rawBlood = Math.max(0, 5 - (Number(this.actor.system.sangria?.value) || 5));
    const rawVoid = Math.max(0, Number(this.actor.system.vazio?.value) || 0);

    return {
      bloodCount: Math.min(rawBlood, diceCount),
      voidCount: Math.min(rawVoid, diceCount - Math.min(rawBlood, diceCount))
    };
  }

  #dotMin(name) {
    if (name?.startsWith("system.skills") || name?.startsWith("system.sangria") || name?.startsWith("system.vazio")) return 0;
    return 1;
  }

  async #onDotClick(event) {
    event.preventDefault();
    const track = event.currentTarget;
    if (track.classList.contains("dot-track--sangria") || track.classList.contains("dot-track--vazio")) return;
    const name = track.dataset.name;
    const min = this.#dotMin(name);
    const rect = track.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const nextValue = rect.width ? Math.ceil(relativeX / (rect.width / 5)) : 0;
    const clamped = Math.max(min, Math.min(5, nextValue));
    const currentValue = Number(track.dataset.value) || 0;
    const newValue = currentValue === clamped ? Math.max(min, clamped - 1) : clamped;

    return this.actor.update({ [name]: newValue });
  }

  async #onDotContext(event) {
    event.preventDefault();
    const track = event.currentTarget;
    if (track.classList.contains("dot-track--sangria") || track.classList.contains("dot-track--vazio")) return;
    const name = track.dataset.name;

    return this.actor.update({ [name]: this.#dotMin(name) });
  }

  async #onResourceBoxClick(event) {
    event.preventDefault();

    const box = event.currentTarget;
    if (box.classList.contains("astrael-compact-resource-box")) event.stopPropagation();
    const resourceId = box.dataset.resource;
    const state = box.dataset.state ?? "empty";
    const index = Number(box.dataset.index);
    const resource = this.#getResource(resourceId);

    if (!resource || !Number.isInteger(index)) return;

    if (state === "empty" || state === "filled") return;
    if (state === "superficial") resource.superficial = Math.max(0, resource.superficial - 1);
    else if (state === "aggravated") {
      resource.aggravated = Math.max(0, resource.aggravated - 1);
      resource.superficial += 1;
    }

    return this.#updateResource(resourceId, resource);
  }

  async #onResourceBoxContext(event) {
    event.preventDefault();

    const box = event.currentTarget;
    if (box.classList.contains("astrael-compact-resource-box")) return;
    const resourceId = box.dataset.resource;
    const resource = this.#getResource(resourceId);

    if (!resource || resource.active <= 0 || resource.aggravated >= resource.active) return;

    this.#applySuperficialDamage(resource);
    return this.#updateResource(resourceId, resource);
  }

  async #onCompactResourceContext(event) {
    event.preventDefault();
    if (event.target.closest("[data-action]")) return;

    const resourceId = event.currentTarget.dataset.resource;
    const resource = this.#getResource(resourceId);
    if (!resource || resource.active <= 0 || resource.aggravated >= resource.active) return;

    if (event.shiftKey) this.#applyAggravatedDamage(resource);
    else this.#applySuperficialDamage(resource);
    return this.#updateResource(resourceId, resource);
  }

  async #onCompactResourceClick(event) {
    event.preventDefault();
    if (event.target.closest("[data-action]")) return;

    const resourceId = event.currentTarget.dataset.resource;
    const resource = this.#getResource(resourceId);
    if (!resource) return;

    if (resource.superficial > 0) {
      resource.superficial -= 1;
    } else if (resource.aggravated > 0) {
      resource.aggravated -= 1;
      resource.superficial += 1;
    } else {
      return;
    }

    return this.#updateResource(resourceId, resource);
  }

  async #onDamageButtonClick(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const resourceId = button.dataset.resource;
    const damageType = button.dataset.damage;
    const resource = this.#getResource(resourceId);

    if (!resource || resource.active <= 0 || resource.aggravated >= resource.active) return;

    if (damageType === "superficial") this.#applySuperficialDamage(resource);
    else if (damageType === "aggravated") this.#applyAggravatedDamage(resource);

    return this.#updateResource(resourceId, resource);
  }

  async #onDamageButtonContext(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const resourceId = button.dataset.resource;
    const damageType = button.dataset.damage;
    const resource = this.#getResource(resourceId);

    if (!resource) return;

    if (damageType === "superficial") {
      if (resource.superficial > 0) {
        resource.superficial -= 1;
      } else if (resource.aggravated > 0) {
        resource.aggravated -= 1;
        resource.superficial += 1;
      }
    } else if (damageType === "aggravated") {
      if (resource.aggravated > 0) {
        resource.aggravated -= 1;
        resource.superficial += 1;
      } else if (resource.superficial > 0) {
        resource.superficial -= 1;
      }
    }

    return this.#updateResource(resourceId, resource);
  }

  #applySuperficialDamage(resource) {
    if (resource.superficial + resource.aggravated < resource.active) resource.superficial += 1;
    else if (resource.superficial > 0) {
      resource.superficial -= 1;
      resource.aggravated += 1;
    }
  }

  #applyAggravatedDamage(resource) {
    if (resource.aggravated >= resource.active) return;

    if (resource.superficial + resource.aggravated >= resource.active && resource.superficial > 0) {
      resource.superficial -= 1;
    }

    resource.aggravated += 1;
  }

  #getResource(resourceId) {
    if (!DEFAULT_RESOURCES[resourceId]) return null;

    return normalizeResource(resourceId, {
      ...this.actor.system.resources?.[resourceId],
      active: calculateResourceActive(resourceId, this.actor.system)
    });
  }

  async #updateResource(resourceId, resource) {
    const normalized = normalizeResource(resourceId, {
      ...resource,
      active: calculateResourceActive(resourceId, this.actor.system)
    });

    return this.actor.update({
      [`system.resources.${resourceId}.max`]: normalized.max,
      [`system.resources.${resourceId}.active`]: normalized.active,
      [`system.resources.${resourceId}.superficial`]: normalized.superficial,
      [`system.resources.${resourceId}.aggravated`]: normalized.aggravated
    });
  }

  #onFractureBoxClick(event) {
    event.preventDefault();
    const convictionIndex = Number(event.currentTarget.dataset.convictionIndex);
    const value = clampNumber(Number(event.currentTarget.dataset.index) + 1, 0, 2);
    return this.#updateConvictionFractures(convictionIndex, value);
  }

  #onFractureBoxContext(event) {
    event.preventDefault();
    return this.#updateConvictionFractures(Number(event.currentTarget.dataset.convictionIndex), 0);
  }

  #updateConvictionFractures(index, value) {
    const convictions = this.#getConvictionsFromSheet();
    if (!Number.isInteger(index) || !convictions[index]) return;

    const current = clampNumber(convictions[index].fractures ?? 0, 0, 2);
    convictions[index].fractures = current === value ? 0 : clampNumber(value, 0, 2);
    return this.#updateConvictions(convictions);
  }

  async #onTabClick(event) {
    event.preventDefault();
    this.#activateTab(event.currentTarget.dataset.tab);
  }

  #isCharacterTabHidden(tabId, visibleTabs = this.#getCharacterVisibleTabs()) {
    if (!["character", "npc"].includes(this.actor.type)) return false;
    if (tabId === "virtues") return !visibleTabs.virtues;
    if (tabId === "hemomancy") return !visibleTabs.hemomancy;
    if (tabId === "stranger-mark") return !visibleTabs.strangerMark;
    return false;
  }

  #getCharacterVisibleTabs() {
    const actorData = this.actor.toObject();
    return normalizeVisibleTabs(actorData.system?.sheetSettings?.visibleTabs);
  }

  async #onToggleCharacterTab(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (!['virtues', 'hemomancy', 'strangerMark'].includes(key)) return;

    const checked = event.currentTarget.dataset.visible !== "true";
    const tabId = key === "strangerMark" ? "stranger-mark" : key;
    if (!checked && this._activeTab === tabId) this._activeTab = "attributes";

    return this.actor.update({ [`system.sheetSettings.visibleTabs.${key}`]: checked });
  }

  #activateTab(tabId) {
    if (!tabId) return;
    if (this.#isCharacterTabHidden(tabId)) tabId = "attributes";
    this._activeTab = tabId;
    this.element.dataset.activeTab = tabId;

    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach((b) => b.classList.remove("active"));
    this.element.querySelector(`.sheet-tabs [data-tab="${tabId}"]`)?.classList.add("active");

    this.element.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    const panel = this.element.querySelector(`.tab-panel[data-tab="${tabId}"]`);
    if (panel) panel.classList.add("active");

    if (tabId !== "stranger-mark") {
      this._strangerMarksPanel?.close();
      this._strangerMarksPanel = null;
    }

    if (tabId !== "attributes") {
      this._specialtiesPanel?.close();
      this._specialtiesPanel = null;
    }
  }

  setPosition(position) {
    const layout = this.constructor.LAYOUT_OPTIONS;
    if (position) {
      position.width = layout.width;
      const savedHeight = layout.heightSetting
        ? game.settings?.get(SYSTEM_ID, layout.heightSetting) ?? this.constructor.DEFAULT_OPTIONS.position.height
        : this.constructor.DEFAULT_OPTIONS.position.height;
      if (position.height === this.constructor.DEFAULT_OPTIONS.position.height) {
        position.height = Math.max(savedHeight, layout.minHeight);
      }
      if (position.height < layout.minHeight) position.height = layout.minHeight;
    }
    const result = super.setPosition(position);
    if (layout.heightSetting && position?.height !== undefined) {
      const saved = game.settings?.get(SYSTEM_ID, layout.heightSetting) ?? this.constructor.DEFAULT_OPTIONS.position.height;
      if (position.height !== saved) {
        game.settings?.set(SYSTEM_ID, layout.heightSetting, position.height);
      }
    }
    this._specialtiesPanel?.anchorToSheet();
    this._strangerMarksPanel?.anchorToSheet();
    return result;
  }

  async close(options) {
    await this._specialtiesPanel?.close();
    await this._strangerMarksPanel?.close();
    this._specialtiesPanel = null;
    this._strangerMarksPanel = null;
    return super.close(options);
  }

  #prepareAdvantageSelection(system) {
    this._advantageMode ??= "advantages";
    const selectedList = this._selectedAdvantageList === "flaws" ? "flaws" : "advantages";
    const selectedIndex = Number.isInteger(this._selectedAdvantageIndex) ? this._selectedAdvantageIndex : 0;
    const currentList = Array.isArray(system[selectedList]) ? system[selectedList] : [];
    const hasCurrentSelection = selectedIndex >= 0 && selectedIndex < currentList.length;
    const listId = selectedList;
    const list = Array.isArray(system[listId]) ? system[listId] : [];
    const index = hasCurrentSelection ? selectedIndex : list.length ? 0 : -1;

    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = index;

    system.advantages = system.advantages.map((entry, entryIndex) => ({
      ...entry,
      selected: listId === "advantages" && entryIndex === index
    }));
    system.flaws = system.flaws.map((entry, entryIndex) => ({
      ...entry,
      selected: listId === "flaws" && entryIndex === index
    }));

    const selected = index >= 0 ? system[listId]?.[index] : null;
    system.selectedAdvantage = selected ? {
      ...selected,
      index,
      listId,
      isFlaw: listId === "flaws",
      typeLabel: listId === "flaws" ? "ARQUIVO COMPROMETEDOR" : "DOSSIE FAVORAVEL",
      actionLabel: listId === "flaws" ? "Desvantagem" : "Vantagem"
    } : null;
    system.advantageModeFlaws = this._advantageMode === "flaws";
  }

  #saveSheetScroll() {
    const body = this.element?.querySelector('.sheet-body');
    if (body) this._savedSheetScroll = body.scrollTop;
  }

  #restoreSheetScroll() {
    if (this._savedSheetScroll === undefined) return;
    requestAnimationFrame(() => {
      const body = this.element?.querySelector('.sheet-body');
      if (body) body.scrollTop = this._savedSheetScroll;
    });
  }

  #saveAdvantageScrolls() {
    const adv = this.element?.querySelector('.advantage-list[data-list="advantages"]');
    const flw = this.element?.querySelector('.advantage-list[data-list="flaws"]');
    const prev = this._savedAdvantageScrolls || {};
    this._savedAdvantageScrolls = {
      advantages: adv && adv.offsetParent !== null ? adv.scrollTop : (prev.advantages || 0),
      flaws: flw && flw.offsetParent !== null ? flw.scrollTop : (prev.flaws || 0)
    };
  }

  #restoreAdvantageScrolls() {
    if (!this._savedAdvantageScrolls) return;
    requestAnimationFrame(() => {
      const adv = this.element?.querySelector('.advantage-list[data-list="advantages"]');
      const flw = this.element?.querySelector('.advantage-list[data-list="flaws"]');
      if (adv) adv.scrollTop = this._savedAdvantageScrolls.advantages;
      if (flw) flw.scrollTop = this._savedAdvantageScrolls.flaws;
    });
  }

  #getAdvantagePath(listId) {
    return listId === "flaws" ? "flaws" : "advantages";
  }

  #getAdvantageList(listId) {
    const path = this.#getAdvantagePath(listId);
    const actorData = this.actor.toObject();
    const list = Array.isArray(actorData.system?.[path]) ? actorData.system[path] : [];

    return list.map((entry) => ({
      name: entry.name || "",
      description: entry.description || entry.details || "",
      level: normalizeAdvantageLevel(entry),
      editing: Boolean(entry.editing)
    }));
  }

  #updateAdvantageList(listId, list) {
    const path = this.#getAdvantagePath(listId);
    return this.actor.update({ [`system.${path}`]: list });
  }

  #getAdvantageListFromSheet(listId, { closeEditing = false } = {}) {
    return this.#getAdvantageList(listId).map((entry, index) => {
      if (!entry.editing) return entry;

      const nameInput = this.element.querySelector(`.advantage-name-input[data-list='${listId}'][data-index='${index}']`);
      const descriptionInput = this.element.querySelector(`.advantage-description-input[data-list='${listId}'][data-index='${index}']`);

      return {
        ...entry,
        name: nameInput?.value?.trim() || entry.name || "Sem nome",
        description: descriptionInput?.value?.trim() || "",
        editing: closeEditing ? false : entry.editing
      };
    });
  }

  #updateAdvantageLists(advantages, flaws) {
    return this.actor.update({
      "system.advantages": advantages,
      "system.flaws": flaws
    });
  }

  async #saveEditingAdvantageEntries() {
    const hasEditing = this.#getAdvantageList("advantages").some((entry) => entry.editing) || this.#getAdvantageList("flaws").some((entry) => entry.editing);
    const advantages = this.#getAdvantageListFromSheet("advantages", { closeEditing: true });
    const flaws = this.#getAdvantageListFromSheet("flaws", { closeEditing: true });
    if (hasEditing) await this.#updateAdvantageLists(advantages, flaws);
    return { advantages, flaws };
  }

  async #onAddAdvantageEntry(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const listId = this._advantageMode || "advantages";
    const advantages = this.#getAdvantageListFromSheet("advantages", { closeEditing: true });
    const flaws = this.#getAdvantageListFromSheet("flaws", { closeEditing: true });
    const list = listId === "flaws" ? flaws : advantages;
    list.push({ name: "", description: "", level: 1, editing: true });
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = list.length - 1;

    return this.#updateAdvantageLists(advantages, flaws);
  }

  #onSetAdvantageMode(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const listId = event.currentTarget.dataset.mode === "flaws" ? "flaws" : "advantages";
    this._advantageMode = listId;
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = 0;
    return this.render({ force: true });
  }

  async #onSelectAdvantageEntry(event) {
    event.preventDefault();
    const button = event.currentTarget;
    this.#saveAdvantageScrolls();
    await this.#saveEditingAdvantageEntries();
    this._selectedAdvantageList = button.dataset.list;
    this._selectedAdvantageIndex = Number(button.dataset.index);
    return this.render({ force: true });
  }

  async #onEditAdvantageEntry(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const button = event.currentTarget;
    const listId = button.dataset.list || this._selectedAdvantageList;
    const index = Number(button.dataset.index ?? this._selectedAdvantageIndex);
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = index;
    return this.#editAdvantageEntry(listId, index);
  }

  async #onSaveAdvantageEntry(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const button = event.currentTarget;
    return this.#saveAdvantageEntry(button.dataset.list, Number(button.dataset.index));
  }

  async #onDeleteAdvantageEntry(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const button = event.currentTarget;
    const listId = button.dataset.list || this._selectedAdvantageList;
    const index = Number(button.dataset.index ?? this._selectedAdvantageIndex);
    return this.#deleteAdvantageEntry(listId, index);
  }

  async #onRollAdvantageEntry(event) {
    event.preventDefault();
    const button = event.currentTarget;
    return this.#onRollClick({
      preventDefault() {},
      target: { closest: () => null },
      currentTarget: {
        dataset: { type: "advantage", key: button.dataset.index },
        classList: { contains: () => false }
      }
    });
  }

  async #editAdvantageEntry(listId, index) {
    const list = this.#getAdvantageList(listId);
    if (!Number.isInteger(index) || !list[index]) return;

    list[index].editing = true;
    return this.#updateAdvantageList(listId, list);
  }

  async #saveAdvantageEntry(listId, index) {
    const list = this.#getAdvantageList(listId);
    if (!Number.isInteger(index) || !list[index]) return;

    const nameInput = this.element.querySelector(`.advantage-name-input[data-list='${listId}'][data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.advantage-description-input[data-list='${listId}'][data-index='${index}']`);
    const name = nameInput?.value?.trim();
    if (!name) {
      ui.notifications.warn(`Defina um nome para a ${listId === "flaws" ? "desvantagem" : "vantagem"}.`);
      return;
    }

    list[index] = {
      name,
      description: descriptionInput?.value?.trim() || "",
      level: normalizeAdvantageLevel(list[index]),
      editing: false
    };
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = index;
    return this.#updateAdvantageList(listId, list);
  }

  async #deleteAdvantageEntry(listId, index) {
    const list = this.#getAdvantageList(listId);
    if (!Number.isInteger(index) || !list[index]) return;

    list.splice(index, 1);
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = Math.min(index, list.length - 1);
    return this.#updateAdvantageList(listId, list);
  }

  async #onAdvantageRankClick(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const rank = event.currentTarget;
    return this.#shiftAdvantageLevel(rank.dataset.list, Number(rank.dataset.index), 1);
  }

  async #onAdvantageRankContext(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const rank = event.currentTarget;
    return this.#shiftAdvantageLevel(rank.dataset.list, Number(rank.dataset.index), -1);
  }

  async #shiftAdvantageLevel(listId, index, delta) {
    const list = this.#getAdvantageList(listId);
    if (!Number.isInteger(index) || !list[index]) return;

    list[index].level = clampNumber((list[index].level || 1) + delta, 1, 5);
    return this.#updateAdvantageList(listId, list);
  }

  #getConvictions() {
    const actorData = this.actor.toObject();
    const list = Array.isArray(actorData.system?.convictions) ? actorData.system.convictions : [];
    return normalizeConvictionList(list);
  }

  #readConvictionFromSheet(conviction, index) {
    const nameInput = this.element.querySelector(`.conviction-name-input[data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.conviction-description-input[data-index='${index}']`);
    const pillarNameInput = this.element.querySelector(`.pillar-name-input[data-conviction-index='${index}']`);
    const pillarTypeInput = this.element.querySelector(`.pillar-type-input[data-conviction-index='${index}']`);
    const fallback = normalizeConviction(conviction, index);
    const pillarType = index === CONVICTION_CENTER_INDEX
      ? "Pessoa"
      : (CONVICTION_PILLAR_TYPES.includes(pillarTypeInput?.value) ? pillarTypeInput.value : fallback.pillars[0].type);

    return {
      name: nameInput?.value?.trim() ?? conviction.name,
      description: descriptionInput?.value?.trim() ?? conviction.description,
      fractures: fallback.fractures,
      pillars: [{
        name: pillarNameInput?.value?.trim() ?? fallback.pillars[0].name,
        type: pillarType
      }]
    };
  }

  #getConvictionsFromSheet() {
    return this.#getConvictions().map((conviction, index) => {
      if (index !== this._editingConvictionIndex) return conviction;
      return this.#readConvictionFromSheet(conviction, index);
    });
  }

  #updateConvictions(convictions) {
    return this.actor.update({ "system.convictions": normalizeConvictionList(convictions) });
  }

  async #onEditConviction(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const convictions = this.#getConvictionsFromSheet();
    if (!Number.isInteger(index) || !convictions[index]) return;

    this._editingConvictionIndex = index;
    return this.#updateConvictions(convictions);
  }

  async #onSaveConviction(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const convictions = this.#getConvictions();
    if (!Number.isInteger(index) || !convictions[index]) return;

    const updated = this.#readConvictionFromSheet(convictions[index], index);
    if (!updated.name) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.Convictions.SaveRequired"));
      return;
    }
    if (!updated.pillars[0].name) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.Convictions.PillarSaveRequired"));
      return;
    }

    convictions[index] = updated;
    this._editingConvictionIndex = null;
    return this.#updateConvictions(convictions);
  }

  #prepareHemomancySelection(system) {
    this._hemomancyMode = clampNumber(this._hemomancyMode ?? 1, 1, 5);
    this._hemomancyListMode = this._hemomancyListMode === "formulas" ? "formulas" : "powers";
    const listKey = this._hemomancyListMode;
    const isFormulaMode = listKey === "formulas";
    const activeLevel = isFormulaMode ? system.hemomancy.alchemyLevel : system.hemomancy.level;
    const selectedIndex = Number.isInteger(this._selectedHemomancyIndex) ? this._selectedHemomancyIndex : -1;
    const entries = Array.isArray(system.hemomancy[listKey]) ? system.hemomancy[listKey] : [];
    const visiblePowers = entries
      .map((power, index) => ({ ...power, index }))
      .filter((power) => power.level === this._hemomancyMode);
    const index = visiblePowers.some((power) => power.index === selectedIndex)
      ? selectedIndex
      : (visiblePowers[0]?.index ?? -1);

    this._selectedHemomancyIndex = index;
    system.hemomancy.listMode = listKey;
    system.hemomancy.isFormulaMode = isFormulaMode;
    system.hemomancy.activeLevel = activeLevel;
    system.hemomancy.activeLevelRoman = activeLevel ? toRomanLevel(activeLevel) : "0";
    system.hemomancy.levelLabel = isFormulaMode ? "Potencia da Alquimia" : "Potencia da Hemomancia";
    system.hemomancy.itemSingular = isFormulaMode ? "fórmula" : "magia";
    system.hemomancy.itemPluralTitle = isFormulaMode ? "Fórmulas" : "Magias";
    system.hemomancy.itemEmptyTitle = isFormulaMode ? "Nenhuma fórmula selecionada" : "Nenhuma magia selecionada";
    system.hemomancy.itemEmptyText = isFormulaMode
      ? `Crie uma fórmula no circulo ${toRomanLevel(this._hemomancyMode)} para abrir o grimorio de sangue.`
      : `Crie uma magia no circulo ${toRomanLevel(this._hemomancyMode)} para abrir o grimorio de sangue.`;
    system.hemomancy.switchMode = isFormulaMode ? "powers" : "formulas";
    system.hemomancy.switchLabel = isFormulaMode ? "Magias" : "Fórmulas";
    system.hemomancy.switchIcon = isFormulaMode
      ? `systems/${SYSTEM_ID}/assets/disciplines/bleeding-eye.svg`
      : `systems/${SYSTEM_ID}/assets/disciplines/fizzing-flask.svg`;
    system.hemomancy.mode = this._hemomancyMode;
    system.hemomancy.modeRoman = toRomanLevel(this._hemomancyMode);
    system.hemomancy.modeTabs = [1, 2, 3, 4, 5].map((level) => ({
      level,
      roman: toRomanLevel(level),
      active: level === this._hemomancyMode
    }));
    system.hemomancy.activeEntries = entries.map((power, index) => ({
      ...power,
      selected: index === this._selectedHemomancyIndex,
      hidden: power.level !== this._hemomancyMode
    }));

    const selected = index >= 0 ? entries[index] : null;
    system.hemomancy.selectedPower = selected ? {
      ...selected,
      index,
      rollFormula: isFormulaMode ? `Queima de Hemomancia (${selected.cost})` : `Inteligencia + Hemomancia (${system.attributes.intelligence.value} + ${system.hemomancy.level})`,
      dicePool: Math.max(1, Number(system.attributes.intelligence.value) + Number(system.hemomancy.level))
    } : null;
  }

  #getHemomancyListKey() {
    return this._hemomancyListMode === "formulas" ? "formulas" : "powers";
  }

  #getHemomancyLevelKey() {
    return this.#getHemomancyListKey() === "formulas" ? "alchemyLevel" : "level";
  }

  #getHemomancyPowers(listKey = this.#getHemomancyListKey()) {
    const actorData = this.actor.toObject();
    const powers = Array.isArray(actorData.system?.hemomancy?.[listKey]) ? actorData.system.hemomancy[listKey] : [];

    return powers.map((power) => {
      const normalized = normalizeHemomancyPower(power);
      return {
        name: normalized.name === "Sem nome" ? "" : normalized.name,
        description: normalized.description,
        level: normalized.level,
        cost: normalized.cost,
        editing: normalized.editing
      };
    });
  }

  #updateHemomancyPowers(powers, listKey = this.#getHemomancyListKey()) {
    return this.actor.update({ [`system.hemomancy.${listKey}`]: powers });
  }

  #getHemomancyPowersFromSheet({ closeEditing = false, listKey = this.#getHemomancyListKey() } = {}) {
    return this.#getHemomancyPowers(listKey).map((power, index) => {
      if (!power.editing) return power;

      const nameInput = this.element.querySelector(`.hemomancy-name-input[data-index='${index}']`);
      const costInput = this.element.querySelector(`.hemomancy-cost-input[data-index='${index}']`);
      const descriptionInput = this.element.querySelector(`.hemomancy-description-input[data-index='${index}']`);

      return {
        ...power,
        name: nameInput?.value?.trim() || power.name || "Sem nome",
        cost: clampNumber(costInput?.value ?? power.cost, 1, 5),
        description: descriptionInput?.value?.trim() || "",
        editing: closeEditing ? false : power.editing
      };
    });
  }

  async #saveEditingHemomancyPowers() {
    const listKey = this.#getHemomancyListKey();
    const hasEditing = this.#getHemomancyPowers(listKey).some((power) => power.editing);
    const powers = this.#getHemomancyPowersFromSheet({ closeEditing: true, listKey });
    if (hasEditing) await this.#updateHemomancyPowers(powers, listKey);
    return powers;
  }

  async #onSetHemomancyListMode(event) {
    event.preventDefault();
    await this.#saveEditingHemomancyPowers();
    this._hemomancyListMode = event.currentTarget.dataset.mode === "formulas" ? "formulas" : "powers";
    this._selectedHemomancyIndex = -1;
    return this.render({ force: true });
  }

  async #onSetHemomancyMode(event) {
    event.preventDefault();
    await this.#saveEditingHemomancyPowers();
    this._hemomancyMode = clampNumber(event.currentTarget.dataset.level, 1, 5);
    this._selectedHemomancyIndex = -1;
    return this.render({ force: true });
  }

  async #onAddHemomancyPower(event) {
    event.preventDefault();
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowersFromSheet({ closeEditing: true, listKey });
    const level = clampNumber(this._hemomancyMode ?? 1, 1, 5);
    powers.push({ name: "", description: "", level, cost: 1, editing: true });
    this._selectedHemomancyIndex = powers.length - 1;
    return this.#updateHemomancyPowers(powers, listKey);
  }

  async #onSelectHemomancyPower(event) {
    event.preventDefault();
    await this.#saveEditingHemomancyPowers();
    this._selectedHemomancyIndex = Number(event.currentTarget.dataset.index);
    return this.render({ force: true });
  }

  async #onEditHemomancyPower(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedHemomancyIndex);
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowers(listKey);
    if (!Number.isInteger(index) || !powers[index]) return;

    powers[index].editing = true;
    this._selectedHemomancyIndex = index;
    return this.#updateHemomancyPowers(powers, listKey);
  }

  async #onSaveHemomancyPower(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedHemomancyIndex);
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowers(listKey);
    if (!Number.isInteger(index) || !powers[index]) return;

    const nameInput = this.element.querySelector(`.hemomancy-name-input[data-index='${index}']`);
    const costInput = this.element.querySelector(`.hemomancy-cost-input[data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.hemomancy-description-input[data-index='${index}']`);
    const name = nameInput?.value?.trim();
    if (!name) {
      ui.notifications.warn(`Defina um nome para a ${listKey === "formulas" ? "fórmula" : "magia"} de Hemomancia.`);
      return;
    }

    powers[index] = {
      name,
      description: descriptionInput?.value?.trim() || "",
      level: powers[index].level,
      cost: clampNumber(costInput?.value, 1, 5),
      editing: false
    };
    this._selectedHemomancyIndex = index;
    return this.#updateHemomancyPowers(powers, listKey);
  }

  async #onDeleteHemomancyPower(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedHemomancyIndex);
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowers(listKey);
    if (!Number.isInteger(index) || !powers[index]) return;

    powers.splice(index, 1);
    this._selectedHemomancyIndex = -1;
    return this.#updateHemomancyPowers(powers, listKey);
  }

  async #onRollHemomancyPower(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedHemomancyIndex);
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowers(listKey);
    if (!Number.isInteger(index) || !powers[index]) return;
    const power = normalizeHemomancyPower(powers[index]);
    const isFormula = listKey === "formulas";

    const currentBlood = Number(this.actor.system.sangria?.value ?? 5);
    if (currentBlood <= 0) {
      const resource = this.#getResource("health");
      for (let i = 0; i < power.cost; i += 1) this.#applyAggravatedDamage(resource);
      await this.#updateResource("health", resource);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<section class="astrael-chat-card"><header class="astrael-chat-header"><span class="astrael-chat-kicker">Sangue Invocado</span><h2>${escapeHtml(power.name)}</h2><p>${escapeHtml(this.actor.name)}</p></header><div class="astrael-chat-result"><span>Sangue Esgotado</span><strong style="font-size:32px;color:#b2202b;text-shadow:0 0 14px rgba(178,32,43,0.4)">${power.cost}</strong><span style="font-size:11px;opacity:0.8">dano(s) agravado(s) na Vida</span></div></section>`
      });
      return;
    }

    const costRoll = await new Roll(`${power.cost}d10`).evaluate();
    const costValues = getRollValues(costRoll);
    const failures = costValues.filter((value) => value < 6).length;
    await createDicePoolMessage({
      actor: this.actor,
      title: `Custo de ${power.name}`,
      kicker: isFormula ? "Queima de Fórmula Hemomântica" : "Queima de Hemomancia",
      diceCount: power.cost,
      useCriticals: false,
      preRolledValues: costValues,
      preRolledRoll: costRoll,
      suppressReroll: true
    });

    if (failures > 0) {
      const currentBlood = Number(this.actor.system.sangria?.value ?? 5);
      const nextBlood = Math.max(0, currentBlood - failures);
      await this.actor.update({ "system.sangria.value": nextBlood });
    }

    if (isFormula) return;

    const intelligence = Number(this.actor.system.attributes?.intelligence?.value) || 1;
    const hemomancyLevel = clampNumber(this.actor.system.hemomancy?.level, 0, 5);
    const diceCount = Math.max(1, intelligence + hemomancyLevel);
    const rawBlood = Math.max(0, 5 - (Number(this.actor.system.sangria?.value) || 5));
    const rawVoid = Math.max(0, Number(this.actor.system.vazio?.value) || 0);
    const actualBlood = Math.min(rawBlood, diceCount);
    const actualVoid = Math.min(rawVoid, diceCount - actualBlood);
    return createDicePoolMessage({
      actor: this.actor,
      title: power.name,
      kicker: `Hemomancia Nivel ${power.levelRoman}`,
      diceCount,
      bloodCount: actualBlood,
      voidCount: actualVoid
    });
  }

  async #onHemomancyLevelClick(event) {
    event.preventDefault();
    const key = this.#getHemomancyLevelKey();
    const level = clampNumber((Number(this.actor.system.hemomancy?.[key]) || 0) + 1, 0, 5);
    return this.actor.update({ [`system.hemomancy.${key}`]: level });
  }

  async #onHemomancyLevelContext(event) {
    event.preventDefault();
    const key = this.#getHemomancyLevelKey();
    const level = clampNumber((Number(this.actor.system.hemomancy?.[key]) || 0) - 1, 0, 5);
    return this.actor.update({ [`system.hemomancy.${key}`]: level });
  }

  #prepareVirtueSelection(system) {
    const selectedIndex = Number.isInteger(this._selectedVirtueIndex) ? this._selectedVirtueIndex : -1;
    const virtues = Array.isArray(system.virtues) ? system.virtues : [];
    const visible = virtues.map((v, index) => ({
      ...v,
      index,
      displayName: v.name || "Virtude sem nome",
      selected: index === selectedIndex
    }));
    this._selectedVirtueIndex = visible.some((v) => v.selected)
      ? selectedIndex
      : (visible[0]?.index ?? -1);
    system.virtues = visible;
    system.selectedVirtue = this._selectedVirtueIndex >= 0
      ? { ...visible[this._selectedVirtueIndex], index: this._selectedVirtueIndex }
      : null;
  }

  #getVirtues() {
    const actorData = this.actor.toObject();
    const virtues = Array.isArray(actorData.system?.virtues) ? actorData.system.virtues : [];
    return virtues.map((v) => {
      const norm = normalizeVirtue(v);
      return {
        name: norm.name,
        description: norm.description,
        perks: norm.perks,
        editing: norm.editing
      };
    });
  }

  #updateVirtues(virtues) {
    return this.actor.update({ "system.virtues": virtues });
  }

  #getVirtuesFromSheet({ closeEditing = false } = {}) {
    return this.#getVirtues().map((virtue, index) => {
      if (!virtue.editing) return virtue;

      const nameInput = this.element.querySelector(`.virtue-name-input[data-index='${index}']`);
      const descriptionInput = this.element.querySelector(`.virtue-description-input[data-index='${index}']`);
      const perks = this.#getVirtuePerksFromSheet(index);

      return {
        ...virtue,
        name: nameInput?.value?.trim() || virtue.name || "",
        description: descriptionInput?.value?.trim() || "",
        perks,
        editing: closeEditing ? false : virtue.editing
      };
    });
  }

  #getVirtuePerksFromSheet(virtueIndex) {
    const virtue = this.#getVirtues()[virtueIndex];
    if (!virtue) return [];
    return virtue.perks.map((perk, pIndex) => {
      const nameInput = this.element.querySelector(`.virtue-perk-name-input[data-virtue='${virtueIndex}'][data-index='${pIndex}']`);
      const descriptionInput = this.element.querySelector(`.virtue-perk-description-input[data-virtue='${virtueIndex}'][data-index='${pIndex}']`);

      return {
        ...perk,
        name: nameInput ? nameInput.value.trim() : (perk.name || ""),
        description: descriptionInput ? descriptionInput.value.trim() : (perk.description || ""),
        editing: false
      };
    });
  }

  async #onSelectVirtue(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(index) || !virtues[index]) return;
    if (index === this._selectedVirtueIndex) return;

    const currentIndex = Number.isInteger(this._selectedVirtueIndex) ? this._selectedVirtueIndex : -1;
    if (currentIndex >= 0 && virtues[currentIndex]?.editing) {
      const updated = this.#getVirtuesFromSheet({ closeEditing: true });
      this._selectedVirtueIndex = index;
      return this.#updateVirtues(updated);
    }

    this._selectedVirtueIndex = index;
    return this.render({ force: true });
  }

  async #onAddVirtue(event) {
    event.preventDefault();
    this._selectedVirtueIndex = this.#getVirtues().length;
    const virtues = this.#getVirtues();
    virtues.push({ name: "", description: "", perks: [], editing: true });
    return this.#updateVirtues(virtues);
  }

  async #onEditVirtue(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedVirtueIndex);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(index) || !virtues[index]) return;

    virtues[index].editing = true;
    this._selectedVirtueIndex = index;
    return this.#updateVirtues(virtues);
  }

  async #onSaveVirtue(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedVirtueIndex);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(index) || !virtues[index]) return;

    const nameInput = this.element.querySelector(`.virtue-name-input[data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.virtue-description-input[data-index='${index}']`);
    const name = nameInput?.value?.trim();
    if (!name) {
      ui.notifications.warn("Defina um nome para a Virtude.");
      return;
    }

    const perks = this.#getVirtuePerksFromSheet(index);
    virtues[index] = {
      name,
      description: descriptionInput?.value?.trim() || "",
      perks,
      editing: false
    };
    this._selectedVirtueIndex = index;
    return this.#updateVirtues(virtues);
  }

  async #onDeleteVirtue(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedVirtueIndex);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(index) || !virtues[index]) return;

    virtues.splice(index, 1);
    this._selectedVirtueIndex = -1;
    return this.#updateVirtues(virtues);
  }

  async #onAddVirtuePerk(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedVirtueIndex);
    const virtues = this.#getVirtuesFromSheet();
    if (!Number.isInteger(index) || !virtues[index]) return;

    virtues[index].perks.push({ name: "", description: "", expanded: true, editing: false });
    return this.#updateVirtues(virtues);
  }

  async #onToggleVirtuePerk(event) {
    event.preventDefault();
    const virtueIndex = Number(event.currentTarget.dataset.virtue ?? this._selectedVirtueIndex);
    const perkIndex = Number(event.currentTarget.dataset.index);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(virtueIndex) || !virtues[virtueIndex]) return;
    if (!Number.isInteger(perkIndex) || !virtues[virtueIndex].perks[perkIndex]) return;

    virtues[virtueIndex].perks[perkIndex].expanded = !virtues[virtueIndex].perks[perkIndex].expanded;
    return this.#updateVirtues(virtues);
  }

  async #onDeleteVirtuePerk(event) {
    event.preventDefault();
    const virtueIndex = Number(event.currentTarget.dataset.virtue ?? this._selectedVirtueIndex);
    const perkIndex = Number(event.currentTarget.dataset.index);
    const virtues = this.#getVirtuesFromSheet();
    if (!Number.isInteger(virtueIndex) || !virtues[virtueIndex]) return;
    if (!Number.isInteger(perkIndex) || !virtues[virtueIndex].perks[perkIndex]) return;

    virtues[virtueIndex].perks.splice(perkIndex, 1);
    return this.#updateVirtues(virtues);
  }

  #getStrangerMarkActorData() {
    const actorData = this.actor.toObject();
    const marks = Array.isArray(actorData.system?.strangerMark?.marks) ? actorData.system.strangerMark.marks : [];
    return { marks, selectedMarkId: actorData.system?.strangerMark?.selectedMarkId ?? "" };
  }

  #updateStrangerMark(data) {
    const actorData = this.actor.toObject();
    const current = actorData.system?.strangerMark ?? {};
    return this.actor.update({ "system.strangerMark": { ...current, ...data } });
  }

  #getStrangerMarkAbilitiesFromSheet({ closeEditing = false } = {}) {
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? sm.marks : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return marks;

    const abilities = Array.isArray(marks[markIdx].abilities) ? marks[markIdx].abilities : [];
    const updatedAbilities = abilities.map((ab, idx) => {
      if (!ab.editing) return ab;

      const nameInput = this.element.querySelector(`.stranger-mark-name-input[data-index='${idx}']`);
      const costInput = this.element.querySelector(`.stranger-mark-cost-input[data-index='${idx}']`);
      const descriptionInput = this.element.querySelector(`.stranger-mark-description-input[data-index='${idx}']`);

      return {
        ...ab,
        name: nameInput?.value?.trim() || ab.name || "Sem nome",
        cost: clampNumber(costInput?.value ?? ab.cost, 1, 5),
        description: descriptionInput?.value?.trim() || "",
        editing: closeEditing ? false : ab.editing
      };
    });
    marks[markIdx] = { ...marks[markIdx], abilities: updatedAbilities };
    return marks;
  }

  async #saveEditingStrangerMarkAbilities() {
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? sm.marks : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return marks;
    const hasEditing = (marks[markIdx].abilities ?? []).some((a) => a.editing);
    if (!hasEditing) return marks;
    return this.#getStrangerMarkAbilitiesFromSheet({ closeEditing: true });
  }

  async #onOpenStrangerMarkPicker(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? sm.marks : [];
    const owned = marks.map((m) => m.option);
    const available = STRANGER_MARK_OPTIONS.filter((opt) => !owned.includes(opt.id));
    if (available.length === 0) {
      ui.notifications.warn("Voce ja possui todas as opcoes de marca disponiveis.");
      return;
    }

    const content = `<div class="stranger-mark-picker">
      <p>Escolha uma opcao de marca:</p>
      <div class="stranger-mark-picker-options">
        ${STRANGER_MARK_OPTIONS.map((opt) => `
          <button type="button" class="stranger-mark-picker-option ${owned.includes(opt.id) ? "owned" : ""}" data-option="${opt.id}" ${owned.includes(opt.id) ? "disabled" : ""}>
            <img src="${opt.icon}" alt="">
            <span>${opt.label}</span>
          </button>
        `).join("")}
      </div>
    </div>`;

    const dialog = new Dialog({
      title: "Nova Marca",
      content,
      buttons: {},
      render: (html) => {
        html.find(".stranger-mark-picker-option").on("click", async (event) => {
            const optionId = event.currentTarget.dataset.option;
            if (owned.includes(optionId)) return;
            const marks2 = this.#getStrangerMarkActorData().marks;
            marks2.push({ option: optionId, level: 0, abilities: [] });
            await this.#updateStrangerMark({
              selectedMarkId: optionId,
              selectedAbilityLevel: 1,
              marks: marks2
            });
            this._selectedStrangerMarkAbilityIndex = -1;
            dialog.close();
            return this.render({ force: true });
        });
      }
    }, { classes: ["astrael-dialog"], jQuery: true });
    dialog.render(true);
  }

  async #onAddStrangerMark(event) {
    event.preventDefault();
    return this.#onOpenStrangerMarkPicker(event);
  }

  async #onSelectStrangerMark(event) {
    event.preventDefault();
    await this.#saveEditingStrangerMarkAbilities();
    const optionId = event.currentTarget.dataset.option;
    this._selectedStrangerMarkAbilityIndex = -1;
    return this.#updateStrangerMark({ selectedMarkId: optionId, selectedAbilityLevel: 1 });
  }

  async #onDeleteStrangerMark(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const idx = marks.findIndex((m) => m.option === event.currentTarget.dataset.option);
    if (idx < 0) return;
    marks.splice(idx, 1);
    const nextId = marks.length > 0 ? marks[0].option : "";
    await this.#updateStrangerMark({
      selectedMarkId: nextId,
      selectedAbilityLevel: 1,
      marks
    });
    this._selectedStrangerMarkAbilityIndex = -1;
    return this.render({ force: true });
  }

  async #onStrangerMarkLevelClick(event) {
    event.preventDefault();
    const optionId = event.currentTarget.dataset.option;
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const mark = marks.find((m) => m.option === optionId);
    if (!mark) return;
    mark.level = clampNumber(mark.level + 1, 0, 5);

    const sorted = marks.map(normalizeStrangerMark).sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.label.localeCompare(b.label);
    });
    const bestId = sorted[0]?.option || optionId;

    return this.#updateStrangerMark({ marks, selectedMarkId: bestId });
  }

  async #onStrangerMarkLevelContext(event) {
    event.preventDefault();
    const optionId = event.currentTarget.dataset.option;
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const mark = marks.find((m) => m.option === optionId);
    if (!mark) return;
    mark.level = clampNumber(mark.level - 1, 0, 5);

    const sorted = marks.map(normalizeStrangerMark).sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.label.localeCompare(b.label);
    });
    const bestId = sorted[0]?.option || optionId;

    return this.#updateStrangerMark({ marks, selectedMarkId: bestId });
  }

  async #onSetStrangerMarkAbilityLevel(event) {
    event.preventDefault();
    const level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    this._selectedStrangerMarkAbilityIndex = -1;
    return this.#updateStrangerMark({ selectedAbilityLevel: level });
  }

  async #onAddStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const markIdx = Array.isArray(sm.marks) ? sm.marks.findIndex((m) => m.option === sm.selectedMarkId) : -1;
    if (markIdx < 0) return;

    const level = clampNumber(event.currentTarget.dataset.level ?? sm.selectedAbilityLevel ?? 1, 1, 5);
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    if (level > Number(marks[markIdx].level || 1)) {
      ui.notifications.warn("Esta marca ainda nao possui nivel suficiente para essa habilidade.");
      return;
    }
    const abilities = Array.isArray(marks[markIdx].abilities) ? [...marks[markIdx].abilities] : [];
    abilities.push({ name: "", description: "", level, cost: 0, editing: true });
    marks[markIdx] = { ...marks[markIdx], abilities };
    this._selectedStrangerMarkAbilityIndex = abilities.length - 1;
    return this.#updateStrangerMark({ selectedAbilityLevel: level, marks });
  }

  async #onSelectStrangerMarkAbility(event) {
    event.preventDefault();
    await this.#saveEditingStrangerMarkAbilities();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const mark = Array.isArray(sm.marks) ? sm.marks.find((m) => m.option === sm.selectedMarkId) : null;
    const index = Number(event.currentTarget.dataset.index);
    this._selectedStrangerMarkAbilityIndex = index;
    const abilityLevel = mark?.abilities?.[index]?.level ?? sm.selectedAbilityLevel ?? 1;
    return this.#updateStrangerMark({ selectedAbilityLevel: abilityLevel });
  }

  async #onEditStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return;
    const abilities = Array.isArray(marks[markIdx].abilities) ? [...marks[markIdx].abilities] : [];
    const index = Number(event.currentTarget.dataset.index ?? this._selectedStrangerMarkAbilityIndex);
    if (!Number.isInteger(index) || !abilities[index]) return;
    abilities[index] = { ...abilities[index], editing: true };
    marks[markIdx] = { ...marks[markIdx], abilities };
    this._selectedStrangerMarkAbilityIndex = index;
    return this.#updateStrangerMark({ marks });
  }

  async #onSaveStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return;
    const abilities = Array.isArray(marks[markIdx].abilities) ? [...marks[markIdx].abilities] : [];
    const index = Number(event.currentTarget.dataset.index ?? this._selectedStrangerMarkAbilityIndex);
    if (!Number.isInteger(index) || !abilities[index]) return;

    const nameInput = this.element.querySelector(`.stranger-mark-name-input[data-index='${index}']`);
    const costInput = this.element.querySelector(`.stranger-mark-cost-input[data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.stranger-mark-description-input[data-index='${index}']`);
    const name = nameInput?.value?.trim();
    if (!name) {
      ui.notifications.warn("Defina um nome para a habilidade.");
      return;
    }

    abilities[index] = {
      name,
      description: descriptionInput?.value?.trim() || "",
      level: abilities[index].level,
      cost: clampNumber(costInput?.value, 0, 5),
      editing: false
    };
    marks[markIdx] = { ...marks[markIdx], abilities };
    this._selectedStrangerMarkAbilityIndex = index;
    return this.#updateStrangerMark({ marks });
  }

  async #onDeleteStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return;
    const abilities = Array.isArray(marks[markIdx].abilities) ? [...marks[markIdx].abilities] : [];
    const index = Number(event.currentTarget.dataset.index ?? this._selectedStrangerMarkAbilityIndex);
    if (!Number.isInteger(index) || !abilities[index]) return;
    abilities.splice(index, 1);
    marks[markIdx] = { ...marks[markIdx], abilities };
    this._selectedStrangerMarkAbilityIndex = -1;
    return this.#updateStrangerMark({ marks });
  }

  async #onRollStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? sm.marks : [];
    const mark = marks.find((m) => m.option === sm.selectedMarkId);
    if (!mark) return;
    const abilities = Array.isArray(mark.abilities) ? mark.abilities : [];
    const index = Number(event.currentTarget.dataset.index ?? this._selectedStrangerMarkAbilityIndex);
    if (!Number.isInteger(index) || !abilities[index]) return;
    const ability = normalizeStrangerMarkAbility(abilities[index]);

    const vazio = Number(foundry.utils.getProperty(this.actor, "system.vazio.value")) || 0;

    if (vazio >= 5) {
      const resource = this.#getResource("willpower");
      for (let i = 0; i < ability.cost; i += 1) this.#applyAggravatedDamage(resource);
      await this.#updateResource("willpower", resource);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<section class="astrael-chat-card"><header class="astrael-chat-header"><span class="astrael-chat-kicker">Marca do Estranho</span><h2>${ability.name}</h2><p>${this.actor.name}</p></header><div class="astrael-chat-result"><span>Vazio Transborda</span><strong style="font-size:32px;color:#8aacbe;text-shadow:0 0 14px rgba(74,124,158,0.4)">${ability.cost}</strong><span style="font-size:11px;opacity:0.8">dano(s) agravado(s) na Força de Vontade</span></div></section>`
      });
      return;
    }

    const costRoll = await new Roll(`${ability.cost}d10`).evaluate();
    const costValues = getRollValues(costRoll);
    const failures = costValues.filter((value) => value < 6).length;
    await createDicePoolMessage({
      actor: this.actor,
      title: `Custo de ${ability.name}`,
      kicker: "Queima de Marcas",
      diceCount: ability.cost,
      useCriticals: false,
      preRolledValues: costValues,
      preRolledRoll: costRoll,
      suppressReroll: true
    });

    if (failures > 0) {
      const novoVazio = Math.min(5, vazio + failures);
      await this.actor.update({ "system.vazio.value": novoVazio });
    }
  }

  #onEditImage(event) {
    event.preventDefault();

    const picker = new FilePicker({
      type: "image",
      current: this.actor.img,
      callback: (path) => this.actor.update({ img: path })
    });

    return picker.browse();
  }

  async #onAdjustResource(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const resource = btn.dataset.resource;
    const delta = Number(btn.dataset.delta);
    const path = `system.${resource}.value`;
    const current = Number(foundry.utils.getProperty(this.actor, path)) || 0;
    let min = 0;
    if (resource === "vazio") {
      const marks = foundry.utils.getProperty(this.actor, "system.strangerMark.marks") || [];
      if (marks.some(m => Number(m.level) >= 1)) min = 1;
    }
    const next = Math.max(min, Math.min(5, current + delta));
    return this.actor.update({ [path]: next });
  }

  async #onRouseCheck(event) {
    event.preventDefault();

    const roll = await new Roll("1d10").evaluate();
    const values = getRollValues(roll);
    const isFailure = values[0] < 6;

    if (isFailure) {
      const current = Number(this.actor.system.sangria?.value ?? 5);
      const next = Math.max(0, current - 1);
      await this.actor.update({ "system.sangria.value": next });
    }

    return createDicePoolMessage({
      actor: this.actor,
      title: "Teste de Queima",
      kicker: isFailure ? "Queima — falha, -1 Sangue" : "Queima",
      diceCount: 1,
      useCriticals: false,
      preRolledValues: values,
      preRolledRoll: roll
    });
  }

  async #onOpenSpecialties(event) {
    event.preventDefault();
    if (this._specialtiesPanel) return this._specialtiesPanel.close();

    this._specialtiesPanel = new AstraelSpecialtiesPanel(this.actor, this);
    await this._specialtiesPanel.render({ force: true });
    return this._specialtiesPanel.anchorToSheet();
  }

  async #onToggleStrangerMarksPanel(event) {
    event.preventDefault();

    if (this._strangerMarksPanel) {
      await this._strangerMarksPanel.close();
      this._strangerMarksPanel = null;
      return;
    }

    this._strangerMarksPanel = new AstraelStrangerMarksPanel(this.actor, this);
    await this._strangerMarksPanel.render({ force: true });
    return this._strangerMarksPanel.anchorToSheet();
  }

  async #onAddCustomRoll(event) {
    event.preventDefault();

    const allAttrOptions = ATTRIBUTE_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
    ).join("");

    const allSkillOptions = SKILL_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`
    ).join("");

    const content = `
      <form class="astrael-dialog-form">
        <div class="form-group">
          <label>Nome da Rolagem</label>
          <input type="text" name="rollName" placeholder="Ex: Ataque com espada">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Atributo</label>
            <select name="attribute">${allAttrOptions}</select>
          </div>
          <div class="form-group mode-group">
            <div class="mode-header">
              <button type="button" class="mode-arrow" data-dir="prev">&#9664;</button>
              <span class="mode-label">Perícia</span>
              <button type="button" class="mode-arrow" data-dir="next">&#9654;</button>
            </div>
            <select name="second">${allSkillOptions}</select>
            <input type="hidden" name="mode" value="skill">
          </div>
        </div>
        <div class="pool-preview">
          <span class="pool-total"></span>
        </div>
        <div class="bottom-row">
          <div class="form-group modifier-group">
            <label>Modificador</label>
            <input type="number" name="modifier" value="0" step="1">
          </div>
          <div class="form-group specialty-group">
            <label>Especialidade</label>
            <select name="specialty">
              <option value="">Nenhuma</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const ROLL_MODES = [
      { key: "skill", label: "Perícia" },
      { key: "attribute", label: "Atributo" }
    ];

    return new Dialog({
      title: "Nova Rolagem Personalizada",
      content,
      buttons: {
        save: {
          label: "Salvar",
          callback: async (html) => {
            const name = html.find("[name='rollName']").val()?.trim();
            if (!name) {
              ui.notifications.warn("Defina um nome para a rolagem.");
              return false;
            }
            const modeKey = html.find("[name='mode']").val();
            const data = {
              name,
              attribute: html.find("[name='attribute']").val(),
              secondKey: html.find("[name='second']").val(),
              mode: modeKey,
              modifier: Number(html.find("[name='modifier']").val()) || 0,
              specialty: modeKey === "skill" ? html.find("[name='specialty']").val() : ""
            };
            const actorData = this.actor.toObject();
            const rolls = Array.isArray(actorData.system.customRolls) ? [...actorData.system.customRolls] : [];
            rolls.push(data);
            return this.actor.update({ "system.customRolls": rolls });
          }
        }
      },
      default: "save",
      render: (html) => {
        let modeIndex = 0;

        const buildOptions = (modeKey, excludeAttr) => {
          if (modeKey === "attribute") {
            return ATTRIBUTE_KEYS
              .filter((k) => k !== excludeAttr)
              .map((k) => `<option value="${k}">${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`)
              .join("");
          }
          return SKILL_KEYS
            .map((k) => `<option value="${k}">${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`)
            .join("");
        };

        const switchMode = (dir) => {
          modeIndex = (modeIndex + dir + ROLL_MODES.length) % ROLL_MODES.length;
          const mode = ROLL_MODES[modeIndex];
          const attrKey = html.find("[name='attribute']").val();
          const options = buildOptions(mode.key, mode.key === "attribute" ? attrKey : null);
          html.find(".mode-label").text(mode.label);
          html.find("[name='mode']").val(mode.key);
          html.find("[name='second']").html(options);
          html.find("[name='second'] option:first").prop("selected", true);
          html.find(".specialty-group").toggle(mode.key === "skill");
          if (mode.key === "skill") populateSpecialties(html.find("[name='second']").val());
          updatePreview();
        };

        const populateSpecialties = (skillKey) => {
          const select = html.find("[name='specialty']");
          const actorData = this.actor.toObject();
          const specialties = Array.isArray(actorData.system.specialties) ? actorData.system.specialties : [];
          const filtered = specialties.filter(s => s.skill === skillKey);
          let opts = '<option value="">Nenhuma</option>';
          filtered.forEach(s => {
            opts += `<option value="${s.description}">${s.description}</option>`;
          });
          select.html(opts);
          select.prop("disabled", filtered.length === 0);
        };

        const updatePreview = () => {
          const attrKey = html.find("[name='attribute']").val();
          const secondKey = html.find("[name='second']").val();
          const modeKey = html.find("[name='mode']").val();
          const modifier = Number(html.find("[name='modifier']").val()) || 0;
          const specialtyBonus = modeKey === "skill" && html.find("[name='specialty']").val() ? 1 : 0;
          const system = this.actor.system;

          const attrVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
          let secondVal;
          if (modeKey === "skill") {
            secondVal = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
          } else {
            secondVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
          }

          html.find(".pool-total").text(`${Math.max(1, attrVal + secondVal + modifier + specialtyBonus)} dados`);
        };

        html.find(".mode-arrow").on("click", (e) => {
          const dir = $(e.currentTarget).data("dir") === "next" ? 1 : -1;
          switchMode(dir);
        });

        html.find("[name='attribute']").on("change", () => {
          if (html.find("[name='mode']").val() === "attribute") {
            const attrKey = html.find("[name='attribute']").val();
            const currentVal = html.find("[name='second']").val();
            const options = buildOptions("attribute", attrKey);
            html.find("[name='second']").html(options);
            if (html.find(`[name='second'] option[value="${currentVal}"]`).length) {
              html.find("[name='second']").val(currentVal);
            } else {
              html.find("[name='second'] option:first").prop("selected", true);
            }
          }
          updatePreview();
        });

        html.find("[name='second']").on("change", function() {
          if (html.find("[name='mode']").val() === "skill") {
            populateSpecialties($(this).val());
          }
        });

        html.find("[name='second'], [name='modifier']").on("change input", updatePreview);
        html.find("[name='specialty']").on("change", updatePreview);
        updatePreview();
      }
    }, { classes: ["astrael-dialog"] }).render(true);
  }

  async #onEditCustomRoll(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const actorData = this.actor.toObject();
    const rolls = Array.isArray(actorData.system.customRolls) ? [...actorData.system.customRolls] : [];
    const roll = rolls[index];
    if (!roll) return;

    const allAttrOptions = ATTRIBUTE_KEYS.map((k) =>
      `<option value="${k}" ${k === roll.attribute ? "selected" : ""}>${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
    ).join("");

    let allSecondOptions;
    if (roll.mode === "skill") {
      allSecondOptions = SKILL_KEYS.map((k) =>
        `<option value="${k}" ${k === roll.secondKey ? "selected" : ""}>${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`
      ).join("");
    } else {
      allSecondOptions = ATTRIBUTE_KEYS
        .filter((k) => k !== roll.attribute)
        .map((k) =>
          `<option value="${k}" ${k === roll.secondKey ? "selected" : ""}>${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
        ).join("");
    }

    const content = `
      <form class="astrael-dialog-form">
        <div class="form-group">
          <label>Nome da Rolagem</label>
          <input type="text" name="rollName" value="${roll.name}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Atributo</label>
            <select name="attribute">${allAttrOptions}</select>
          </div>
          <div class="form-group mode-group">
            <div class="mode-header">
              <button type="button" class="mode-arrow" data-dir="prev">&#9664;</button>
              <span class="mode-label">${roll.mode === "skill" ? "Perícia" : "Atributo"}</span>
              <button type="button" class="mode-arrow" data-dir="next">&#9654;</button>
            </div>
            <select name="second">${allSecondOptions}</select>
            <input type="hidden" name="mode" value="${roll.mode}">
          </div>
        </div>
        <div class="pool-preview">
          <span class="pool-total"></span>
        </div>
        <div class="bottom-row">
          <div class="form-group modifier-group">
            <label>Modificador</label>
            <input type="number" name="modifier" value="${roll.modifier || 0}" step="1">
          </div>
          <div class="form-group specialty-group">
            <label>Especialidade</label>
            <select name="specialty">
              <option value="">Nenhuma</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const ROLL_MODES = [
      { key: "skill", label: "Perícia" },
      { key: "attribute", label: "Atributo" }
    ];

    return new Dialog({
      title: "Editar Rolagem Personalizada",
      content,
      buttons: {
        save: {
          label: "Salvar",
          callback: async (html) => {
            const name = html.find("[name='rollName']").val()?.trim();
            if (!name) {
              ui.notifications.warn("Defina um nome para a rolagem.");
              return false;
            }
            const modeKey = html.find("[name='mode']").val();
            const data = {
              name,
              attribute: html.find("[name='attribute']").val(),
              secondKey: html.find("[name='second']").val(),
              mode: modeKey,
              modifier: Number(html.find("[name='modifier']").val()) || 0,
              specialty: modeKey === "skill" ? html.find("[name='specialty']").val() : ""
            };
            const actorData = this.actor.toObject();
            const rolls = Array.isArray(actorData.system.customRolls) ? [...actorData.system.customRolls] : [];
            rolls[index] = data;
            return this.actor.update({ "system.customRolls": rolls });
          }
        },
        delete: {
          icon: '<i class="fas fa-trash"></i>',
          label: "Deletar",
          condition: true,
          callback: async () => {
            const data = this.actor.toObject();
            const list = Array.isArray(data.system.customRolls) ? [...data.system.customRolls] : [];
            list.splice(index, 1);
            return this.actor.update({ "system.customRolls": list });
          }
        }
      },
      default: "save",
      render: (html) => {
        let modeIndex = roll.mode === "attribute" ? 1 : 0;

        const buildOptions = (modeKey, excludeAttr) => {
          if (modeKey === "attribute") {
            return ATTRIBUTE_KEYS
              .filter((k) => k !== excludeAttr)
              .map((k) => `<option value="${k}">${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`)
              .join("");
          }
          return SKILL_KEYS
            .map((k) => `<option value="${k}">${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`)
            .join("");
        };

        const switchMode = (dir) => {
          modeIndex = (modeIndex + dir + ROLL_MODES.length) % ROLL_MODES.length;
          const mode = ROLL_MODES[modeIndex];
          const attrKey = html.find("[name='attribute']").val();
          const options = buildOptions(mode.key, mode.key === "attribute" ? attrKey : null);
          html.find(".mode-label").text(mode.label);
          html.find("[name='mode']").val(mode.key);
          html.find("[name='second']").html(options);
          html.find("[name='second'] option:first").prop("selected", true);
          html.find(".specialty-group").toggle(mode.key === "skill");
          if (mode.key === "skill") populateSpecialties(html.find("[name='second']").val());
          updatePreview();
        };

        const populateSpecialties = (skillKey) => {
          const select = html.find("[name='specialty']");
          const actorData = this.actor.toObject();
          const specialties = Array.isArray(actorData.system.specialties) ? actorData.system.specialties : [];
          const filtered = specialties.filter(s => s.skill === skillKey);
          let opts = '<option value="">Nenhuma</option>';
          filtered.forEach(s => {
            opts += `<option value="${s.description}" ${s.description === roll.specialty ? "selected" : ""}>${s.description}</option>`;
          });
          select.html(opts);
          select.prop("disabled", filtered.length === 0);
        };

        const updatePreview = () => {
          const attrKey = html.find("[name='attribute']").val();
          const secondKey = html.find("[name='second']").val();
          const modeKey = html.find("[name='mode']").val();
          const modifier = Number(html.find("[name='modifier']").val()) || 0;
          const specialtyBonus = modeKey === "skill" && html.find("[name='specialty']").val() ? 1 : 0;
          const system = this.actor.system;

          const attrVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
          let secondVal;
          if (modeKey === "skill") {
            secondVal = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
          } else {
            secondVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
          }

          html.find(".pool-total").text(`${Math.max(1, attrVal + secondVal + modifier + specialtyBonus)} dados`);
        };

        html.find(".mode-arrow").on("click", (e) => {
          const dir = $(e.currentTarget).data("dir") === "next" ? 1 : -1;
          switchMode(dir);
        });

        html.find("[name='attribute']").on("change", () => {
          if (html.find("[name='mode']").val() === "attribute") {
            const attrKey = html.find("[name='attribute']").val();
            const currentVal = html.find("[name='second']").val();
            const options = buildOptions("attribute", attrKey);
            html.find("[name='second']").html(options);
            if (html.find(`[name='second'] option[value="${currentVal}"]`).length) {
              html.find("[name='second']").val(currentVal);
            } else {
              html.find("[name='second'] option:first").prop("selected", true);
            }
          }
          updatePreview();
        });

        html.find("[name='second']").on("change", function() {
          if (html.find("[name='mode']").val() === "skill") {
            populateSpecialties($(this).val());
          }
        });

        html.find("[name='second'], [name='modifier']").on("change input", updatePreview);
        html.find("[name='specialty']").on("change", updatePreview);

        if (roll.mode === "attribute") {
          html.find(".specialty-group").hide();
        } else {
          populateSpecialties(roll.secondKey);
        }
        updatePreview();
        html.closest(".app").find(".dialog-button.delete").addClass("delete");
      }
    }, { classes: ["astrael-dialog"], jQuery: true }).render(true);
  }

  async #onCustomRollClick(event) {
    if (event.target.closest("[data-action='edit-custom-roll']")) return;
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const system = this.actor.system;
    const rolls = Array.isArray(system.customRolls) ? system.customRolls : [];
    const roll = rolls[index];
    if (!roll) return;

    const attrValue = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${roll.attribute}.value`)) || 1);
    let secondValue;
    if (roll.mode === "skill") {
      secondValue = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${roll.secondKey}.value`)) || 0);
    } else {
      secondValue = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${roll.secondKey}.value`)) || 1);
    }
    const specialtyBonus = roll.specialty ? 1 : 0;
    const diceCount = Math.max(1, attrValue + secondValue + (roll.modifier || 0) + specialtyBonus);

    const titleLeft = roll.mode === "skill"
      ? game.i18n.localize(LOCALIZE_SKILL[roll.secondKey]) || roll.secondKey
      : game.i18n.localize(LOCALIZE_ATTR[roll.secondKey]) || roll.secondKey;
    const titleRight = game.i18n.localize(LOCALIZE_ATTR[roll.attribute]) || roll.attribute;
    const titleSuffix = roll.specialty ? ` (${roll.specialty})` : "";

    const rawBlood = Math.max(0, 5 - (Number(this.actor.system.sangria?.value) || 5));
    const rawVoid = Math.max(0, Number(this.actor.system.vazio?.value) || 0);
    const actualBlood = Math.min(rawBlood, diceCount);
    const actualVoid = Math.min(rawVoid, diceCount - actualBlood);
    return createDicePoolMessage({
      actor: this.actor,
      title: `${roll.name}${titleSuffix}`,
      kicker: "Rolagem Personalizada",
      diceCount,
      bloodCount: actualBlood,
      voidCount: actualVoid
    });
  }
}

class AstraelCompactCharacterSheet extends AstraelCharacterSheet {
  static LAYOUT_OPTIONS = {
    width: 520,
    minWidth: 520,
    minHeight: 450,
    heightSetting: null
  };

  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "sheet", "actor", "compact-character-sheet"],
    position: {
      width: 520,
      height: 720
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: updateActorSheet
    },
    window: {
      title: "Astrael RPG Compact Character Sheet",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: COMPACT_CHARACTER_SHEET_TEMPLATE
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.compactPortraitViewer = this._compactPortraitViewer === true;
    context.compactPortrait = prepareCompactPortraitPresentation(getCompactPortraitFraming(this.actor));
    context.compactCanEditPortrait = this.actor.isOwner;
    context.compactAttributesCollapsed = game.settings.get(SYSTEM_ID, "compactAttributesCollapsed");
    context.compactResourceTooltipsDisabled = game.settings.get(SYSTEM_ID, "compactResourceTooltipsDisabled");
    const specialties = Array.isArray(this.actor.system.specialties) ? this.actor.system.specialties : [];
    const buildLevels = (value) => Array.from({ length: 5 }, (_, index) => ({
      value: index + 1,
      filled: index < value,
      current: index + 1 === value
    }));
    context.compactActiveSkills = SKILL_KEYS
      .map((key) => {
        const value = clampNumber(this.actor.system.skills?.[key]?.value, 0, 5);
        const skillSpecialties = specialties
          .map((specialty, index) => ({
            index,
            name: String(specialty.description || "").trim()
          }))
          .filter((specialty, index) => specialties[index]?.skill === key)
          .sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang));
        return {
          key,
          value,
          label: game.i18n.localize(LOCALIZE_SKILL[key]),
          selected: this._compactSkillEditor?.mode === "edit" && this._compactSkillEditor.key === key,
          canEdit: !this._compactSkillEditor,
          canOpenSpecialties: !this._compactSkillEditor,
          canManageSpecialties: this.actor.isOwner,
          specialtiesOpen: this._compactSpecialtySkillKey === key,
          addingSpecialty: this._compactSpecialtySkillKey === key && this._compactSpecialtyAdding,
          specialtyCount: skillSpecialties.length,
          specialties: skillSpecialties,
          levels: buildLevels(value)
        };
      })
      .filter((skill) => skill.value > 0)
      .sort((left, right) => left.label.localeCompare(right.label, game.i18n.lang));
    const activeKeys = new Set(context.compactActiveSkills.map((skill) => skill.key));
    const availableSkills = SKILL_KEYS
      .filter((key) => !activeKeys.has(key))
      .map((key) => ({
        key,
        label: game.i18n.localize(LOCALIZE_SKILL[key]),
        selected: this._compactSkillEditor?.key === key
      }))
      .sort((left, right) => left.label.localeCompare(right.label, game.i18n.lang));
    context.compactCanAddSkill = availableSkills.length > 0 && !this._compactSkillEditor;
    context.compactSkillEditor = this._compactSkillEditor
      ? {
        ...this._compactSkillEditor,
        adding: this._compactSkillEditor.mode === "add",
        editing: this._compactSkillEditor.mode === "edit",
        label: this._compactSkillEditor.mode === "edit"
          ? game.i18n.localize(LOCALIZE_SKILL[this._compactSkillEditor.key])
          : "",
        levels: buildLevels(this._compactSkillEditor.level),
        options: availableSkills
      }
      : null;
    this._compactCharacteristicMode ??= "advantages";
    const characteristicLists = {
      advantages: this.#getCompactCharacteristicList("advantages"),
      flaws: this.#getCompactCharacteristicList("flaws")
    };
    const activeCharacteristicList = characteristicLists[this._compactCharacteristicMode]
      .map((entry, index) => ({
        ...prepareAdvantageEntry(entry),
        index,
        listId: this._compactCharacteristicMode,
        levels: buildLevels(normalizeAdvantageLevel(entry)),
        selected: this._compactCharacteristicDock?.listId === this._compactCharacteristicMode
          && this._compactCharacteristicDock.index === index
      }))
      .sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang));
    const characteristicLocked = Boolean(this._compactCharacteristicDock && this._compactCharacteristicDock.mode !== "view");
    context.compactCharacteristics = {
      activeList: activeCharacteristicList,
      advantagesActive: this._compactCharacteristicMode === "advantages",
      flawsActive: this._compactCharacteristicMode === "flaws",
      advantagesCount: characteristicLists.advantages.length,
      flawsCount: characteristicLists.flaws.length,
      isFlaw: this._compactCharacteristicMode === "flaws",
      locked: characteristicLocked,
      canManage: this.actor.isOwner,
      canAdd: this.actor.isOwner && !characteristicLocked,
      empty: activeCharacteristicList.length === 0
    };
    if (this._compactCharacteristicDock) {
      const dock = this._compactCharacteristicDock;
      const source = dock.adding ? dock : characteristicLists[dock.listId]?.[dock.index];
      if (source) {
        const level = normalizeAdvantageLevel(dock.mode === "edit" ? dock : source);
        context.compactCharacteristicDock = {
          ...dock,
          name: dock.mode === "edit" ? dock.name : String(source.name || ""),
          description: dock.mode === "edit" ? dock.description : String(source.description || source.details || ""),
          level,
          levels: buildLevels(level),
          isView: dock.mode === "view",
          isEdit: dock.mode === "edit",
          isRemove: dock.mode === "remove",
          isFlaw: dock.listId === "flaws",
          canManage: this.actor.isOwner,
          canRoll: dock.listId === "advantages" && dock.mode === "view",
          typeLabel: game.i18n.localize(dock.listId === "flaws"
            ? "ASTRAEL.CompactCharacteristics.Flaw"
            : "ASTRAEL.CompactCharacteristics.Advantage")
        };
      } else {
        this._compactCharacteristicDock = null;
      }
    } else {
      context.compactCharacteristicDock = null;
    }
    context.compactResourceTooltipAvailable = !context.compactPortraitViewer
      && !context.compactResourceTooltipsDisabled
      && !context.compactSkillEditor
      && !context.compactCharacteristicDock;
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.classList.toggle("is-portrait-viewer", context.compactPortraitViewer);
    this.element.querySelectorAll("[data-action='adjust-compact-attribute']").forEach((button) => {
      button.addEventListener("click", this.#onAdjustCompactAttribute.bind(this, 1));
      button.addEventListener("contextmenu", this.#onAdjustCompactAttribute.bind(this, -1));
    });
    this.element.querySelector("[data-action='toggle-compact-attributes']")?.addEventListener("click", this.#onToggleCompactAttributes.bind(this));
    this.element.querySelectorAll("[data-action='set-compact-resource-tooltips']").forEach((button) => {
      button.addEventListener("click", this.#onSetCompactResourceTooltips.bind(this));
    });
    const resourceTooltip = this.element.querySelector(".astrael-compact-resource-tooltip");
    if (resourceTooltip) {
      const showResourceTooltip = () => {
        clearTimeout(this._compactResourceTooltipTimer);
        resourceTooltip.classList.add("is-visible");
      };
      const hideResourceTooltip = () => {
        clearTimeout(this._compactResourceTooltipTimer);
        this._compactResourceTooltipTimer = setTimeout(() => {
          resourceTooltip.classList.remove("is-visible");
        }, 650);
      };
      this.element.querySelectorAll(".astrael-compact-resource").forEach((resource) => {
        resource.addEventListener("pointerenter", showResourceTooltip);
        resource.addEventListener("pointerleave", hideResourceTooltip);
        resource.addEventListener("focusin", showResourceTooltip);
        resource.addEventListener("focusout", hideResourceTooltip);
      });
      resourceTooltip.addEventListener("pointerenter", showResourceTooltip);
      resourceTooltip.addEventListener("pointerleave", hideResourceTooltip);
      resourceTooltip.addEventListener("focusin", showResourceTooltip);
      resourceTooltip.addEventListener("focusout", hideResourceTooltip);
    }
    this.element.querySelector("[data-action='edit-compact-portrait']")?.addEventListener("click", this.#onEditCompactPortrait.bind(this));
    this.element.querySelector("[data-action='view-compact-portrait']")?.addEventListener("click", this.#onViewCompactPortrait.bind(this));
    this.element.querySelector("[data-action='close-compact-portrait-viewer']")?.addEventListener("click", this.#onCloseCompactPortraitViewer.bind(this));
    this.element.querySelector("[data-action='add-compact-skill']")?.addEventListener("click", this.#onAddCompactSkill.bind(this));
    this.element.querySelectorAll("[data-action='edit-compact-skill']").forEach((button) => {
      button.addEventListener("click", this.#onEditCompactSkill.bind(this));
    });
    this.element.querySelectorAll("[data-action='toggle-compact-specialties']").forEach((button) => {
      button.addEventListener("click", this.#onToggleCompactSpecialties.bind(this));
    });
    this.element.querySelectorAll("[data-action='begin-compact-specialty']").forEach((button) => {
      button.addEventListener("click", this.#onBeginCompactSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-compact-specialty']").forEach((button) => {
      button.addEventListener("click", this.#onSaveCompactSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='cancel-compact-specialty']").forEach((button) => {
      button.addEventListener("click", this.#onCancelCompactSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='remove-compact-specialty']").forEach((button) => {
      button.addEventListener("click", this.#onRemoveCompactSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='set-compact-characteristic-mode']").forEach((button) => {
      button.addEventListener("click", this.#onSetCompactCharacteristicMode.bind(this));
    });
    this.element.querySelector("[data-action='add-compact-characteristic']")?.addEventListener("click", this.#onAddCompactCharacteristic.bind(this));
    this.element.querySelectorAll("[data-action='select-compact-characteristic']").forEach((button) => {
      button.addEventListener("click", this.#onSelectCompactCharacteristic.bind(this));
    });
    this.element.querySelector("[data-action='edit-compact-characteristic']")?.addEventListener("click", this.#onEditCompactCharacteristic.bind(this));
    this.element.querySelectorAll("[data-action='set-compact-characteristic-level']").forEach((button) => {
      button.addEventListener("click", this.#onSetCompactCharacteristicLevel.bind(this));
    });
    this.element.querySelector("[data-action='save-compact-characteristic']")?.addEventListener("click", this.#onSaveCompactCharacteristic.bind(this));
    this.element.querySelectorAll("[data-action='close-compact-characteristic']").forEach((button) => {
      button.addEventListener("click", this.#onCloseCompactCharacteristic.bind(this));
    });
    this.element.querySelector("[data-action='request-remove-compact-characteristic']")?.addEventListener("click", this.#onRequestRemoveCompactCharacteristic.bind(this));
    this.element.querySelector("[data-action='back-remove-compact-characteristic']")?.addEventListener("click", this.#onBackRemoveCompactCharacteristic.bind(this));
    this.element.querySelector("[data-action='confirm-remove-compact-characteristic']")?.addEventListener("click", this.#onConfirmRemoveCompactCharacteristic.bind(this));
    this.element.querySelector("[data-action='compact-specialty-name']")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") return this.#onSaveCompactSpecialty(event);
    });
    this.element.querySelectorAll("[data-action='set-compact-editor-level']").forEach((button) => {
      button.addEventListener("click", this.#onSetCompactEditorLevel.bind(this));
    });
    this.element.querySelector("[data-action='select-compact-editor-skill']")?.addEventListener("change", (event) => {
      if (this._compactSkillEditor?.mode === "add") this._compactSkillEditor.key = event.currentTarget.value;
    });
    this.element.querySelector("[data-action='save-compact-skill-editor']")?.addEventListener("click", this.#onSaveCompactSkillEditor.bind(this));
    this.element.querySelector("[data-action='cancel-compact-skill-editor']")?.addEventListener("click", this.#onCancelCompactSkillEditor.bind(this));
    this.element.querySelector("[data-action='request-remove-compact-skill']")?.addEventListener("click", this.#onRequestRemoveCompactSkill.bind(this));
    this.element.querySelector("[data-action='back-remove-compact-skill']")?.addEventListener("click", this.#onBackRemoveCompactSkill.bind(this));
    this.element.querySelector("[data-action='confirm-remove-compact-skill']")?.addEventListener("click", this.#onConfirmRemoveCompactSkill.bind(this));
    this.element.addEventListener("keydown", this.#onCompactSkillEditorKeydown.bind(this));

    if (context.compactPortraitViewer) {
      this.element.querySelector("[data-action='close-compact-portrait-viewer']")?.focus();
    } else if (this._compactPortraitViewerReturnFocus) {
      this._compactPortraitViewerReturnFocus = false;
      this.element.querySelector("[data-action='view-compact-portrait']")?.focus();
    } else if (this._compactSkillNeedsInitialFocus && this._compactSkillEditor) {
      this._compactSkillNeedsInitialFocus = false;
      const focusTarget = this._compactSkillEditor.confirmingRemoval
        ? this.element.querySelector("[data-action='back-remove-compact-skill']")
        : this._compactSkillEditor.mode === "add"
          ? this.element.querySelector("[data-action='select-compact-editor-skill']")
          : this.element.querySelector("[data-action='set-compact-editor-level'].is-current");
      focusTarget?.focus();
    } else if (!this._compactSkillEditor && this._compactSkillReturnFocus) {
      const selector = this._compactSkillReturnFocus === "add"
        ? "[data-action='add-compact-skill']"
        : `[data-action='edit-compact-skill'][data-key='${this._compactSkillReturnFocus}']`;
      this._compactSkillReturnFocus = null;
      this.element.querySelector(selector)?.focus();
    } else if (this._compactSpecialtyFocus) {
      const selector = this._compactSpecialtyFocus === "input"
        ? "[data-action='compact-specialty-name']"
        : this._compactSpecialtyFocus === "add"
          ? `[data-action='begin-compact-specialty'][data-key='${this._compactSpecialtySkillKey}']`
          : `[data-action='toggle-compact-specialties'][data-key='${this._compactSpecialtySkillKey}']`;
      this._compactSpecialtyFocus = null;
      this.element.querySelector(selector)?.focus();
    } else if (this._compactCharacteristicFocus) {
      const selector = this._compactCharacteristicFocus === "name"
        ? "[data-action='compact-characteristic-name']"
        : this._compactCharacteristicFocus === "add"
          ? "[data-action='add-compact-characteristic']"
          : `[data-action='select-compact-characteristic'][data-list='${this._compactCharacteristicMode}'][data-index='${this._compactCharacteristicFocus}']`;
      this._compactCharacteristicFocus = null;
      this.element.querySelector(selector)?.focus();
    }
  }

  async #onAdjustCompactAttribute(delta, event) {
    event.preventDefault();
    const attributeKey = event.currentTarget.dataset.key;
    if (!ATTRIBUTE_KEYS.includes(attributeKey)) return;

    const currentValue = Number(this.actor.system.attributes?.[attributeKey]?.value) || 1;
    const nextValue = clampNumber(currentValue + delta, 1, 5);
    if (nextValue === currentValue) return;

    return this.actor.update({ [`system.attributes.${attributeKey}.value`]: nextValue });
  }

  async #onToggleCompactAttributes(event) {
    event.preventDefault();
    const collapsed = game.settings.get(SYSTEM_ID, "compactAttributesCollapsed");
    await game.settings.set(SYSTEM_ID, "compactAttributesCollapsed", !collapsed);
    return this.render({ force: true });
  }

  async #onSetCompactResourceTooltips(event) {
    event.preventDefault();
    event.stopPropagation();
    const disabled = event.currentTarget.dataset.disabled === "true";
    await game.settings.set(SYSTEM_ID, "compactResourceTooltipsDisabled", disabled);
    return this.render({ force: true });
  }

  async #onEditCompactPortrait(event) {
    event.preventDefault();
    if (!this.actor.isOwner) return;
    if (this._compactPortraitEditor) return this._compactPortraitEditor.bringToFront();
    this._compactPortraitEditor = new AstraelCompactPortraitEditor(this.actor, this);
    return this._compactPortraitEditor.render({ force: true });
  }

  #onViewCompactPortrait(event) {
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(this._compactResourceTooltipTimer);
    this._compactPortraitViewer = true;
    return this.render({ force: true });
  }

  #onCloseCompactPortraitViewer(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this._compactPortraitViewer) return;
    this._compactPortraitViewer = false;
    this._compactPortraitViewerReturnFocus = true;
    return this.render({ force: true });
  }

  #onAddCompactSkill(event) {
    event.preventDefault();
    if (this._compactSkillEditor) return;
    this._compactSpecialtySkillKey = null;
    this._compactSpecialtyAdding = false;
    this._compactCharacteristicDock = null;
    this._compactCharacteristicFocus = null;
    this._compactSkillReturnFocus = "add";
    this._compactSkillNeedsInitialFocus = true;
    this._compactSkillEditor = { mode: "add", key: "", level: 1, confirmingRemoval: false };
    return this.render({ force: true });
  }

  #onEditCompactSkill(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (this._compactSkillEditor || !SKILL_KEYS.includes(key)) return;
    this._compactSpecialtySkillKey = null;
    this._compactSpecialtyAdding = false;
    this._compactSkillReturnFocus = key;
    this._compactSkillNeedsInitialFocus = true;
    this._compactSkillEditor = {
      mode: "edit",
      key,
      level: clampNumber(this.actor.system.skills?.[key]?.value, 1, 5),
      confirmingRemoval: false
    };
    return this.render({ force: true });
  }

  #onSetCompactEditorLevel(event) {
    event.preventDefault();
    if (!this._compactSkillEditor) return;
    this._compactSkillEditor.level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    return this.render({ force: true });
  }

  #onCancelCompactSkillEditor(event) {
    event?.preventDefault();
    if (!this._compactSkillEditor) return;
    if (this._compactSkillEditor.confirmingRemoval) {
      this._compactSkillEditor.confirmingRemoval = false;
      this._compactSkillNeedsInitialFocus = true;
      return this.render({ force: true });
    }
    this._compactSkillEditor = null;
    return this.render({ force: true });
  }

  async #onSaveCompactSkillEditor(event) {
    event.preventDefault();
    const editor = this._compactSkillEditor;
    if (!editor) return;
    if (!SKILL_KEYS.includes(editor.key)) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.CompactSkills.SelectRequired"));
      return;
    }
    this._compactSkillEditor = null;
    return this.actor.update({ [`system.skills.${editor.key}.value`]: clampNumber(editor.level, 1, 5) });
  }

  #onRequestRemoveCompactSkill(event) {
    event.preventDefault();
    if (this._compactSkillEditor?.mode !== "edit") return;
    this._compactSkillEditor.confirmingRemoval = true;
    this._compactSkillNeedsInitialFocus = true;
    return this.render({ force: true });
  }

  #onBackRemoveCompactSkill(event) {
    event.preventDefault();
    if (!this._compactSkillEditor) return;
    this._compactSkillEditor.confirmingRemoval = false;
    this._compactSkillNeedsInitialFocus = true;
    return this.render({ force: true });
  }

  async #onConfirmRemoveCompactSkill(event) {
    event.preventDefault();
    const key = this._compactSkillEditor?.mode === "edit" ? this._compactSkillEditor.key : "";
    if (!SKILL_KEYS.includes(key)) return;
    if (this._compactSpecialtySkillKey === key) this._compactSpecialtySkillKey = null;
    this._compactSkillReturnFocus = "add";
    this._compactSkillEditor = null;
    return this.actor.update({ [`system.skills.${key}.value`]: 0 });
  }

  #onCompactSkillEditorKeydown(event) {
    if (event.key !== "Escape") return;
    if (this._compactPortraitViewer) {
      event.preventDefault();
      event.stopPropagation();
      return this.#onCloseCompactPortraitViewer();
    }
    if (this._compactCharacteristicDock) {
      event.preventDefault();
      event.stopPropagation();
      if (this._compactCharacteristicDock.mode === "remove") return this.#onBackRemoveCompactCharacteristic();
      return this.#onCloseCompactCharacteristic();
    }
    if (this._compactSpecialtyAdding) {
      event.preventDefault();
      event.stopPropagation();
      return this.#onCancelCompactSpecialty();
    }
    if (this._compactSpecialtySkillKey) {
      event.preventDefault();
      event.stopPropagation();
      this._compactSpecialtySkillKey = null;
      this._compactSpecialtyFocus = null;
      return this.render({ force: true });
    }
    if (!this._compactSkillEditor) return;
    event.preventDefault();
    event.stopPropagation();
    return this.#onCancelCompactSkillEditor();
  }

  #onToggleCompactSpecialties(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (this._compactSkillEditor || !SKILL_KEYS.includes(key)) return;
    const closing = this._compactSpecialtySkillKey === key;
    this._compactSpecialtySkillKey = closing ? null : key;
    this._compactSpecialtyAdding = false;
    this._compactSpecialtyFocus = closing ? null : "toggle";
    return this.render({ force: true });
  }

  #onBeginCompactSpecialty(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (!this.actor.isOwner || this._compactSpecialtySkillKey !== key) return;
    this._compactSpecialtyAdding = true;
    this._compactSpecialtyFocus = "input";
    return this.render({ force: true });
  }

  #onCancelCompactSpecialty(event) {
    event?.preventDefault();
    if (!this._compactSpecialtySkillKey) return;
    this._compactSpecialtyAdding = false;
    this._compactSpecialtyFocus = "add";
    return this.render({ force: true });
  }

  async #onSaveCompactSpecialty(event) {
    event.preventDefault();
    if (!this.actor.isOwner || !this._compactSpecialtySkillKey || !this._compactSpecialtyAdding) return;
    const input = this.element.querySelector("[data-action='compact-specialty-name']");
    const name = input?.value.trim() || "";
    if (!name) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.CompactSpecialties.NameRequired"));
      input?.focus();
      return;
    }

    const specialties = Array.isArray(this.actor.system.specialties)
      ? this.actor.system.specialties.map((specialty) => ({ ...specialty }))
      : [];
    specialties.push({ skill: this._compactSpecialtySkillKey, description: name });
    this._compactSpecialtyAdding = false;
    this._compactSpecialtyFocus = "add";
    return this.actor.update({ "system.specialties": specialties });
  }

  async #onRemoveCompactSpecialty(event) {
    event.preventDefault();
    if (!this.actor.isOwner || !this._compactSpecialtySkillKey) return;
    const index = Number(event.currentTarget.dataset.index);
    const specialties = Array.isArray(this.actor.system.specialties)
      ? this.actor.system.specialties.map((specialty) => ({ ...specialty }))
      : [];
    if (!Number.isInteger(index) || specialties[index]?.skill !== this._compactSpecialtySkillKey) return;
    specialties.splice(index, 1);
    this._compactSpecialtyFocus = "toggle";
    return this.actor.update({ "system.specialties": specialties });
  }

  #getCompactCharacteristicList(listId) {
    const path = listId === "flaws" ? "flaws" : "advantages";
    const actorData = this.actor.toObject();
    return Array.isArray(actorData.system?.[path]) ? actorData.system[path].map((entry) => ({ ...entry })) : [];
  }

  #onSetCompactCharacteristicMode(event) {
    event.preventDefault();
    if (this._compactCharacteristicDock?.mode !== "view" && this._compactCharacteristicDock) return;
    this._compactCharacteristicMode = event.currentTarget.dataset.list === "flaws" ? "flaws" : "advantages";
    this._compactCharacteristicDock = null;
    return this.render({ force: true });
  }

  #onAddCompactCharacteristic(event) {
    event.preventDefault();
    if (!this.actor.isOwner || (this._compactCharacteristicDock && this._compactCharacteristicDock.mode !== "view")) return;
    this._compactSkillEditor = null;
    this._compactSkillReturnFocus = null;
    this._compactSkillNeedsInitialFocus = false;
    this._compactCharacteristicDock = {
      mode: "edit",
      adding: true,
      listId: this._compactCharacteristicMode,
      index: -1,
      name: "",
      description: "",
      level: 1
    };
    this._compactCharacteristicFocus = "name";
    return this.render({ force: true });
  }

  #onSelectCompactCharacteristic(event) {
    event.preventDefault();
    if (this._compactCharacteristicDock && this._compactCharacteristicDock.mode !== "view") return;
    this._compactSkillEditor = null;
    this._compactSkillReturnFocus = null;
    this._compactSkillNeedsInitialFocus = false;
    const listId = event.currentTarget.dataset.list === "flaws" ? "flaws" : "advantages";
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || !this.#getCompactCharacteristicList(listId)[index]) return;
    const closing = this._compactCharacteristicDock?.mode === "view"
      && this._compactCharacteristicDock.listId === listId
      && this._compactCharacteristicDock.index === index;
    this._compactCharacteristicDock = closing ? null : { mode: "view", adding: false, listId, index };
    this._compactCharacteristicFocus = closing ? null : String(index);
    return this.render({ force: true });
  }

  #onEditCompactCharacteristic(event) {
    event.preventDefault();
    if (!this.actor.isOwner || this._compactCharacteristicDock?.mode !== "view") return;
    const { listId, index } = this._compactCharacteristicDock;
    const entry = this.#getCompactCharacteristicList(listId)[index];
    if (!entry) return;
    this._compactCharacteristicDock = {
      mode: "edit",
      adding: false,
      listId,
      index,
      name: String(entry.name || ""),
      description: String(entry.description || entry.details || ""),
      level: normalizeAdvantageLevel(entry)
    };
    this._compactCharacteristicFocus = "name";
    return this.render({ force: true });
  }

  #syncCompactCharacteristicDraft() {
    if (this._compactCharacteristicDock?.mode !== "edit") return;
    const name = this.element.querySelector("[data-action='compact-characteristic-name']");
    const description = this.element.querySelector("[data-action='compact-characteristic-description']");
    if (name) this._compactCharacteristicDock.name = name.value;
    if (description) this._compactCharacteristicDock.description = description.value;
  }

  #onSetCompactCharacteristicLevel(event) {
    event.preventDefault();
    if (this._compactCharacteristicDock?.mode !== "edit") return;
    this.#syncCompactCharacteristicDraft();
    this._compactCharacteristicDock.level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    return this.render({ force: true });
  }

  async #onSaveCompactCharacteristic(event) {
    event.preventDefault();
    if (!this.actor.isOwner || this._compactCharacteristicDock?.mode !== "edit") return;
    this.#syncCompactCharacteristicDraft();
    const dock = this._compactCharacteristicDock;
    const name = dock.name.trim();
    if (!name) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.CompactCharacteristics.NameRequired"));
      this.element.querySelector("[data-action='compact-characteristic-name']")?.focus();
      return;
    }

    const list = this.#getCompactCharacteristicList(dock.listId);
    const entry = {
      ...(dock.adding ? {} : list[dock.index]),
      name,
      description: dock.description.trim(),
      level: clampNumber(dock.level, 1, 5),
      editing: false
    };
    let index = dock.index;
    if (dock.adding) {
      list.push(entry);
      index = list.length - 1;
    } else if (list[index]) {
      list[index] = entry;
    } else {
      return;
    }
    this._compactCharacteristicDock = { mode: "view", adding: false, listId: dock.listId, index };
    this._compactCharacteristicFocus = String(index);
    return this.actor.update({ [`system.${dock.listId}`]: list });
  }

  #onCloseCompactCharacteristic(event) {
    event?.preventDefault();
    const dock = this._compactCharacteristicDock;
    if (!dock) return;
    this._compactCharacteristicDock = null;
    this._compactCharacteristicFocus = dock.adding ? "add" : String(dock.index);
    return this.render({ force: true });
  }

  #onRequestRemoveCompactCharacteristic(event) {
    event.preventDefault();
    if (!this.actor.isOwner || this._compactCharacteristicDock?.mode !== "view") return;
    this._compactCharacteristicDock.mode = "remove";
    return this.render({ force: true });
  }

  #onBackRemoveCompactCharacteristic(event) {
    event?.preventDefault();
    if (this._compactCharacteristicDock?.mode !== "remove") return;
    this._compactCharacteristicDock.mode = "view";
    return this.render({ force: true });
  }

  async #onConfirmRemoveCompactCharacteristic(event) {
    event.preventDefault();
    if (!this.actor.isOwner || this._compactCharacteristicDock?.mode !== "remove") return;
    const { listId, index } = this._compactCharacteristicDock;
    const list = this.#getCompactCharacteristicList(listId);
    if (!list[index]) return;
    list.splice(index, 1);
    this._compactCharacteristicDock = null;
    this._compactCharacteristicFocus = "add";
    return this.actor.update({ [`system.${listId}`]: list });
  }

  async close(options) {
    clearTimeout(this._compactResourceTooltipTimer);
    await this._compactPortraitEditor?.close();
    this._compactPortraitEditor = null;
    return super.close(options);
  }
}

class AstraelNpcSheet extends AstraelCharacterSheet {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "sheet", "actor", "npc-sheet"],
    position: {
      width: 900,
      height: 680
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: updateActorSheet
    },
    window: {
      title: "Astrael RPG NPC Sheet",
      resizable: true
    }
  };

  static PARTS = {
    form: {
      template: NPC_SHEET_TEMPLATE
    }
  };

  get title() {
    return `${game.i18n.localize("ASTRAEL.Sheet.NPC")}: ${this.actor.name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const initialized = this.actor.getFlag(SYSTEM_ID, "npcInitialized") === true;
    this._npcCreatorLevel ??= "common";
    this._npcCreatorArchetype ??= "witness";
    this._npcCreatorSkillDistribution ??= "balanced";
    this._npcCreatorDraft ??= createNpcDraft(this._npcCreatorLevel, this._npcCreatorArchetype, this._npcCreatorSkillDistribution);
    if (
      this._npcCreatorDraft.level.id !== this._npcCreatorLevel ||
      this._npcCreatorDraft.archetype.id !== this._npcCreatorArchetype ||
      this._npcCreatorDraft.skillDistribution.id !== this._npcCreatorSkillDistribution
    ) {
      this._npcCreatorDraft = createNpcDraft(this._npcCreatorLevel, this._npcCreatorArchetype, this._npcCreatorSkillDistribution);
    }
    const currentLevelIndex = NPC_LEVELS.findIndex((level) => level.id === this._npcCreatorLevel);
    const currentLevel = getNpcLevel(this._npcCreatorLevel);
    context.npcArchetypeLabel = this.actor.getFlag(SYSTEM_ID, "npcArchetypeLabel") || "Sem arquetipo";
    context.npcCreator = {
      active: !initialized,
      importance: {
        ...currentLevel,
        canDecrease: currentLevelIndex > 0,
        canIncrease: currentLevelIndex >= 0 && currentLevelIndex < NPC_LEVELS.length - 1
      },
      levels: NPC_LEVELS.map((level) => ({
        ...level,
        selected: level.id === this._npcCreatorLevel
      })),
      skillDistributions: NPC_SKILL_DISTRIBUTIONS.map((distribution) => ({
        ...distribution,
        selected: distribution.id === this._npcCreatorSkillDistribution
      })),
      archetypes: NPC_ARCHETYPES.map((archetype) => ({
        ...archetype,
        selected: archetype.id === this._npcCreatorArchetype
      })),
      draft: this._npcCreatorDraft
    };
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelector("[data-action='decrease-npc-importance']")?.addEventListener("click", this.#onChangeNpcImportance.bind(this));
    this.element.querySelector("[data-action='increase-npc-importance']")?.addEventListener("click", this.#onChangeNpcImportance.bind(this));
    this.element.querySelectorAll("[data-action='select-npc-skill-distribution']").forEach((button) => {
      button.addEventListener("click", this.#onSelectNpcSkillDistribution.bind(this));
    });
    this.element.querySelectorAll("[data-action='select-npc-archetype']").forEach((button) => {
      button.addEventListener("click", this.#onSelectNpcArchetype.bind(this));
    });
    this.element.querySelector("[data-action='reroll-npc-draft']")?.addEventListener("click", this.#onRerollNpcDraft.bind(this));
    this.element.querySelector("[data-action='generate-npc']")?.addEventListener("click", this.#onGenerateNpc.bind(this));
    this.element.querySelector("[data-action='blank-npc']")?.addEventListener("click", this.#onBlankNpc.bind(this));
    this.element.querySelector("[data-action='reset-npc-creator']")?.addEventListener("click", this.#onResetNpcCreator.bind(this));
  }

  #refreshNpcDraft() {
    this._npcCreatorDraft = createNpcDraft(this._npcCreatorLevel, this._npcCreatorArchetype, this._npcCreatorSkillDistribution);
  }

  #onChangeNpcImportance(event) {
    event.preventDefault();
    const direction = event.currentTarget.dataset.direction === "up" ? 1 : -1;
    const index = NPC_LEVELS.findIndex((level) => level.id === this._npcCreatorLevel);
    const next = NPC_LEVELS[clampNumber(index + direction, 0, NPC_LEVELS.length - 1)];
    if (!next || next.id === this._npcCreatorLevel) return;
    this._npcCreatorLevel = next.id;
    this.#refreshNpcDraft();
    return this.render({ force: true });
  }

  #onSelectNpcSkillDistribution(event) {
    event.preventDefault();
    this._npcCreatorSkillDistribution = getNpcSkillDistribution(event.currentTarget.dataset.distribution).id;
    this.#refreshNpcDraft();
    return this.render({ force: true });
  }

  #onSelectNpcArchetype(event) {
    event.preventDefault();
    this._npcCreatorArchetype = getNpcArchetype(event.currentTarget.dataset.archetype).id;
    this.#refreshNpcDraft();
    return this.render({ force: true });
  }

  #onRerollNpcDraft(event) {
    event.preventDefault();
    this.#refreshNpcDraft();
    return this.render({ force: true });
  }

  #getNpcCreatorNameUpdate() {
    const name = this.element.querySelector("input[name='name']")?.value?.trim();
    return name ? { name } : {};
  }

  async #onGenerateNpc(event) {
    event.preventDefault();
    this._npcCreatorDraft ??= createNpcDraft(this._npcCreatorLevel, this._npcCreatorArchetype, this._npcCreatorSkillDistribution);
    await this.actor.update({
      ...buildNpcDraftUpdateData(this._npcCreatorDraft),
      ...this.#getNpcCreatorNameUpdate()
    });
    return this.render({ force: true });
  }

  async #onBlankNpc(event) {
    event.preventDefault();
    await this.actor.update({
      [`flags.${SYSTEM_ID}.npcInitialized`]: true,
      [`flags.${SYSTEM_ID}.npcArchetypeLabel`]: "Sem arquetipo",
      ...this.#getNpcCreatorNameUpdate()
    });
    return this.render({ force: true });
  }

  async #onResetNpcCreator(event) {
    event.preventDefault();
    return new Dialog({
      title: "Resetar criacao de NPC",
      content: `
        <div class="astrael-dialog-form">
          <p>Voltar para a tela de criacao de NPC?</p>
          <p>Os dados atuais da ficha nao serao apagados, mas o proximo NPC gerado pode sobrescrever atributos, pericias, recursos e rolagens.</p>
        </div>
      `,
      buttons: {
        cancel: {
          label: "Cancelar"
        },
        confirm: {
          label: "Resetar",
          callback: async () => {
            this._activeTab = "attributes";
            await this.actor.update({
              [`flags.${SYSTEM_ID}.npcInitialized`]: false
            });
            return this.render({ force: true });
          }
        }
      },
      default: "cancel"
    }, { classes: ["astrael-dialog"] }).render(true);
  }
}

Hooks.once("init", () => {
  console.log("Astrael RPG | Initializing system");

  removeDeprecatedActorTypes();
  CONFIG.Actor.dataModels.character = AstraelCharacterData;
  CONFIG.Actor.dataModels.npc = AstraelCharacterData;
  CONFIG.Item.dataModels.trait = AstraelTraitData;

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Actor,
    SYSTEM_ID,
    AstraelCharacterSheet,
    {
      types: ["character"],
      makeDefault: true,
      label: "Astrael RPG Character Sheet"
    }
  );

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Actor,
    SYSTEM_ID,
    AstraelCompactCharacterSheet,
    {
      types: ["character"],
      makeDefault: false,
      label: game.i18n.localize("ASTRAEL.Sheet.CharacterCompact")
    }
  );

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Actor,
    SYSTEM_ID,
    AstraelNpcSheet,
    {
      types: ["npc"],
      makeDefault: true,
      label: "Astrael RPG NPC Sheet"
    }
  );

  game.settings.register("astrael-rpg", "sheetHeight", {
    scope: "client",
    config: false,
    type: Number,
    default: 680,
    onChange: () => {}
  });

  game.settings.register(SYSTEM_ID, "compactAttributesCollapsed", {
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register(SYSTEM_ID, "compactResourceTooltipsDisabled", {
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

});

Hooks.on("renderApplicationV2", applyTokenPortraitsToActorDirectory);

Hooks.on("updateActor", (actor, changes) => {
  const tokenImageChanged = foundry.utils.hasProperty(changes, "prototypeToken.texture.src")
    || foundry.utils.hasProperty(changes, "prototypeToken.randomImg");
  if (!tokenImageChanged) return;

  ui.actors?.render({ force: true });
});

Hooks.once("ready", () => {
  console.log("Astrael RPG | Ready");

  game.astrael = {
    ...(game.astrael || {}),
    distributeXP() {
      const actors = game.actors?.filter(a => a.type === "character" && a.hasPlayerOwner) || [];
      if (!actors.length) {
        ui.notifications.warn("Nenhuma ficha de personagem encontrada.");
        return;
      }

      const optionsHtml = actors.map(a =>
        `<option value="${a.id}">${a.name}</option>`
      ).join("");

      const content = `
        <form class="astrael-dialog-form">
          <div class="form-group">
            <label>Personagem</label>
            <select name="target">
              <option value="all">Todos os Personagens</option>
              ${optionsHtml}
            </select>
          </div>
          <div class="form-group">
            <label>Valor de XP</label>
            <input type="number" name="xp-value" value="0" step="1">
          </div>
        </form>
      `;

      return new Dialog({
        title: "Distribuir XP",
        content,
        buttons: {
          distribute: {
            label: "Distribuir",
            callback: async (html) => {
              const value = Math.floor(Number(html.find("[name='xp-value']").val())) || 0;
              if (value === 0) {
                ui.notifications.warn("Informe um valor de XP diferente de zero.");
                return false;
              }
              const target = html.find("[name='target']").val();
              const list = target === "all" ? actors : [game.actors.get(target)].filter(Boolean);
              if (!list.length) {
                ui.notifications.warn("Nenhum personagem válido selecionado.");
                return false;
              }
              for (const actor of list) {
                const total = Math.max(0, (actor.system?.xp?.total || 0) + value);
                await actor.update({ "system.xp.total": total });
              }
              const sign = value > 0 ? "+" : "";
              ui.notifications.info(`XP ${sign}${value} para ${list.length} personagem(ns).`);
            }
          }
        },
        default: "distribute",
        render: () => {}
      }, { classes: ["astrael-dialog"] }).render(true);
    }
  };

  document.body.addEventListener("click", (event) => {
    const rerollBtn = event.target.closest(".astrael-reroll-btn");
    if (rerollBtn) {
      const card = rerollBtn.closest(".astrael-chat-card");
      const msgEl = card?.closest("[data-message-id]");
      const msg = msgEl ? game.messages.get(msgEl.dataset.messageId) : null;
      if (!msg?.rolls?.length) return;
      let originalValues;
      if (card.dataset.rerolledValues) {
        originalValues = card.dataset.rerolledValues.split(',').map(Number);
      } else {
        originalValues = getRollValues(msg.rolls[0]);
      }
      const useCriticals = card.dataset.useCriticals !== "false";
      const actor = game.actors.get(card.dataset.actorId);
      if (!actor) return;
      const wp = actor.system.resources?.willpower;
      if (!wp || (wp.active - wp.superficial - wp.aggravated) <= 0) {
        ui.notifications.warn(game.i18n.localize("ASTRAEL.Chat.NoWillpower"));
        return;
      }
      event.preventDefault();
      return showRerollDialog(actor, originalValues, useCriticals, card, msg);
    }

    const card = event.target.closest(".astrael-chat-card");
    const diceFooter = card?.querySelector(".astrael-chat-dice-footer");

    if (!card || !diceFooter) return;

    event.preventDefault();
    diceFooter.open = !diceFooter.open;
  });
});

export { SYSTEM_ID };
