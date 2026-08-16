import test from "node:test";
import assert from "node:assert/strict";

test("the Foundry entrypoint loads the complete module graph", async () => {
  class BaseApplication {}
  class Field {}
  const HandlebarsApplicationMixin = (Parent) => class extends Parent {};

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
      sheets: { ActorSheetV2: BaseApplication }
    },
    utils: {}
  };
  globalThis.Hooks = { once() {}, on() {} };
  globalThis.Actor = class {};

  const entrypoint = await import("../scripts/astrael-rpg.js");
  assert.equal(entrypoint.SYSTEM_ID, "astrael-rpg");
});
