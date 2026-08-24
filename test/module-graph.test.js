import test from "node:test";
import assert from "node:assert/strict";

test("the Foundry entrypoint loads the complete module graph", async () => {
  class BaseApplication {
    static migrateData(source) {
      return source;
    }
  }
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
  assert.ok(CONFIG.Item.dataModels.item);
  assert.equal(registeredSheets.length, 4);
  assert.deepEqual(registeredSheets.map(({ options }) => options.types), [["character"], ["weapon"], ["trait"], ["item"]]);
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
        majorTrait: "assassinate"
      })
    }
  }), {
    name: "Knife",
    img: "knife.webp",
    system: {
      description: "<p>Draft <strong>description</strong></p>",
      damage: 2,
      minorTrait: "concealed",
      majorTrait: "assassinate"
    }
  });

  const { createItemDraft } = await import("../scripts/sheets/item-sheet.js");
  assert.deepEqual(createItemDraft({
    name: "Letter",
    img: "letter.webp",
    system: {
      toObject: () => ({ description: "<p>Sealed correspondence</p>" })
    }
  }), {
    name: "Letter",
    img: "letter.webp",
    system: { description: "<p>Sealed correspondence</p>" }
  });

  const { createTraitDraft } = await import("../scripts/sheets/trait-sheet.js");
  assert.deepEqual(createTraitDraft({
    name: "Keen Senses",
    img: "senses.webp",
    system: {
      toObject: () => ({ description: "<p>Always alert.</p>", category: "flaw", level: 3 })
    }
  }), {
    name: "Keen Senses",
    img: "senses.webp",
    system: { description: "<p>Always alert.</p>", category: "flaw", level: 3 },
    category: "flaw",
    isFlaw: true,
    levels: [
      { value: 1, filled: true, current: false },
      { value: 2, filled: true, current: false },
      { value: 3, filled: true, current: true },
      { value: 4, filled: false, current: false },
      { value: 5, filled: false, current: false }
    ]
  });

  const { AstraelTraitData } = await import("../scripts/data/models.js");
  assert.deepEqual(AstraelTraitData.migrateData({ value: 4 }), {
    category: "advantage",
    level: 4
  });

});
