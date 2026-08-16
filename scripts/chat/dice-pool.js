import { DICE_POOL_CHAT_TEMPLATE } from "../core/constants.js";
import { getRollValues, prepareDicePoolResults, summarizeDicePool } from "../rules/dice.js";

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

export { createDicePoolMessage, renderAstraelTemplate, showRerollDialog };
