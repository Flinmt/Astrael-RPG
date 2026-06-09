const SYSTEM_ID = "astrael-rpg";
const CHARACTER_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/actor/character-sheet.hbs`;

async function updateActorSheet(event, form, formData) {
  return this.actor.update(formData.object);
}

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

class AstraelCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "sheet", "actor"],
    position: {
      width: 520,
      height: 360
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: true,
      handler: updateActorSheet
    },
    window: {
      title: "Astrael RPG Character Sheet"
    }
  };

  static PARTS = {
    form: {
      template: CHARACTER_SHEET_TEMPLATE
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.actor = this.actor;
    context.system = this.actor.system;
    context.cssClass = this.isEditable ? "editable" : "locked";

    return context;
  }
}

Hooks.once("init", () => {
  console.log("Astrael RPG | Initializing system");

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
});

Hooks.once("ready", () => {
  console.log("Astrael RPG | Ready");
});

export { SYSTEM_ID };
