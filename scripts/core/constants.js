const SYSTEM_ID = "astrael-rpg";
const CHARACTER_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/actor/character-sheet.hbs`;
const CHARACTER_PORTRAIT_EDITOR_TEMPLATE = `systems/${SYSTEM_ID}/templates/apps/character-portrait-editor.hbs`;
const WEAPON_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/item/weapon-sheet.hbs`;
const ITEM_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/item/item-sheet.hbs`;
const TRAIT_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/item/trait-sheet.hbs`;
const SPECIALTIES_PANEL_TEMPLATE = `systems/${SYSTEM_ID}/templates/apps/specialties-panel.hbs`;
const STRANGER_MARKS_PANEL_TEMPLATE = `systems/${SYSTEM_ID}/templates/apps/stranger-marks-panel.hbs`;
const XP_DISTRIBUTOR_TEMPLATE = `systems/${SYSTEM_ID}/templates/apps/xp-distributor.hbs`;
const DICE_POOL_CHAT_TEMPLATE = `systems/${SYSTEM_ID}/templates/chat/dice-pool-card.hbs`;
const RESOURCE_MINIMUMS = { health: 4, willpower: 2 };
const CONVICTION_CARD_COUNT = 3;
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

export {
  ATTRIBUTE_KEYS,
  CHARACTER_PORTRAIT_EDITOR_TEMPLATE,
  CHARACTER_SHEET_TEMPLATE,
  CONVICTION_CARD_COUNT,
  DEFAULT_RESOURCES,
  DICE_POOL_CHAT_TEMPLATE,
  ITEM_SHEET_TEMPLATE,
  LOCALIZE_ATTR,
  LOCALIZE_SKILL,
  RESOURCE_MINIMUMS,
  SKILL_KEYS,
  SPECIALTIES_PANEL_TEMPLATE,
  STRANGER_MARK_OPTIONS,
  STRANGER_MARKS_PANEL_TEMPLATE,
  SYSTEM_ID,
  TRAIT_SHEET_TEMPLATE,
  WEAPON_SHEET_TEMPLATE,
  XP_DISTRIBUTOR_TEMPLATE
};
