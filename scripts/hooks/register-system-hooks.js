import { SYSTEM_ID } from "../core/constants.js";
import { applyTokenPortraitsToActorDirectory } from "../core/utilities.js";
import { getRollValues } from "../rules/dice.js";
import { showRerollDialog } from "../chat/dice-pool.js";
import { AstraelCharacterData, AstraelTraitData, removeDeprecatedActorTypes } from "../data/models.js";
import { AstraelCharacterSheet } from "../sheets/character-sheet.js";

function registerSystemHooks() {
  Hooks.once("init", () => {
    console.log("Astrael RPG | Initializing system");
  
    removeDeprecatedActorTypes();
    CONFIG.Actor.dataModels.character = AstraelCharacterData;
    CONFIG.Item.dataModels.trait = AstraelTraitData;
  
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
}

export { registerSystemHooks };
