import { SYSTEM_ID } from "../core/constants.js";
import { applyTokenPortraitsToActorDirectory } from "../core/utilities.js";
import { getRollValues } from "../rules/dice.js";
import { showRerollDialog } from "../chat/dice-pool.js";
import { openExperienceDistributor } from "../applications/xp-distributor.js";
import { AstraelCharacterData, AstraelItemData, AstraelTraitData, AstraelWeaponData, removeDeprecatedActorTypes } from "../data/models.js";
import { AstraelCharacterSheet } from "../sheets/character-sheet.js";
import { AstraelItemSheet } from "../sheets/item-sheet.js";
import { AstraelTraitSheet } from "../sheets/trait-sheet.js";
import { AstraelWeaponSheet } from "../sheets/weapon-sheet.js";
import { addExperienceDistributorToActorDirectory } from "./actor-directory.js";

const FOCUS_NAVIGATION_KEYS = ["Tab", "Enter", " ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

function registerSystemHooks() {
  Hooks.once("init", () => {
    console.log("Astrael RPG | Initializing system");
  
    removeDeprecatedActorTypes();
    CONFIG.Actor.dataModels.character = AstraelCharacterData;
    CONFIG.Item.dataModels.trait = AstraelTraitData;
    CONFIG.Item.dataModels.weapon = AstraelWeaponData;
    CONFIG.Item.dataModels.item = AstraelItemData;
  
    foundry.applications.apps.DocumentSheetConfig.registerSheet(
      Actor,
      SYSTEM_ID,
      AstraelCharacterSheet,
      {
        types: ["character"],
        makeDefault: true,
        label: game.i18n.localize("ASTRAEL.Sheet.Character")
      }
    );

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
      Item,
      SYSTEM_ID,
      AstraelWeaponSheet,
      {
        types: ["weapon"],
        makeDefault: true,
        label: game.i18n.localize("ASTRAEL.Sheet.Weapon")
      }
    );

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
      Item,
      SYSTEM_ID,
      AstraelTraitSheet,
      {
        types: ["trait"],
        makeDefault: true,
        label: game.i18n.localize("ASTRAEL.Sheet.Trait")
      }
    );

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
      Item,
      SYSTEM_ID,
      AstraelItemSheet,
      {
        types: ["item"],
        makeDefault: true,
        label: game.i18n.localize("ASTRAEL.Sheet.Item")
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

    game.settings.register(SYSTEM_ID, "xpDistributionHistory", {
      scope: "world",
      config: false,
      type: Object,
      default: { version: 1, events: [] }
    });
  
  });
  
  Hooks.on("renderApplicationV2", applyTokenPortraitsToActorDirectory);
  Hooks.on("renderApplicationV2", addExperienceDistributorToActorDirectory);
  
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
      distributeXP: openExperienceDistributor
    };
  
    document.addEventListener("pointerdown", () => {
      document.documentElement.dataset.input = "pointer";
    }, true);

    document.addEventListener("keydown", (event) => {
      if (FOCUS_NAVIGATION_KEYS.includes(event.key)) {
        document.documentElement.dataset.input = "keyboard";
      }
    }, true);

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
}

export { registerSystemHooks };
