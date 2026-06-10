const SYSTEM_ID = "astrael-rpg";
const CHARACTER_SHEET_TEMPLATE = `systems/${SYSTEM_ID}/templates/actor/character-sheet.hbs`;
const DICE_POOL_CHAT_TEMPLATE = `systems/${SYSTEM_ID}/templates/chat/dice-pool-card.hbs`;
const RESOURCE_MINIMUMS = { health: 4, willpower: 2 };
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
  return {
    successes: values.reduce((total, value) => {
      if (useCriticals && value === 10) return total + 4;
      if (value >= 6) return total + 1;
      return total;
    }, 0)
  };
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

async function createDicePoolMessage({ actor, title, kicker, diceCount, useCriticals = true }) {
  const roll = await new Roll(`${diceCount}d10`).evaluate();
  const values = getRollValues(roll);
  const summary = summarizeDicePool(values, { useCriticals });
  const dice = prepareDicePoolResults(values, { useCriticals });
  const content = await renderAstraelTemplate(DICE_POOL_CHAT_TEMPLATE, {
    title,
    kicker,
    actorName: actor.name,
    dice,
    ...summary
  });

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll]
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
    for (const key of ["strength", "dexterity", "stamina", "charisma", "manipulation", "composure", "intelligence", "wits", "resolve"]) {
      const attr = context.system.attributes[key];
      if (!attr || !Number.isFinite(Number(attr.value)) || Number(attr.value) < 1) {
        context.system.attributes[key] = { value: 1 };
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

    this.element.querySelector("[data-action='editImage']")?.addEventListener("click", this.#onEditImage.bind(this));
    this.element.querySelector("[data-action='rouseCheck']")?.addEventListener("click", this.#onRouseCheck.bind(this));
  }

  async #onInputChange(event) {
    const input = event.currentTarget;

    return this.actor.update({ [input.name]: input.value });
  }

  async #onDotClick(event) {
    event.preventDefault();
    const track = event.currentTarget;
    const name = track.dataset.name;
    const rect = track.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const nextValue = rect.width ? Math.ceil(relativeX / (rect.width / 5)) : 0;
    const clamped = Math.max(1, Math.min(5, nextValue));
    const currentValue = Number(track.dataset.value) || 0;
    const newValue = currentValue === clamped ? Math.max(1, clamped - 1) : clamped;

    return this.actor.update({ [name]: newValue });
  }

  async #onDotContext(event) {
    event.preventDefault();
    const track = event.currentTarget;
    const name = track.dataset.name;

    return this.actor.update({ [name]: 1 });
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
});

export { SYSTEM_ID };
