import {
  ATTRIBUTE_KEYS,
  CONVICTION_CARD_COUNT,
  DEFAULT_RESOURCES,
  RESOURCE_MINIMUMS,
  SKILL_KEYS
} from "../core/constants.js";
import { clampNumber, isNumeric } from "../core/utilities.js";
import { normalizeDamage } from "../rules/resources.js";

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

function convictionField() {
  return new SchemaField({
    name: stringField(),
    description: stringField(),
    fractures: new NumberField({ required: true, integer: true, min: 0, max: 2, initial: 0 }),
    pillar: new SchemaField({
      name: stringField(),
      description: stringField()
    })
  });
}

function experienceEntryField() {
  return new SchemaField({
    amount: new NumberField({ required: true, integer: true, min: 1, initial: 1 }),
    description: stringField(),
    distributionId: stringField(),
    awardedAt: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
  });
}

function createEmptyConviction() {
  return {
    name: "",
    description: "",
    fractures: 0,
    pillar: {
      name: "",
      description: ""
    }
  };
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
        spent: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        history: new ArrayField(experienceEntryField(), { required: true, initial: () => [] })
      }),
      sheetSettings: new SchemaField({
        visibleTabs: new SchemaField({
          virtues: new BooleanField({ required: true, initial: true }),
          hemomancy: new BooleanField({ required: true, initial: true }),
          strangerMark: new BooleanField({ required: true, initial: true })
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
      convictions: new ArrayField(convictionField(), {
        required: true,
        initial: () => Array.from({ length: CONVICTION_CARD_COUNT }, createEmptyConviction)
      }),
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

export { AstraelCharacterData, AstraelTraitData, removeDeprecatedActorTypes, updateActorSheet };
