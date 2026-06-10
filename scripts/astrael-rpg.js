const SYSTEM_ID = "astrael-rpg";
const CHARACTER_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/actor/character-sheet.hbs`;
const DICE_POOL_CHAT_TEMPLATE = `systems/${SYSTEM_ID}/templates/chat/dice-pool-card.hbs`;
const RESOURCE_MINIMUMS = { health: 4, willpower: 2 };
const ATTRIBUTE_KEYS = ["strength", "dexterity", "stamina", "charisma", "manipulation", "composure", "intelligence", "wits", "resolve"];
const SKILL_KEYS = ["athletics", "brawl", "crafts", "drive", "firearms", "larceny", "melee", "stealth", "survival", "animalKen", "empathy", "etiquette", "expression", "intimidation", "leadership", "persuasion", "streetwise", "subterfuge", "academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"];
const LOCALIZE_ATTR = { strength: "ASTRAEL.Attribute.Strength", dexterity: "ASTRAEL.Attribute.Dexterity", stamina: "ASTRAEL.Attribute.Stamina", charisma: "ASTRAEL.Attribute.Charisma", manipulation: "ASTRAEL.Attribute.Manipulation", composure: "ASTRAEL.Attribute.Composure", intelligence: "ASTRAEL.Attribute.Intelligence", wits: "ASTRAEL.Attribute.Wits", resolve: "ASTRAEL.Attribute.Resolve" };
const LOCALIZE_SKILL = { athletics: "ASTRAEL.Skill.Athletics", brawl: "ASTRAEL.Skill.Brawl", crafts: "ASTRAEL.Skill.Crafts", drive: "ASTRAEL.Skill.Drive", firearms: "ASTRAEL.Skill.Firearms", larceny: "ASTRAEL.Skill.Larceny", melee: "ASTRAEL.Skill.Melee", stealth: "ASTRAEL.Skill.Stealth", survival: "ASTRAEL.Skill.Survival", animalKen: "ASTRAEL.Skill.AnimalKen", empathy: "ASTRAEL.Skill.Empathy", etiquette: "ASTRAEL.Skill.Etiquette", expression: "ASTRAEL.Skill.Expression", intimidation: "ASTRAEL.Skill.Intimidation", leadership: "ASTRAEL.Skill.Leadership", persuasion: "ASTRAEL.Skill.Persuasion", streetwise: "ASTRAEL.Skill.Streetwise", subterfuge: "ASTRAEL.Skill.Subterfuge", academics: "ASTRAEL.Skill.Academics", awareness: "ASTRAEL.Skill.Awareness", finance: "ASTRAEL.Skill.Finance", investigation: "ASTRAEL.Skill.Investigation", medicine: "ASTRAEL.Skill.Medicine", occult: "ASTRAEL.Skill.Occult", politics: "ASTRAEL.Skill.Politics", science: "ASTRAEL.Skill.Science", technology: "ASTRAEL.Skill.Technology" };
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

async function updateActorSheet(event, form, formData) {
  return this.actor.update(formData.object);
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function isNumeric(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function normalizeResource(resourceId, source = {}) {
  const fallback = DEFAULT_RESOURCES[resourceId];
  const max = clampNumber(source.max ?? fallback.max, 0, fallback.max);

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
    if (useCriticals && value === 10) return total + 2;
    if (value >= 6) return total + 1;
    return total;
  }, 0);
  const numTens = values.filter((v) => v === 10).length;
  const pairBonus = useCriticals ? Math.floor(numTens / 2) * 2 : 0;

  return { successes: totalBase + pairBonus };
}

function prepareDicePoolResults(values, { useCriticals = true } = {}) {
  let pairedCriticals = useCriticals ? Math.floor(values.filter((value) => value === 10).length / 2) * 2 : 0;

  return values.map((value) => {
    const classification = classifyDie(value, { useCriticals });
    const isPairedCritical = value === 10 && pairedCriticals > 0;

    if (isPairedCritical) pairedCriticals -= 1;

    return {
      value,
      ...classification,
      type: isPairedCritical ? `${classification.type} paired-critical` : classification.type,
      label: isPairedCritical ? "Par critico" : classification.label
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

async function createDicePoolMessage({ actor, title, kicker, diceCount, useCriticals = true, preRolledValues = null }) {
  let values;
  let roll;
  if (preRolledValues) {
    values = preRolledValues;
  } else {
    roll = await new Roll(`${diceCount}d10`).evaluate();
    values = getRollValues(roll);
  }
  const summary = summarizeDicePool(values, { useCriticals });
  const dice = prepareDicePoolResults(values, { useCriticals });
  const isRouseCheck = !useCriticals && diceCount === 1;
  const content = await renderAstraelTemplate(DICE_POOL_CHAT_TEMPLATE, {
    title,
    kicker,
    actorName: actor.name,
    actorId: actor.id,
    useCriticals,
    isRouseCheck,
    dice,
    ...summary
  });

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: roll ? [roll] : []
  });
}

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

class AstraelCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
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

    context.actor = this.actor;
    context.system = foundry.utils.mergeObject(
      { resources: DEFAULT_RESOURCES },
      this.actor.system,
      { inplace: false }
    );
    context.system.resources.health = normalizeResource("health", context.system.resources.health);
    context.system.resources.willpower = normalizeResource("willpower", context.system.resources.willpower);
    context.system.attributes ??= {};
    for (const key of ATTRIBUTE_KEYS) {
      const attr = context.system.attributes[key];
      if (!attr || !Number.isFinite(Number(attr.value)) || Number(attr.value) < 1) {
        context.system.attributes[key] = { value: 1 };
      }
    }
    context.system.skills ??= {};
    for (const key of SKILL_KEYS) {
      const skill = context.system.skills[key];
      if (!skill || !Number.isFinite(Number(skill.value))) {
        context.system.skills[key] = { value: 0 };
      }
    }
    context.cssClass = this.isEditable ? "editable" : "locked";

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelectorAll(".resource-box").forEach((box) => {
      box.addEventListener("click", this.#onResourceBoxClick.bind(this));
    });

    this.element.querySelectorAll("[data-damage]").forEach((button) => {
      button.addEventListener("click", this.#onDamageButtonClick.bind(this));
      button.addEventListener("contextmenu", this.#onDamageButtonContext.bind(this));
    });

    this.element.querySelectorAll("input[name]").forEach((input) => {
      input.addEventListener("change", this.#onInputChange.bind(this));
    });

    this.element.querySelectorAll(".tab-button").forEach((btn) => {
      btn.addEventListener("click", this.#onTabClick.bind(this));
    });

    this.element.querySelectorAll(".dot-track").forEach((track) => {
      track.addEventListener("click", this.#onDotClick.bind(this));
      track.addEventListener("contextmenu", this.#onDotContext.bind(this));
    });

    this.element.querySelectorAll(".rollable").forEach((el) => {
      el.addEventListener("click", this.#onRollClick.bind(this));
    });

    this.element.querySelector("[data-action='editImage']")?.addEventListener("click", this.#onEditImage.bind(this));
    this.element.querySelector("[data-action='rouseCheck']")?.addEventListener("click", this.#onRouseCheck.bind(this));
  }

  async #onRollClick(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const type = element.dataset.type;
    const key = element.dataset.key;

    const ROLL_MODES = [
      { key: "skill", label: "Perícia" },
      { key: "attribute", label: "Atributo" }
    ];

    const allAttrOptions = ATTRIBUTE_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
    ).join("");

    const allSkillOptions = SKILL_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`
    ).join("");

    const initialModeIndex = type === "attribute" ? 1 : 0;
    const initialMode = ROLL_MODES[initialModeIndex];
    const initialSecondOptions = initialMode.key === "attribute" ? allAttrOptions : allSkillOptions;

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
            <select name="specialty" disabled>
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
            const system = this.actor.system;

            const attrValue = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
            let secondValue, titleLeft, titleRight;

            if (modeKey === "skill") {
              secondValue = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
              titleLeft = game.i18n.localize(LOCALIZE_SKILL[secondKey]);
              titleRight = game.i18n.localize(LOCALIZE_ATTR[attrKey]);
            } else {
              secondValue = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
              titleLeft = game.i18n.localize(LOCALIZE_ATTR[secondKey]);
              titleRight = game.i18n.localize(LOCALIZE_ATTR[attrKey]);
            }

            const diceCount = Math.max(1, attrValue + secondValue + modifier);

            console.group("Astrael RPG | Detalhes da Rolagem");
            console.log("Atributo:", attrKey, attrValue);
            console.log("Modo:", modeKey, "Chave:", secondKey, secondValue);
            console.log("Modificador:", modifier);
            console.log("Total de Dados:", diceCount);
            console.groupEnd();

            return createDicePoolMessage({
              actor: this.actor,
              title: `${titleLeft} + ${titleRight}`,
              kicker: "Teste de Perícia",
              diceCount: diceCount
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
          updatePreview();
        };

        const updatePreview = () => {
          const attrKey = html.find("[name='attribute']").val();
          const secondKey = html.find("[name='second']").val();
          const modeKey = html.find("[name='mode']").val();
          const modifier = Number(html.find("[name='modifier']").val()) || 0;
          const system = this.actor.system;

          const attrVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
          let secondVal;
          if (modeKey === "skill") {
            secondVal = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
          } else {
            secondVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
          }

          html.find(".pool-total").text(`${Math.max(1, attrVal + secondVal + modifier)} dados`);
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

        html.find("[name='second'], [name='modifier']").on("change input", updatePreview);

        if (type === "attribute") {
          const differentAttr = ATTRIBUTE_KEYS.find((k) => k !== key) || ATTRIBUTE_KEYS[0];
          html.find("[name='attribute']").val(differentAttr);
          html.find("[name='second']").val(key);
        } else {
          html.find("[name='second']").val(key);
        }

        updatePreview();
      }
    }, { classes: ["astrael-dialog"] });

    return dialog.render(true);
  }

  async #onInputChange(event) {
    const input = event.currentTarget;

    return this.actor.update({ [input.name]: input.value });
  }

  #dotMin(name) {
    return name?.startsWith("system.skills") ? 0 : 1;
  }

  async #onDotClick(event) {
    event.preventDefault();
    const track = event.currentTarget;
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
    const name = track.dataset.name;

    return this.actor.update({ [name]: this.#dotMin(name) });
  }

  async #onResourceBoxClick(event) {
    event.preventDefault();

    const box = event.currentTarget;
    const resourceId = box.dataset.resource;
    const state = box.dataset.state ?? "empty";
    const index = Number(box.dataset.index);
    const resource = this.#getResource(resourceId);

    if (!resource || !Number.isInteger(index)) return;

    if (state === "empty") resource.active = index + 1;
    else if (state === "filled") resource.active = index;
    else if (state === "superficial") resource.superficial = Math.max(0, resource.superficial - 1);
    else if (state === "aggravated") {
      resource.aggravated = Math.max(0, resource.aggravated - 1);
      resource.superficial += 1;
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

    if (damageType === "superficial" && resource.superficial > 0) resource.superficial -= 1;
    else if (damageType === "aggravated" && resource.aggravated > 0) {
      resource.aggravated -= 1;
      resource.superficial += 1;
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

    return normalizeResource(resourceId, this.actor.system.resources?.[resourceId]);
  }

  async #updateResource(resourceId, resource) {
    const normalized = normalizeResource(resourceId, resource);

    return this.actor.update({
      [`system.resources.${resourceId}.max`]: normalized.max,
      [`system.resources.${resourceId}.active`]: normalized.active,
      [`system.resources.${resourceId}.superficial`]: normalized.superficial,
      [`system.resources.${resourceId}.aggravated`]: normalized.aggravated
    });
  }

  async #onTabClick(event) {
    event.preventDefault();

    const btn = event.currentTarget;
    const tabId = btn.dataset.tab;

    this.element.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    this.element.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    const panel = this.element.querySelector(`.tab-panel[data-tab="${tabId}"]`);
    if (panel) panel.classList.add("active");
  }

  setPosition(position) {
    if (position) position.width = 900;
    return super.setPosition(position);
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

  async #onRouseCheck(event) {
    event.preventDefault();

    return createDicePoolMessage({
      actor: this.actor,
      title: "Teste de Queima",
      kicker: "Queima",
      diceCount: 1,
      useCriticals: false
    });
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

  document.body.addEventListener("click", (event) => {
    const card = event.target.closest(".astrael-chat-card");
    const diceFooter = card?.querySelector(".astrael-chat-dice-footer");

    if (!card || !diceFooter) return;

    event.preventDefault();
    diceFooter.open = !diceFooter.open;
  });

  Hooks.on("getChatMessageContextOptions", (chatLog, entries) => {
    entries.push({
      label: game.i18n.localize("ASTRAEL.Chat.WillpowerReroll"),
      icon: "fa-solid fa-redo",
      visible: (target) => {
        const card = target.querySelector(".astrael-chat-card.astrael-dice-pool-card");
        if (!card) return false;
        if (card.dataset.isRouseCheck === "true") return false;
        const msg = target.dataset.messageId ? game.messages.get(target.dataset.messageId) : null;
        if (!msg?.rolls?.length) return false;
        const actor = game.actors?.get(card.dataset.actorId);
        if (!actor) return false;
        const wp = actor.system.resources?.willpower;
        if (!wp) return false;
        return wp.active > RESOURCE_MINIMUMS.willpower;
      },
      onClick: async (event, target) => {
        const card = target.querySelector(".astrael-chat-card.astrael-dice-pool-card");
        const msg = game.messages.get(target.dataset.messageId);
        const roll = msg.rolls[0];
        const originalValues = getRollValues(roll);
        const useCriticals = card.dataset.useCriticals !== "false";
        const actor = game.actors.get(card.dataset.actorId);

        const diceHtml = originalValues.map((v, i) => {
          const cls = v >= 10 ? "critical" : v >= 6 ? "success" : "failure";
          return `<span class="reroll-die ${cls}" data-index="${i}">${v}</span>`;
        }).join("");

        const rerollPrompt = game.i18n.localize("ASTRAEL.Chat.RerollPrompt");
        const rerollLimit = game.i18n.localize("ASTRAEL.Chat.RerollLimit");

        new Dialog({
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
                const wp = actor.system.resources.willpower;
                await actor.update({
                  "system.resources.willpower.active": Math.max(
                    RESOURCE_MINIMUMS.willpower,
                    (wp.active ?? 2) - 1
                  )
                });
                const msgTitle = msg.content ? $(msg.content).find(".astrael-chat-header h2").text() : "";
                const msgKicker = msg.content ? $(msg.content).find(".astrael-chat-kicker").text() : "";
                return createDicePoolMessage({
                  actor,
                  title: msgTitle.trim() || game.i18n.localize("ASTRAEL.Chat.WillpowerReroll"),
                  kicker: msgKicker.trim() || "Rerrolar",
                  diceCount: newValues.length,
                  useCriticals,
                  preRolledValues: newValues
                });
              }
            }
          },
          default: "reroll",
          render: (html) => {
            html.find(".reroll-die").on("click", function() {
              const selectedCount = html.find(".reroll-die.selected").length;
              if ($(this).hasClass("selected")) {
                $(this).removeClass("selected");
              } else if (selectedCount < 3) {
                $(this).addClass("selected");
              }
            });
          }
        }, { classes: ["astrael-dialog"] }).render(true);
      }
    });
  });
});

export { SYSTEM_ID };
