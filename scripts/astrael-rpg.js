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

async function showRerollDialog(actor, originalValues, useCriticals, card, msg) {
  const diceHtml = originalValues.map((v, i) => {
    const cls = v >= 10 ? "critical" : v >= 6 ? "success" : "failure";
    return `<span class="reroll-die ${cls}" data-index="${i}">${v}</span>`;
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
          const dice = prepareDicePoolResults(newValues, { useCriticals });
          const newContent = await renderAstraelTemplate(DICE_POOL_CHAT_TEMPLATE, {
            title,
            kicker,
            actorName,
            actorId: actor.id,
            useCriticals,
            isRouseCheck: false,
            rerolled: true,
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
      html.find(".reroll-die").on("click", function() {
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
    context.system.specialties = Array.isArray(context.system.specialties) ? context.system.specialties : [];
    context.system.customRolls = Array.isArray(context.system.customRolls) ? context.system.customRolls : [];
    context.system.specialties = context.system.specialties.map(spec => ({
      ...spec,
      skillLabel: LOCALIZE_SKILL[spec.skill] ? game.i18n.localize(LOCALIZE_SKILL[spec.skill]) : spec.skill || ""
    }));
    context.system.xp ??= { total: 0, current: 0, spent: 0 };
    context.system.xp.total = Math.max(0, context.system.xp.total || 0);
    context.system.xp.current = Math.max(0, context.system.xp.total - (context.system.xp.spent || 0));
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

    this.element.querySelector("[data-action='add-specialty']")?.addEventListener("click", this.#onAddSpecialty.bind(this));
    this.element.querySelectorAll("[data-action='edit-specialty']").forEach((el) => {
      el.addEventListener("click", this.#onEditSpecialty.bind(this));
    });

    this.element.querySelector("[data-action='add-custom-roll']")?.addEventListener("click", this.#onAddCustomRoll.bind(this));
    this.element.querySelectorAll("[data-action='edit-custom-roll']").forEach((el) => {
      el.addEventListener("click", this.#onEditCustomRoll.bind(this));
    });
    this.element.querySelectorAll(".custom-roll-entry").forEach((el) => {
      el.addEventListener("click", this.#onCustomRollClick.bind(this));
    });
    this.element.querySelector("[data-action='add-advantage']")?.addEventListener("click", this.#onAddAdvantage.bind(this));
    this.element.querySelector("[data-action='add-flaw']")?.addEventListener("click", this.#onAddFlaw.bind(this));

    this.element.querySelectorAll("[data-action='remove-advantage']").forEach(btn => {
      btn.addEventListener("click", this.#onRemoveAdvantage.bind(this));
    });

    this.element.querySelectorAll("[data-action='remove-flaw']").forEach(btn => {
      btn.addEventListener("click", this.#onRemoveFlaw.bind(this));
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
            <select name="specialty">
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
            const specialty = modeKey === "skill" ? html.find("[name='specialty']").val() : "";
            const specialtyBonus = specialty ? 1 : 0;
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

            const diceCount = Math.max(1, attrValue + secondValue + modifier + specialtyBonus);

            console.group("Astrael RPG | Detalhes da Rolagem");
            console.log("Atributo:", attrKey, attrValue);
            console.log("Modo:", modeKey, "Chave:", secondKey, secondValue);
            console.log("Modificador:", modifier);
            if (specialty) console.log("Especialidade:", specialty, "+1 dado");
            console.log("Total de Dados:", diceCount);
            console.groupEnd();

            const titleSuffix = specialty ? ` (${specialty})` : "";

            return createDicePoolMessage({
              actor: this.actor,
              title: `${titleLeft} + ${titleRight}${titleSuffix}`,
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
          html.find(".specialty-group").toggle(mode.key === "skill");
          if (mode.key === "skill") populateSpecialties(html.find("[name='second']").val());
          updatePreview();
        };

        const populateSpecialties = (skillKey) => {
          const select = html.find("[name='specialty']");
          const actorData = this.actor.toObject();
          const specialties = Array.isArray(actorData.system.specialties) ? actorData.system.specialties : [];
          const filtered = specialties.filter(s => s.skill === skillKey);
          let opts = '<option value="">Nenhuma</option>';
          filtered.forEach(s => {
            opts += `<option value="${s.description}">${s.description}</option>`;
          });
          select.html(opts);
          select.prop("disabled", filtered.length === 0);
        };

        const updatePreview = () => {
          const attrKey = html.find("[name='attribute']").val();
          const secondKey = html.find("[name='second']").val();
          const modeKey = html.find("[name='mode']").val();
          const modifier = Number(html.find("[name='modifier']").val()) || 0;
          const specialtyBonus = modeKey === "skill" && html.find("[name='specialty']").val() ? 1 : 0;
          const system = this.actor.system;

          const attrVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
          let secondVal;
          if (modeKey === "skill") {
            secondVal = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
          } else {
            secondVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
          }

          html.find(".pool-total").text(`${Math.max(1, attrVal + secondVal + modifier + specialtyBonus)} dados`);
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

        html.find("[name='second']").on("change", function() {
          if (html.find("[name='mode']").val() === "skill") {
            populateSpecialties($(this).val());
          }
        });

        html.find("[name='second'], [name='modifier']").on("change input", updatePreview);

        html.find("[name='specialty']").on("change", updatePreview);

        if (type === "attribute") {
          const differentAttr = ATTRIBUTE_KEYS.find((k) => k !== key) || ATTRIBUTE_KEYS[0];
          html.find("[name='attribute']").val(differentAttr);
          html.find("[name='second']").val(key);
        } else {
          html.find("[name='second']").val(key);
        }

        updatePreview();
        html.find(".specialty-group").toggle(initialMode.key === "skill");
        if (initialMode.key === "skill") populateSpecialties(html.find("[name='second']").val());
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

    if (damageType === "superficial") {
      if (resource.superficial > 0) {
        resource.superficial -= 1;
      } else if (resource.aggravated > 0) {
        resource.aggravated -= 1;
        resource.superficial += 1;
      }
    } else if (damageType === "aggravated") {
      if (resource.aggravated > 0) {
        resource.aggravated -= 1;
        resource.superficial += 1;
      } else if (resource.superficial > 0) {
        resource.superficial -= 1;
      }
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

  async #onAddAdvantage(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const advantages = Array.isArray(actorData.system.advantages) ? [...actorData.system.advantages] : [];
    advantages.push({ name: "Nova Vantagem", points: "I", details: "" });
    return this.actor.update({ "system.advantages": advantages });
  }

  async #onAddFlaw(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const flaws = Array.isArray(actorData.system.flaws) ? [...actorData.system.flaws] : [];
    flaws.push({ name: "Nova Desvantagem", points: "-I", details: "" });
    return this.actor.update({ "system.flaws": flaws });
  }

  async #onRemoveAdvantage(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const actorData = this.actor.toObject();
    const list = Array.isArray(actorData.system.advantages) ? [...actorData.system.advantages] : [];
    list.splice(index, 1);
    return this.actor.update({ "system.advantages": list });
  }

  async #onRemoveFlaw(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const actorData = this.actor.toObject();
    const list = Array.isArray(actorData.system.flaws) ? [...actorData.system.flaws] : [];
    list.splice(index, 1);
    return this.actor.update({ "system.flaws": list });
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

  async #onAddSpecialty(event) {
    event.preventDefault();

    const skillOptions = SKILL_KEYS
      .filter(key => (foundry.utils.getProperty(this.actor.system, `skills.${key}.value`) || 0) > 0)
      .map(key => ({ key, label: game.i18n.localize(LOCALIZE_SKILL[key]) }));

    const optionsHtml = skillOptions.length
      ? skillOptions.map(o => `<option value="${o.key}">${o.label}</option>`).join("")
      : '<option value="">Nenhuma perícia com pontos</option>';

    return new Dialog({
      title: "Adicionar Especialidade",
      content: `
        <form class="astrael-dialog-form">
          <div class="form-group">
            <label>Perícia Associada</label>
            <select name="skill">${optionsHtml}</select>
          </div>
          <div class="form-group">
            <label>Definição</label>
            <input type="text" name="description" placeholder="Ex: Cenas de crime, Duelos...">
          </div>
        </form>
      `,
      buttons: {
        add: {
          icon: '<i class="fas fa-plus"></i>',
          label: "Confirmar",
          callback: async (html) => {
            const skill = html.find("[name='skill']").val();
            if (!skill) {
              ui.notifications.warn("Selecione uma perícia.");
              return false;
            }
            const description = html.find("[name='description']").val() || "";
            const actorData = this.actor.toObject();
            const specialties = Array.isArray(actorData.system.specialties) ? actorData.system.specialties : [];
            specialties.push({ skill, description });
            return this.actor.update({ "system.specialties": specialties });
          }
        }
      },
      default: "add"
    }, { classes: ["astrael-dialog"] }).render(true);
  }

  async #onEditSpecialty(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const actorData = this.actor.toObject();
    const specialties = Array.isArray(actorData.system.specialties) ? actorData.system.specialties : [];
    const spec = specialties[index];
    if (!spec) return;

    const skillOptions = SKILL_KEYS
      .filter(key => (foundry.utils.getProperty(this.actor.system, `skills.${key}.value`) || 0) > 0 || key === spec.skill)
      .map(key => ({ key, label: game.i18n.localize(LOCALIZE_SKILL[key]) }));

    const optionsHtml = skillOptions.map(o =>
      `<option value="${o.key}" ${o.key === spec.skill ? "selected" : ""}>${o.label}</option>`
    ).join("");

    return new Dialog({
      title: "Registro de Especialidade",
      content: `
        <form class="astrael-dialog-form">
          <div class="form-group">
            <label>Perícia Associada</label>
            <select name="skill">${optionsHtml}</select>
          </div>
          <div class="form-group">
            <label>Definição</label>
            <input type="text" name="description" value="${spec.description || ""}" placeholder="Ex: Cenas de crime, Duelos...">
          </div>
        </form>
      `,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: "Salvar",
          callback: async (html) => {
            const skill = html.find("[name='skill']").val();
            if (!skill) {
              ui.notifications.warn("Selecione uma perícia.");
              return false;
            }
            const description = html.find("[name='description']").val() || "";
            const data = this.actor.toObject();
            const list = Array.isArray(data.system.specialties) ? [...data.system.specialties] : [];
            if (list[index]) list[index] = { skill, description };
            return this.actor.update({ "system.specialties": list });
          }
        },
        delete: {
          icon: '<i class="fas fa-trash"></i>',
          label: "Deletar",
          condition: true,
          callback: async () => {
            const data = this.actor.toObject();
            const list = Array.isArray(data.system.specialties) ? [...data.system.specialties] : [];
            list.splice(index, 1);
            return this.actor.update({ "system.specialties": list });
          }
        }
      },
      default: "save",
      render: (html) => {
        html.closest(".app").find(".dialog-button.delete").addClass("delete");
      }
    }, { classes: ["astrael-dialog"], jQuery: true }).render(true);
  }

  async #onAddCustomRoll(event) {
    event.preventDefault();

    const allAttrOptions = ATTRIBUTE_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
    ).join("");

    const allSkillOptions = SKILL_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`
    ).join("");

    const content = `
      <form class="astrael-dialog-form">
        <div class="form-group">
          <label>Nome da Rolagem</label>
          <input type="text" name="rollName" placeholder="Ex: Ataque com espada">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Atributo</label>
            <select name="attribute">${allAttrOptions}</select>
          </div>
          <div class="form-group mode-group">
            <div class="mode-header">
              <button type="button" class="mode-arrow" data-dir="prev">&#9664;</button>
              <span class="mode-label">Perícia</span>
              <button type="button" class="mode-arrow" data-dir="next">&#9654;</button>
            </div>
            <select name="second">${allSkillOptions}</select>
            <input type="hidden" name="mode" value="skill">
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
            <select name="specialty">
              <option value="">Nenhuma</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const ROLL_MODES = [
      { key: "skill", label: "Perícia" },
      { key: "attribute", label: "Atributo" }
    ];

    return new Dialog({
      title: "Nova Rolagem Personalizada",
      content,
      buttons: {
        save: {
          label: "Salvar",
          callback: async (html) => {
            const name = html.find("[name='rollName']").val()?.trim();
            if (!name) {
              ui.notifications.warn("Defina um nome para a rolagem.");
              return false;
            }
            const modeKey = html.find("[name='mode']").val();
            const data = {
              name,
              attribute: html.find("[name='attribute']").val(),
              secondKey: html.find("[name='second']").val(),
              mode: modeKey,
              modifier: Number(html.find("[name='modifier']").val()) || 0,
              specialty: modeKey === "skill" ? html.find("[name='specialty']").val() : ""
            };
            const actorData = this.actor.toObject();
            const rolls = Array.isArray(actorData.system.customRolls) ? [...actorData.system.customRolls] : [];
            rolls.push(data);
            return this.actor.update({ "system.customRolls": rolls });
          }
        }
      },
      default: "save",
      render: (html) => {
        let modeIndex = 0;

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
          html.find(".specialty-group").toggle(mode.key === "skill");
          if (mode.key === "skill") populateSpecialties(html.find("[name='second']").val());
          updatePreview();
        };

        const populateSpecialties = (skillKey) => {
          const select = html.find("[name='specialty']");
          const actorData = this.actor.toObject();
          const specialties = Array.isArray(actorData.system.specialties) ? actorData.system.specialties : [];
          const filtered = specialties.filter(s => s.skill === skillKey);
          let opts = '<option value="">Nenhuma</option>';
          filtered.forEach(s => {
            opts += `<option value="${s.description}">${s.description}</option>`;
          });
          select.html(opts);
          select.prop("disabled", filtered.length === 0);
        };

        const updatePreview = () => {
          const attrKey = html.find("[name='attribute']").val();
          const secondKey = html.find("[name='second']").val();
          const modeKey = html.find("[name='mode']").val();
          const modifier = Number(html.find("[name='modifier']").val()) || 0;
          const specialtyBonus = modeKey === "skill" && html.find("[name='specialty']").val() ? 1 : 0;
          const system = this.actor.system;

          const attrVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
          let secondVal;
          if (modeKey === "skill") {
            secondVal = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
          } else {
            secondVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
          }

          html.find(".pool-total").text(`${Math.max(1, attrVal + secondVal + modifier + specialtyBonus)} dados`);
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

        html.find("[name='second']").on("change", function() {
          if (html.find("[name='mode']").val() === "skill") {
            populateSpecialties($(this).val());
          }
        });

        html.find("[name='second'], [name='modifier']").on("change input", updatePreview);
        html.find("[name='specialty']").on("change", updatePreview);
        updatePreview();
      }
    }, { classes: ["astrael-dialog"] }).render(true);
  }

  async #onEditCustomRoll(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const actorData = this.actor.toObject();
    const rolls = Array.isArray(actorData.system.customRolls) ? [...actorData.system.customRolls] : [];
    const roll = rolls[index];
    if (!roll) return;

    const allAttrOptions = ATTRIBUTE_KEYS.map((k) =>
      `<option value="${k}" ${k === roll.attribute ? "selected" : ""}>${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
    ).join("");

    let allSecondOptions;
    if (roll.mode === "skill") {
      allSecondOptions = SKILL_KEYS.map((k) =>
        `<option value="${k}" ${k === roll.secondKey ? "selected" : ""}>${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`
      ).join("");
    } else {
      allSecondOptions = ATTRIBUTE_KEYS
        .filter((k) => k !== roll.attribute)
        .map((k) =>
          `<option value="${k}" ${k === roll.secondKey ? "selected" : ""}>${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
        ).join("");
    }

    const content = `
      <form class="astrael-dialog-form">
        <div class="form-group">
          <label>Nome da Rolagem</label>
          <input type="text" name="rollName" value="${roll.name}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Atributo</label>
            <select name="attribute">${allAttrOptions}</select>
          </div>
          <div class="form-group mode-group">
            <div class="mode-header">
              <button type="button" class="mode-arrow" data-dir="prev">&#9664;</button>
              <span class="mode-label">${roll.mode === "skill" ? "Perícia" : "Atributo"}</span>
              <button type="button" class="mode-arrow" data-dir="next">&#9654;</button>
            </div>
            <select name="second">${allSecondOptions}</select>
            <input type="hidden" name="mode" value="${roll.mode}">
          </div>
        </div>
        <div class="pool-preview">
          <span class="pool-total"></span>
        </div>
        <div class="bottom-row">
          <div class="form-group modifier-group">
            <label>Modificador</label>
            <input type="number" name="modifier" value="${roll.modifier || 0}" step="1">
          </div>
          <div class="form-group specialty-group">
            <label>Especialidade</label>
            <select name="specialty">
              <option value="">Nenhuma</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const ROLL_MODES = [
      { key: "skill", label: "Perícia" },
      { key: "attribute", label: "Atributo" }
    ];

    return new Dialog({
      title: "Editar Rolagem Personalizada",
      content,
      buttons: {
        save: {
          label: "Salvar",
          callback: async (html) => {
            const name = html.find("[name='rollName']").val()?.trim();
            if (!name) {
              ui.notifications.warn("Defina um nome para a rolagem.");
              return false;
            }
            const modeKey = html.find("[name='mode']").val();
            const data = {
              name,
              attribute: html.find("[name='attribute']").val(),
              secondKey: html.find("[name='second']").val(),
              mode: modeKey,
              modifier: Number(html.find("[name='modifier']").val()) || 0,
              specialty: modeKey === "skill" ? html.find("[name='specialty']").val() : ""
            };
            const actorData = this.actor.toObject();
            const rolls = Array.isArray(actorData.system.customRolls) ? [...actorData.system.customRolls] : [];
            rolls[index] = data;
            return this.actor.update({ "system.customRolls": rolls });
          }
        },
        delete: {
          icon: '<i class="fas fa-trash"></i>',
          label: "Deletar",
          condition: true,
          callback: async () => {
            const data = this.actor.toObject();
            const list = Array.isArray(data.system.customRolls) ? [...data.system.customRolls] : [];
            list.splice(index, 1);
            return this.actor.update({ "system.customRolls": list });
          }
        }
      },
      default: "save",
      render: (html) => {
        let modeIndex = roll.mode === "attribute" ? 1 : 0;

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
          html.find(".specialty-group").toggle(mode.key === "skill");
          if (mode.key === "skill") populateSpecialties(html.find("[name='second']").val());
          updatePreview();
        };

        const populateSpecialties = (skillKey) => {
          const select = html.find("[name='specialty']");
          const actorData = this.actor.toObject();
          const specialties = Array.isArray(actorData.system.specialties) ? actorData.system.specialties : [];
          const filtered = specialties.filter(s => s.skill === skillKey);
          let opts = '<option value="">Nenhuma</option>';
          filtered.forEach(s => {
            opts += `<option value="${s.description}" ${s.description === roll.specialty ? "selected" : ""}>${s.description}</option>`;
          });
          select.html(opts);
          select.prop("disabled", filtered.length === 0);
        };

        const updatePreview = () => {
          const attrKey = html.find("[name='attribute']").val();
          const secondKey = html.find("[name='second']").val();
          const modeKey = html.find("[name='mode']").val();
          const modifier = Number(html.find("[name='modifier']").val()) || 0;
          const specialtyBonus = modeKey === "skill" && html.find("[name='specialty']").val() ? 1 : 0;
          const system = this.actor.system;

          const attrVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${attrKey}.value`)) || 1);
          let secondVal;
          if (modeKey === "skill") {
            secondVal = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${secondKey}.value`)) || 0);
          } else {
            secondVal = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${secondKey}.value`)) || 1);
          }

          html.find(".pool-total").text(`${Math.max(1, attrVal + secondVal + modifier + specialtyBonus)} dados`);
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

        html.find("[name='second']").on("change", function() {
          if (html.find("[name='mode']").val() === "skill") {
            populateSpecialties($(this).val());
          }
        });

        html.find("[name='second'], [name='modifier']").on("change input", updatePreview);
        html.find("[name='specialty']").on("change", updatePreview);

        if (roll.mode === "attribute") {
          html.find(".specialty-group").hide();
        } else {
          populateSpecialties(roll.secondKey);
        }
        updatePreview();
        html.closest(".app").find(".dialog-button.delete").addClass("delete");
      }
    }, { classes: ["astrael-dialog"], jQuery: true }).render(true);
  }

  async #onCustomRollClick(event) {
    if (event.target.closest("[data-action='edit-custom-roll']")) return;
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const system = this.actor.system;
    const rolls = Array.isArray(system.customRolls) ? system.customRolls : [];
    const roll = rolls[index];
    if (!roll) return;

    const attrValue = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${roll.attribute}.value`)) || 1);
    let secondValue;
    if (roll.mode === "skill") {
      secondValue = Math.max(0, Number(foundry.utils.getProperty(system, `skills.${roll.secondKey}.value`)) || 0);
    } else {
      secondValue = Math.max(1, Number(foundry.utils.getProperty(system, `attributes.${roll.secondKey}.value`)) || 1);
    }
    const specialtyBonus = roll.specialty ? 1 : 0;
    const diceCount = Math.max(1, attrValue + secondValue + (roll.modifier || 0) + specialtyBonus);

    const titleLeft = roll.mode === "skill"
      ? game.i18n.localize(LOCALIZE_SKILL[roll.secondKey]) || roll.secondKey
      : game.i18n.localize(LOCALIZE_ATTR[roll.secondKey]) || roll.secondKey;
    const titleRight = game.i18n.localize(LOCALIZE_ATTR[roll.attribute]) || roll.attribute;
    const titleSuffix = roll.specialty ? ` (${roll.specialty})` : "";

    return createDicePoolMessage({
      actor: this.actor,
      title: `${roll.name}${titleSuffix}`,
      kicker: "Rolagem Personalizada",
      diceCount
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

  (async () => {
    const pack = game.packs.get("astrael-rpg.gm-macros");
    if (!pack) return;
    const XP_ICON = "systems/astrael-rpg/assets/icons/xp-up.svg";
    try {
      const existing = pack.index.find(e => e.name === "Distribuir XP");
      await pack.configure({ locked: false });
      if (existing) {
        if (existing.img !== XP_ICON) {
          const macro = await pack.getDocument(existing._id);
          await macro.update({ img: XP_ICON });
          console.log("Astrael RPG | Ícone da macro 'Distribuir XP' atualizado");
        }
      } else {
        await Macro.create({
          name: "Distribuir XP",
          type: "script",
          command: "game.astrael?.distributeXP?.()",
          scope: "global",
          img: XP_ICON
        }, { pack: "astrael-rpg.gm-macros" });
        console.log("Astrael RPG | Macro 'Distribuir XP' criada no compendium");
      }
      await pack.configure({ locked: true });
    } catch(err) {
      console.warn("Astrael RPG | Erro ao gerenciar macro 'Distribuir XP':", err);
    }
  })();

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

export { SYSTEM_ID };
