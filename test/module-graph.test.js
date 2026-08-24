import test from "node:test";
import assert from "node:assert/strict";

test("the Foundry entrypoint loads the complete module graph", async () => {
  class BaseApplication {}
  class Field {}
  const HandlebarsApplicationMixin = (Parent) => class extends Parent {};
  const onceHooks = new Map();
  const registeredSheets = [];

  globalThis.foundry = {
    abstract: { TypeDataModel: BaseApplication },
    data: {
      fields: {
        ArrayField: Field,
        BooleanField: Field,
        NumberField: Field,
        ObjectField: Field,
        SchemaField: Field,
        StringField: Field
      }
    },
    applications: {
      api: { ApplicationV2: BaseApplication, HandlebarsApplicationMixin },
      apps: {
        DocumentSheetConfig: {
          registerSheet(documentClass, namespace, sheetClass, options) {
            registeredSheets.push({ documentClass, namespace, sheetClass, options });
          }
        }
      },
      sheets: { ActorSheetV2: BaseApplication, ItemSheetV2: BaseApplication }
    },
    utils: {}
  };
  globalThis.CONFIG = {
    Actor: { dataModels: {}, typeLabels: {} },
    Item: { dataModels: {} }
  };
  globalThis.game = {
    i18n: { localize: (key) => key },
    settings: { register() {} },
    system: { documentTypes: { Actor: { character: {} } } }
  };
  globalThis.Hooks = {
    once(event, callback) {
      onceHooks.set(event, callback);
    },
    on() {}
  };
  globalThis.Actor = class {};
  globalThis.Item = class {};

  const entrypoint = await import("../scripts/astrael-rpg.js");
  assert.equal(entrypoint.SYSTEM_ID, "astrael-rpg");

  onceHooks.get("init")();
  assert.ok(CONFIG.Actor.dataModels.character);
  assert.ok(CONFIG.Item.dataModels.trait);
  assert.ok(CONFIG.Item.dataModels.weapon);
  assert.equal(registeredSheets.length, 2);
  assert.deepEqual(registeredSheets.map(({ options }) => options.types), [["character"], ["weapon"]]);
  const weaponSheet = registeredSheets.find(({ options }) => options.types.includes("weapon"));
  assert.equal(weaponSheet.sheetClass.DEFAULT_OPTIONS.tag, "form");

  const { createWeaponDraft } = await import("../scripts/sheets/weapon-sheet.js");
  assert.deepEqual(createWeaponDraft({
    name: "Knife",
    img: "knife.webp",
    system: {
      toObject: () => ({
        description: "<p>Draft <strong>description</strong></p>",
        damage: 2,
        minorTrait: "concealed",
        majorTrait: "assassinate",
        rollAttribute: "dexterity",
        rollSkill: "melee"
      })
    }
  }), {
    name: "Knife",
    img: "knife.webp",
    system: {
      description: "<p>Draft <strong>description</strong></p>",
      damage: 2,
      minorTrait: "concealed",
      majorTrait: "assassinate",
      rollAttribute: "dexterity",
      rollSkill: "melee"
    }
  });

});
