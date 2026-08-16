import {
  ATTRIBUTE_KEYS,
  DEFAULT_RESOURCES,
  LOCALIZE_ATTR,
  LOCALIZE_SKILL,
  SKILL_KEYS,
  STRANGER_MARK_OPTIONS,
  SYSTEM_ID
} from "../core/constants.js";
import {
  calculateResourceActive,
  clampNumber,
  escapeHtml,
  getCharacterPortraitFraming,
  normalizeAdvantageLevel,
  normalizeHemomancyPower,
  normalizeStrangerMark,
  normalizeStrangerMarkAbility,
  normalizeVirtue,
  normalizeVisibleTabs,
  prepareAdvantageEntry,
  prepareCharacterPortraitPresentation,
  toRoman,
  toRomanLevel
} from "../core/utilities.js";
import { normalizeResource } from "../rules/resources.js";
import { getRollValues } from "../rules/dice.js";
import { createDicePoolMessage } from "../chat/dice-pool.js";
import { updateActorSheet } from "../data/models.js";
import { AstraelSpecialtiesPanel } from "../applications/specialties-panel.js";
import { AstraelStrangerMarksPanel } from "../applications/stranger-marks-panel.js";
import { CharacteristicsController } from "./controllers/characteristics-controller.js";
import { ConvictionsController } from "./controllers/convictions-controller.js";
import { CharacterSheetFeatureCoordinator } from "./controllers/feature-coordinator.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

class AstraelBaseActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static LAYOUT_OPTIONS = {
    width: 900,
    minWidth: 900,
    minHeight: 450,
    heightSetting: "sheetHeight"
  };

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

  get title() {
    return `${game.i18n.localize("ASTRAEL.Sheet.Character")}: ${this.actor.name}`;
  }

  get featureCoordinator() {
    if (!this._featureCoordinator) {
      this._characteristicsController = new CharacteristicsController(this);
      this._convictionsController = new ConvictionsController(this);
      this._featureCoordinator = new CharacterSheetFeatureCoordinator([
        this._characteristicsController,
        this._convictionsController
      ]);
    }
    return this._featureCoordinator;
  }

  get convictionsController() {
    this.featureCoordinator;
    return this._convictionsController;
  }

  get characteristicsController() {
    this.featureCoordinator;
    return this._characteristicsController;
  }

  _getHeaderControls() {
    return super._getHeaderControls().filter((control) => control.action !== "configurePrototypeToken");
  }

  _getFrameButtons(options) {
    const buttons = super._getFrameButtons(options);
    const prototypeToken = super._getHeaderControls().find((control) => control.action === "configurePrototypeToken");
    return prototypeToken ? [prototypeToken, ...buttons] : buttons;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const systemData = this.actor.system?.toObject?.() ?? this.actor.system;

    context.actor = this.actor;
    context.system = foundry.utils.mergeObject(
      { resources: DEFAULT_RESOURCES },
      systemData,
      { inplace: false }
    );
    context.system.attributes ??= {};
    for (const key of ATTRIBUTE_KEYS) {
      const attr = context.system.attributes[key];
      if (!attr || !Number.isFinite(Number(attr.value)) || Number(attr.value) < 1) {
        context.system.attributes[key] = { value: 1 };
      }
    }
    const resourceUpdate = {};
    for (const resourceId of ["health", "willpower"]) {
      const raw = context.system.resources[resourceId] ?? {};
      const normalized = normalizeResource(resourceId, {
        ...raw,
        active: calculateResourceActive(resourceId, context.system)
      });
      context.system.resources[resourceId] = normalized;
      for (const key of ["max", "active", "superficial", "aggravated"]) {
        if (raw[key] !== normalized[key]) {
          resourceUpdate[`system.resources.${resourceId}.${key}`] = normalized[key];
        }
      }
    }
    if (Object.keys(resourceUpdate).length) await this.actor.update(resourceUpdate);
    context.system.sheetSettings ??= {};
    context.system.sheetSettings.visibleTabs = normalizeVisibleTabs(context.system.sheetSettings.visibleTabs);
    if (this.actor.type === "character" && this.#isCharacterTabHidden(this._activeTab, context.system.sheetSettings.visibleTabs)) {
      this._activeTab = "attributes";
    }
    context.system.resources.health.activeRoman = toRoman(context.system.resources.health.active);
    context.system.resources.willpower.activeRoman = toRoman(context.system.resources.willpower.active);
    context.system.sangria ??= { value: 5 };
    if (!Number.isFinite(Number(context.system.sangria.value))) context.system.sangria.value = 5;
    context.system.vazio ??= { value: 0 };
    if (!Number.isFinite(Number(context.system.vazio.value))) context.system.vazio.value = 0;
    context.system.skills ??= {};
    for (const key of SKILL_KEYS) {
      const skill = context.system.skills[key];
      if (!skill || !Number.isFinite(Number(skill.value))) {
        context.system.skills[key] = { value: 0 };
      }
    }
    context.system.specialties = Array.isArray(context.system.specialties) ? context.system.specialties : [];
    context.system.customRolls = Array.isArray(context.system.customRolls) ? context.system.customRolls : [];
    context.system.advantages = Array.isArray(context.system.advantages) ? context.system.advantages : [];
    context.system.flaws = Array.isArray(context.system.flaws) ? context.system.flaws : [];
    this.featureCoordinator.prepareContext(context);
    context.system.hemomancy ??= { level: 0, alchemyLevel: 0, powers: [], formulas: [] };
    context.system.hemomancy.level = clampNumber(context.system.hemomancy.level, 0, 5);
    context.system.hemomancy.alchemyLevel = clampNumber(context.system.hemomancy.alchemyLevel, 0, 5);
    context.system.hemomancy.powers = Array.isArray(context.system.hemomancy.powers) ? context.system.hemomancy.powers.map(normalizeHemomancyPower) : [];
    context.system.hemomancy.formulas = Array.isArray(context.system.hemomancy.formulas) ? context.system.hemomancy.formulas.map(normalizeHemomancyPower) : [];
    context.system.advantages = context.system.advantages.map(prepareAdvantageEntry);
    context.system.flaws = context.system.flaws.map(prepareAdvantageEntry);
    this.#prepareAdvantageSelection(context.system);
    this.#prepareHemomancySelection(context.system);
    context.system.virtues = Array.isArray(context.system.virtues) ? context.system.virtues.map(normalizeVirtue) : [];
    this.#prepareVirtueSelection(context.system);
    context.system.strangerMark ??= { selectedMarkId: "", selectedAbilityLevel: 1, marks: [] };
    {
      const sm = context.system.strangerMark;
      sm.selectedAbilityLevel = clampNumber(sm.selectedAbilityLevel ?? 1, 1, 5);
      sm.selectedAbilityLevelRoman = toRomanLevel(sm.selectedAbilityLevel);
      sm.marks = Array.isArray(sm.marks) ? sm.marks.map(normalizeStrangerMark) : [];

      const existingIds = new Set(sm.marks.map((m) => m.option));
      for (const opt of STRANGER_MARK_OPTIONS) {
        if (!existingIds.has(opt.id)) {
          sm.marks.push(normalizeStrangerMark({ option: opt.id, level: 0, abilities: [] }));
        }
      }

      const hasSelectedMark = sm.marks.some((m) => m.option === sm.selectedMarkId);
      if (!hasSelectedMark) {
        const sortedMarks = [...sm.marks].sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          return a.label.localeCompare(b.label);
        });
        const defaultId = sortedMarks[0]?.option || "";
        sm.selectedMarkId = defaultId;
        if (defaultId && this.isEditable) {
          void this.actor.update({ "system.strangerMark.selectedMarkId": defaultId });
        }
      }
      sm.marks = sm.marks.map((mark) => ({
        ...mark,
        selected: mark.option === sm.selectedMarkId
      }));

      const selectedMark = sm.marks.find((m) => m.option === sm.selectedMarkId) ?? null;
      sm.selectedMark = selectedMark ? { ...selectedMark } : null;

      const ownedOptionIds = sm.marks.map((m) => m.option);
      sm.availableOptions = STRANGER_MARK_OPTIONS.reduce((acc, opt) => {
        acc[opt.id] = { ...opt, owned: ownedOptionIds.includes(opt.id) };
        return acc;
      }, {});

      if (selectedMark) {
        const visibleAbilities = selectedMark.abilities
          .map((a, i) => ({ ...a, index: i }))
          .filter((a) => a.level === sm.selectedAbilityLevel && a.level <= selectedMark.level);
        sm.abilityLevelTabs = [1, 2, 3, 4, 5].map((level) => ({
          level,
          roman: toRomanLevel(level),
          active: level === sm.selectedAbilityLevel
        }));

        const selectedAbilityIndex = Number.isInteger(this._selectedStrangerMarkAbilityIndex) ? this._selectedStrangerMarkAbilityIndex : -1;
        const selectedAbility = selectedMark.abilities[selectedAbilityIndex];
        const idx = selectedAbility && selectedAbility.level <= selectedMark.level
          ? selectedAbilityIndex
          : (visibleAbilities[0]?.index ?? -1);
        this._selectedStrangerMarkAbilityIndex = idx;
        sm.visibleAbilities = visibleAbilities.map((ability) => ({
          ...ability,
          selected: ability.index === idx
        }));
        sm.selectedAbility = idx >= 0
          ? { ...selectedMark.abilities[idx], index: idx, rollFormula: `${selectedMark.label} (Nível ${selectedMark.levelRoman})` }
          : null;
        sm.abilityRows = [1, 2, 3, 4, 5].map((level) => ({
          level,
          roman: toRomanLevel(level),
          active: level === sm.selectedAbilityLevel,
          abilities: selectedMark.abilities
            .map((ability, index) => ({ ...ability, index, selected: index === idx }))
            .filter((ability) => ability.level === level)
        }));
      } else {
        sm.visibleAbilities = [];
        sm.abilityLevelTabs = [1, 2, 3, 4, 5].map((level) => ({
          level,
          roman: toRomanLevel(level),
          active: level === sm.selectedAbilityLevel
        }));
        sm.abilityRows = [1, 2, 3, 4, 5].map((level) => ({
          level,
          roman: toRomanLevel(level),
          active: false,
          abilities: []
        }));
        sm.selectedAbility = null;
        this._selectedStrangerMarkAbilityIndex = -1;
      }
    }
    {
      const hasMarkLevel = (context.system.strangerMark?.marks || []).some(m => Number(m.level) >= 1);
      const minVazio = hasMarkLevel ? 1 : 0;
      const currentVazio = Number(context.system.vazio?.value) ?? 0;
      if (currentVazio < minVazio) {
        context.system.vazio.value = minVazio;
        await this.actor.update({ "system.vazio.value": minVazio });
      }
    }
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

  _preRender(options) {
    this.#saveSheetScroll();
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.#restoreSheetScroll();

    this.element.querySelectorAll(".resource-box").forEach((box) => {
      box.addEventListener("click", this.#onResourceBoxClick.bind(this));
      box.addEventListener("contextmenu", this.#onResourceBoxContext.bind(this));
    });

    this.element.querySelectorAll(".astrael-character-resource").forEach((resource) => {
      resource.addEventListener("click", this.#onCharacterResourceClick.bind(this));
      resource.addEventListener("contextmenu", this.#onCharacterResourceContext.bind(this));
    });

    this.element.querySelectorAll("[data-damage]").forEach((button) => {
      button.addEventListener("click", this.#onDamageButtonClick.bind(this));
      button.addEventListener("contextmenu", this.#onDamageButtonContext.bind(this));
    });

    this.element.querySelectorAll("input[name]").forEach((input) => {
      input.addEventListener("change", this.#onInputChange.bind(this));
    });

    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach((btn) => {
      btn.addEventListener("click", this.#onTabClick.bind(this));
    });

    this.element.querySelectorAll(".dot-track").forEach((track) => {
      track.addEventListener("click", this.#onDotClick.bind(this));
      track.addEventListener("contextmenu", this.#onDotContext.bind(this));
    });

    this.element.querySelectorAll("[data-action='adjust-resource']").forEach((btn) => {
      btn.addEventListener("click", this.#onAdjustResource.bind(this));
    });

    this.element.querySelectorAll(".rollable").forEach((el) => {
      el.addEventListener("click", this.#onRollClick.bind(this));
    });

    this.element.querySelector("[data-action='open-specialties']")?.addEventListener("click", this.#onOpenSpecialties.bind(this));

    this.element.querySelector("[data-action='add-custom-roll']")?.addEventListener("click", this.#onAddCustomRoll.bind(this));

    this.#restoreAdvantageScrolls();
    this.element.querySelectorAll("[data-action='edit-custom-roll']").forEach((el) => {
      el.addEventListener("click", this.#onEditCustomRoll.bind(this));
    });
    this.element.querySelectorAll(".custom-roll-entry").forEach((el) => {
      el.addEventListener("click", this.#onCustomRollClick.bind(this));
    });
    this.element.querySelector("[data-action='add-advantage-entry']")?.addEventListener("click", this.#onAddAdvantageEntry.bind(this));
    this.element.querySelectorAll("[data-action='set-advantage-mode']").forEach((button) => {
      button.addEventListener("click", this.#onSetAdvantageMode.bind(this));
    });
    this.element.querySelectorAll("[data-action='select-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onSelectAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll("[data-action='edit-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onEditAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onSaveAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll("[data-action='roll-advantage-entry']").forEach((button) => {
      button.addEventListener("click", this.#onRollAdvantageEntry.bind(this));
    });
    this.element.querySelectorAll(".advantage-rank").forEach((rank) => {
      rank.addEventListener("click", this.#onAdvantageRankClick.bind(this));
      rank.addEventListener("contextmenu", this.#onAdvantageRankContext.bind(this));
    });
    this.featureCoordinator.activateListeners(this.element);
    this.element.querySelectorAll("[data-action='set-hemomancy-mode']").forEach((button) => {
      button.addEventListener("click", this.#onSetHemomancyMode.bind(this));
    });
    this.element.querySelectorAll("[data-action='set-hemomancy-list-mode']").forEach((button) => {
      button.addEventListener("click", this.#onSetHemomancyListMode.bind(this));
    });
    this.element.querySelector("[data-action='add-hemomancy-power']")?.addEventListener("click", this.#onAddHemomancyPower.bind(this));
    this.element.querySelectorAll("[data-action='select-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onSelectHemomancyPower.bind(this));
    });
    this.element.querySelectorAll("[data-action='edit-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onEditHemomancyPower.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onSaveHemomancyPower.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteHemomancyPower.bind(this));
    });
    this.element.querySelectorAll("[data-action='roll-hemomancy-power']").forEach((button) => {
      button.addEventListener("click", this.#onRollHemomancyPower.bind(this));
    });
    this.element.querySelector(".hemomancy-level-control")?.addEventListener("click", this.#onHemomancyLevelClick.bind(this));
    this.element.querySelector(".hemomancy-level-control")?.addEventListener("contextmenu", this.#onHemomancyLevelContext.bind(this));

    this.element.querySelectorAll("[data-action='select-virtue']").forEach((button) => {
      button.addEventListener("click", this.#onSelectVirtue.bind(this));
    });
    this.element.querySelector("[data-action='add-virtue']")?.addEventListener("click", this.#onAddVirtue.bind(this));
    this.element.querySelectorAll("[data-action='edit-virtue']").forEach((button) => {
      button.addEventListener("click", this.#onEditVirtue.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-virtue']").forEach((button) => {
      button.addEventListener("click", this.#onSaveVirtue.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-virtue']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteVirtue.bind(this));
    });
    this.element.querySelectorAll("[data-action='add-virtue-perk']").forEach((button) => {
      button.addEventListener("click", this.#onAddVirtuePerk.bind(this));
    });
    this.element.querySelectorAll("[data-action='toggle-virtue-perk']").forEach((button) => {
      button.addEventListener("click", this.#onToggleVirtuePerk.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-virtue-perk']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteVirtuePerk.bind(this));
    });
    this.element.querySelectorAll("[data-action='toggle-character-tab']").forEach((button) => {
      button.addEventListener("click", this.#onToggleCharacterTab.bind(this));
    });

    this.element.querySelectorAll("[data-action='open-stranger-mark-picker']").forEach((btn) => {
      btn.addEventListener("click", this.#onOpenStrangerMarkPicker.bind(this));
    });
    this.element.querySelectorAll("[data-action='add-stranger-mark']").forEach((btn) => {
      btn.addEventListener("click", this.#onAddStrangerMark.bind(this));
    });
    this.element.querySelectorAll("[data-action='select-stranger-mark']").forEach((btn) => {
      btn.addEventListener("click", this.#onSelectStrangerMark.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-stranger-mark']").forEach((btn) => {
      btn.addEventListener("click", this.#onDeleteStrangerMark.bind(this));
    });
    this.element.querySelector(".stranger-mark-level-control")?.addEventListener("click", this.#onStrangerMarkLevelClick.bind(this));
    this.element.querySelector(".stranger-mark-level-control")?.addEventListener("contextmenu", this.#onStrangerMarkLevelContext.bind(this));
    this.element.querySelectorAll("[data-action='set-stranger-mark-ability-level']").forEach((btn) => {
      btn.addEventListener("click", this.#onSetStrangerMarkAbilityLevel.bind(this));
    });
    this.element.querySelectorAll("[data-action='add-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onAddStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='select-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onSelectStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='edit-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onEditStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onSaveStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onDeleteStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='roll-stranger-mark-ability']").forEach((btn) => {
      btn.addEventListener("click", this.#onRollStrangerMarkAbility.bind(this));
    });
    this.element.querySelectorAll("[data-action='toggle-stranger-marks-panel']").forEach((btn) => {
      btn.addEventListener("click", this.#onToggleStrangerMarksPanel.bind(this));
    });
    this.element.querySelector("[data-action='editImage']")?.addEventListener("click", this.#onEditImage.bind(this));
    this.element.querySelector("[data-action='rouseCheck']")?.addEventListener("click", this.#onRouseCheck.bind(this));

    {
      const card = this.element.querySelector(".custom-roll-card");
      if (card) {
        if (this._customRollsOpen) card.setAttribute("open", "");
        card.addEventListener("toggle", () => { this._customRollsOpen = card.open; });
      }
    }

    if (this._activeTab) this.#activateTab(this._activeTab);
    else this.element.dataset.activeTab = "attributes";
  }

  async #onRollClick(event) {
    event.preventDefault();
    if (event.target.closest("button, input, textarea, select")) return;
    const element = event.currentTarget;
    if (element.classList.contains("is-editing")) return;
    const type = element.dataset.type;
    const key = element.dataset.key;

    const ROLL_MODES = [
      { key: "skill", label: "Perícia" },
      { key: "attribute", label: "Atributo" },
      { key: "advantage", label: "Vantagem" }
    ];

    const allAttrOptions = ATTRIBUTE_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_ATTR[k])}</option>`
    ).join("");

    const allSkillOptions = SKILL_KEYS.map((k) =>
      `<option value="${k}">${game.i18n.localize(LOCALIZE_SKILL[k])}</option>`
    ).join("");

    const allAdvantageOptions = (() => {
      const advs = Array.isArray(this.actor.system.advantages) ? this.actor.system.advantages : [];
      if (!advs.length) return '<option value="">Nenhuma vantagem</option>';
      return advs.map((a, i) => `<option value="${i}">${a.name}</option>`).join("");
    })();

    const initialModeIndex = type === "attribute" ? 1 : type === "advantage" ? 2 : 0;
    const initialMode = ROLL_MODES[initialModeIndex];
    const initialSecondOptions =
      initialMode.key === "attribute" ? allAttrOptions :
      initialMode.key === "advantage" ? allAdvantageOptions :
      allSkillOptions;

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
            } else if (modeKey === "advantage") {
              const advs = Array.isArray(system.advantages) ? system.advantages : [];
              const adv = advs[Number(secondKey)];
              secondValue = adv ? (adv.level || 1) : 0;
              titleLeft = adv ? adv.name : "Vantagem";
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

            const rawBlood = Math.max(0, 5 - (Number(this.actor.system.sangria?.value) || 5));
            const rawVoid = Math.max(0, Number(this.actor.system.vazio?.value) || 0);
            const actualBlood = Math.min(rawBlood, diceCount);
            const actualVoid = Math.min(rawVoid, diceCount - actualBlood);
            return createDicePoolMessage({
              actor: this.actor,
              title: `${titleLeft} + ${titleRight}${titleSuffix}`,
              kicker: "Teste de Perícia",
              diceCount: diceCount,
              bloodCount: actualBlood,
              voidCount: actualVoid
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
          if (modeKey === "advantage") {
            const advs = Array.isArray(this.actor.system.advantages) ? this.actor.system.advantages : [];
            if (!advs.length) return '<option value="">Nenhuma vantagem</option>';
            return advs.map((a, i) => `<option value="${i}">${a.name}</option>`).join("");
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
          html.find(".modifier-group").toggleClass("span-full", mode.key !== "skill");
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
          } else if (modeKey === "advantage") {
            const advs = Array.isArray(system.advantages) ? system.advantages : [];
            const adv = advs[Number(secondKey)];
            secondVal = adv ? (adv.level || 1) : 0;
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
        } else if (type === "advantage") {
          html.find("[name='attribute']").val(ATTRIBUTE_KEYS[0]);
          html.find("[name='second']").val(key);
        } else {
          html.find("[name='second']").val(key);
        }

        updatePreview();
        html.find(".specialty-group").toggle(initialMode.key === "skill");
        html.find(".modifier-group").toggleClass("span-full", initialMode.key !== "skill");
        if (initialMode.key === "skill") populateSpecialties(html.find("[name='second']").val());
      }
    }, { classes: ["astrael-dialog"] });

    return dialog.render(true);
  }

  async #onInputChange(event) {
    const input = event.currentTarget;
    let value = input.value;
    if (input.type === "number" && input.name?.startsWith("system.skills.")) {
      value = Math.max(0, Number(input.value) || 0);
      input.value = value;
    }

    return this.actor.update({ [input.name]: value });
  }

  #getSpecialDiceCounts(diceCount) {
    const rawBlood = Math.max(0, 5 - (Number(this.actor.system.sangria?.value) || 5));
    const rawVoid = Math.max(0, Number(this.actor.system.vazio?.value) || 0);

    return {
      bloodCount: Math.min(rawBlood, diceCount),
      voidCount: Math.min(rawVoid, diceCount - Math.min(rawBlood, diceCount))
    };
  }

  #dotMin(name) {
    if (name?.startsWith("system.skills") || name?.startsWith("system.sangria") || name?.startsWith("system.vazio")) return 0;
    return 1;
  }

  async #onDotClick(event) {
    event.preventDefault();
    const track = event.currentTarget;
    if (track.classList.contains("dot-track--sangria") || track.classList.contains("dot-track--vazio")) return;
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
    if (track.classList.contains("dot-track--sangria") || track.classList.contains("dot-track--vazio")) return;
    const name = track.dataset.name;

    return this.actor.update({ [name]: this.#dotMin(name) });
  }

  async #onResourceBoxClick(event) {
    event.preventDefault();

    const box = event.currentTarget;
    if (box.classList.contains("astrael-character-resource-box")) event.stopPropagation();
    const resourceId = box.dataset.resource;
    const state = box.dataset.state ?? "empty";
    const index = Number(box.dataset.index);
    const resource = this.#getResource(resourceId);

    if (!resource || !Number.isInteger(index)) return;

    if (state === "empty" || state === "filled") return;
    if (state === "superficial") resource.superficial = Math.max(0, resource.superficial - 1);
    else if (state === "aggravated") {
      resource.aggravated = Math.max(0, resource.aggravated - 1);
      resource.superficial += 1;
    }

    return this.#updateResource(resourceId, resource);
  }

  async #onResourceBoxContext(event) {
    event.preventDefault();

    const box = event.currentTarget;
    if (box.classList.contains("astrael-character-resource-box")) return;
    const resourceId = box.dataset.resource;
    const resource = this.#getResource(resourceId);

    if (!resource || resource.active <= 0 || resource.aggravated >= resource.active) return;

    this.#applySuperficialDamage(resource);
    return this.#updateResource(resourceId, resource);
  }

  async #onCharacterResourceContext(event) {
    event.preventDefault();
    if (event.target.closest("[data-action]")) return;

    const resourceId = event.currentTarget.dataset.resource;
    const resource = this.#getResource(resourceId);
    if (!resource || resource.active <= 0 || resource.aggravated >= resource.active) return;

    if (event.shiftKey) this.#applyAggravatedDamage(resource);
    else this.#applySuperficialDamage(resource);
    return this.#updateResource(resourceId, resource);
  }

  async #onCharacterResourceClick(event) {
    event.preventDefault();
    if (event.target.closest("[data-action]")) return;

    const resourceId = event.currentTarget.dataset.resource;
    const resource = this.#getResource(resourceId);
    if (!resource) return;

    if (resource.superficial > 0) {
      resource.superficial -= 1;
    } else if (resource.aggravated > 0) {
      resource.aggravated -= 1;
      resource.superficial += 1;
    } else {
      return;
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

    return normalizeResource(resourceId, {
      ...this.actor.system.resources?.[resourceId],
      active: calculateResourceActive(resourceId, this.actor.system)
    });
  }

  async #updateResource(resourceId, resource) {
    const normalized = normalizeResource(resourceId, {
      ...resource,
      active: calculateResourceActive(resourceId, this.actor.system)
    });

    return this.actor.update({
      [`system.resources.${resourceId}.max`]: normalized.max,
      [`system.resources.${resourceId}.active`]: normalized.active,
      [`system.resources.${resourceId}.superficial`]: normalized.superficial,
      [`system.resources.${resourceId}.aggravated`]: normalized.aggravated
    });
  }

  async #onTabClick(event) {
    event.preventDefault();
    this.#activateTab(event.currentTarget.dataset.tab);
  }

  #isCharacterTabHidden(tabId, visibleTabs = this.#getCharacterVisibleTabs()) {
    if (this.actor.type !== "character") return false;
    if (tabId === "virtues") return !visibleTabs.virtues;
    if (tabId === "hemomancy") return !visibleTabs.hemomancy;
    if (tabId === "stranger-mark") return !visibleTabs.strangerMark;
    return false;
  }

  #getCharacterVisibleTabs() {
    const actorData = this.actor.toObject();
    return normalizeVisibleTabs(actorData.system?.sheetSettings?.visibleTabs);
  }

  async #onToggleCharacterTab(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (!['virtues', 'hemomancy', 'strangerMark'].includes(key)) return;

    const checked = event.currentTarget.dataset.visible !== "true";
    const tabId = key === "strangerMark" ? "stranger-mark" : key;
    if (!checked && this._activeTab === tabId) this._activeTab = "attributes";

    return this.actor.update({ [`system.sheetSettings.visibleTabs.${key}`]: checked });
  }

  #activateTab(tabId) {
    if (!tabId) return;
    if (this.#isCharacterTabHidden(tabId)) tabId = "attributes";
    this._activeTab = tabId;
    this.element.dataset.activeTab = tabId;

    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach((b) => b.classList.remove("active"));
    this.element.querySelector(`.sheet-tabs [data-tab="${tabId}"]`)?.classList.add("active");

    this.element.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    const panel = this.element.querySelector(`.tab-panel[data-tab="${tabId}"]`);
    if (panel) panel.classList.add("active");

    if (tabId !== "stranger-mark") {
      this._strangerMarksPanel?.close();
      this._strangerMarksPanel = null;
    }

    if (tabId !== "attributes") {
      this._specialtiesPanel?.close();
      this._specialtiesPanel = null;
    }
  }

  setPosition(position) {
    const layout = this.constructor.LAYOUT_OPTIONS;
    if (position) {
      position.width = layout.width;
      const savedHeight = layout.heightSetting
        ? game.settings?.get(SYSTEM_ID, layout.heightSetting) ?? this.constructor.DEFAULT_OPTIONS.position.height
        : this.constructor.DEFAULT_OPTIONS.position.height;
      if (position.height === this.constructor.DEFAULT_OPTIONS.position.height) {
        position.height = Math.max(savedHeight, layout.minHeight);
      }
      if (position.height < layout.minHeight) position.height = layout.minHeight;
    }
    const result = super.setPosition(position);
    if (layout.heightSetting && position?.height !== undefined) {
      const saved = game.settings?.get(SYSTEM_ID, layout.heightSetting) ?? this.constructor.DEFAULT_OPTIONS.position.height;
      if (position.height !== saved) {
        game.settings?.set(SYSTEM_ID, layout.heightSetting, position.height);
      }
    }
    this._specialtiesPanel?.anchorToSheet();
    this._strangerMarksPanel?.anchorToSheet();
    return result;
  }

  async close(options) {
    await this._specialtiesPanel?.close();
    await this._strangerMarksPanel?.close();
    this._specialtiesPanel = null;
    this._strangerMarksPanel = null;
    return super.close(options);
  }

  #prepareAdvantageSelection(system) {
    this._advantageMode ??= "advantages";
    const selectedList = this._selectedAdvantageList === "flaws" ? "flaws" : "advantages";
    const selectedIndex = Number.isInteger(this._selectedAdvantageIndex) ? this._selectedAdvantageIndex : 0;
    const currentList = Array.isArray(system[selectedList]) ? system[selectedList] : [];
    const hasCurrentSelection = selectedIndex >= 0 && selectedIndex < currentList.length;
    const listId = selectedList;
    const list = Array.isArray(system[listId]) ? system[listId] : [];
    const index = hasCurrentSelection ? selectedIndex : list.length ? 0 : -1;

    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = index;

    system.advantages = system.advantages.map((entry, entryIndex) => ({
      ...entry,
      selected: listId === "advantages" && entryIndex === index
    }));
    system.flaws = system.flaws.map((entry, entryIndex) => ({
      ...entry,
      selected: listId === "flaws" && entryIndex === index
    }));

    const selected = index >= 0 ? system[listId]?.[index] : null;
    system.selectedAdvantage = selected ? {
      ...selected,
      index,
      listId,
      isFlaw: listId === "flaws",
      typeLabel: listId === "flaws" ? "ARQUIVO COMPROMETEDOR" : "DOSSIE FAVORAVEL",
      actionLabel: listId === "flaws" ? "Desvantagem" : "Vantagem"
    } : null;
    system.advantageModeFlaws = this._advantageMode === "flaws";
  }

  #saveSheetScroll() {
    const body = this.element?.querySelector('.sheet-body');
    if (body) this._savedSheetScroll = body.scrollTop;
  }

  #restoreSheetScroll() {
    if (this._savedSheetScroll === undefined) return;
    requestAnimationFrame(() => {
      const body = this.element?.querySelector('.sheet-body');
      if (body) body.scrollTop = this._savedSheetScroll;
    });
  }

  #saveAdvantageScrolls() {
    const adv = this.element?.querySelector('.advantage-list[data-list="advantages"]');
    const flw = this.element?.querySelector('.advantage-list[data-list="flaws"]');
    const prev = this._savedAdvantageScrolls || {};
    this._savedAdvantageScrolls = {
      advantages: adv && adv.offsetParent !== null ? adv.scrollTop : (prev.advantages || 0),
      flaws: flw && flw.offsetParent !== null ? flw.scrollTop : (prev.flaws || 0)
    };
  }

  #restoreAdvantageScrolls() {
    if (!this._savedAdvantageScrolls) return;
    requestAnimationFrame(() => {
      const adv = this.element?.querySelector('.advantage-list[data-list="advantages"]');
      const flw = this.element?.querySelector('.advantage-list[data-list="flaws"]');
      if (adv) adv.scrollTop = this._savedAdvantageScrolls.advantages;
      if (flw) flw.scrollTop = this._savedAdvantageScrolls.flaws;
    });
  }

  #getAdvantagePath(listId) {
    return listId === "flaws" ? "flaws" : "advantages";
  }

  #getAdvantageList(listId) {
    const path = this.#getAdvantagePath(listId);
    const actorData = this.actor.toObject();
    const list = Array.isArray(actorData.system?.[path]) ? actorData.system[path] : [];

    return list.map((entry) => ({
      name: entry.name || "",
      description: entry.description || entry.details || "",
      level: normalizeAdvantageLevel(entry),
      editing: Boolean(entry.editing)
    }));
  }

  #updateAdvantageList(listId, list) {
    const path = this.#getAdvantagePath(listId);
    return this.actor.update({ [`system.${path}`]: list });
  }

  #getAdvantageListFromSheet(listId, { closeEditing = false } = {}) {
    return this.#getAdvantageList(listId).map((entry, index) => {
      if (!entry.editing) return entry;

      const nameInput = this.element.querySelector(`.advantage-name-input[data-list='${listId}'][data-index='${index}']`);
      const descriptionInput = this.element.querySelector(`.advantage-description-input[data-list='${listId}'][data-index='${index}']`);

      return {
        ...entry,
        name: nameInput?.value?.trim() || entry.name || "Sem nome",
        description: descriptionInput?.value?.trim() || "",
        editing: closeEditing ? false : entry.editing
      };
    });
  }

  #updateAdvantageLists(advantages, flaws) {
    return this.actor.update({
      "system.advantages": advantages,
      "system.flaws": flaws
    });
  }

  async #saveEditingAdvantageEntries() {
    const hasEditing = this.#getAdvantageList("advantages").some((entry) => entry.editing) || this.#getAdvantageList("flaws").some((entry) => entry.editing);
    const advantages = this.#getAdvantageListFromSheet("advantages", { closeEditing: true });
    const flaws = this.#getAdvantageListFromSheet("flaws", { closeEditing: true });
    if (hasEditing) await this.#updateAdvantageLists(advantages, flaws);
    return { advantages, flaws };
  }

  async #onAddAdvantageEntry(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const listId = this._advantageMode || "advantages";
    const advantages = this.#getAdvantageListFromSheet("advantages", { closeEditing: true });
    const flaws = this.#getAdvantageListFromSheet("flaws", { closeEditing: true });
    const list = listId === "flaws" ? flaws : advantages;
    list.push({ name: "", description: "", level: 1, editing: true });
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = list.length - 1;

    return this.#updateAdvantageLists(advantages, flaws);
  }

  #onSetAdvantageMode(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const listId = event.currentTarget.dataset.mode === "flaws" ? "flaws" : "advantages";
    this._advantageMode = listId;
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = 0;
    return this.render({ force: true });
  }

  async #onSelectAdvantageEntry(event) {
    event.preventDefault();
    const button = event.currentTarget;
    this.#saveAdvantageScrolls();
    await this.#saveEditingAdvantageEntries();
    this._selectedAdvantageList = button.dataset.list;
    this._selectedAdvantageIndex = Number(button.dataset.index);
    return this.render({ force: true });
  }

  async #onEditAdvantageEntry(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const button = event.currentTarget;
    const listId = button.dataset.list || this._selectedAdvantageList;
    const index = Number(button.dataset.index ?? this._selectedAdvantageIndex);
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = index;
    return this.#editAdvantageEntry(listId, index);
  }

  async #onSaveAdvantageEntry(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const button = event.currentTarget;
    return this.#saveAdvantageEntry(button.dataset.list, Number(button.dataset.index));
  }

  async #onDeleteAdvantageEntry(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const button = event.currentTarget;
    const listId = button.dataset.list || this._selectedAdvantageList;
    const index = Number(button.dataset.index ?? this._selectedAdvantageIndex);
    return this.#deleteAdvantageEntry(listId, index);
  }

  async #onRollAdvantageEntry(event) {
    event.preventDefault();
    const button = event.currentTarget;
    return this.#onRollClick({
      preventDefault() {},
      target: { closest: () => null },
      currentTarget: {
        dataset: { type: "advantage", key: button.dataset.index },
        classList: { contains: () => false }
      }
    });
  }

  async #editAdvantageEntry(listId, index) {
    const list = this.#getAdvantageList(listId);
    if (!Number.isInteger(index) || !list[index]) return;

    list[index].editing = true;
    return this.#updateAdvantageList(listId, list);
  }

  async #saveAdvantageEntry(listId, index) {
    const list = this.#getAdvantageList(listId);
    if (!Number.isInteger(index) || !list[index]) return;

    const nameInput = this.element.querySelector(`.advantage-name-input[data-list='${listId}'][data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.advantage-description-input[data-list='${listId}'][data-index='${index}']`);
    const name = nameInput?.value?.trim();
    if (!name) {
      ui.notifications.warn(`Defina um nome para a ${listId === "flaws" ? "desvantagem" : "vantagem"}.`);
      return;
    }

    list[index] = {
      name,
      description: descriptionInput?.value?.trim() || "",
      level: normalizeAdvantageLevel(list[index]),
      editing: false
    };
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = index;
    return this.#updateAdvantageList(listId, list);
  }

  async #deleteAdvantageEntry(listId, index) {
    const list = this.#getAdvantageList(listId);
    if (!Number.isInteger(index) || !list[index]) return;

    list.splice(index, 1);
    this._selectedAdvantageList = listId;
    this._selectedAdvantageIndex = Math.min(index, list.length - 1);
    return this.#updateAdvantageList(listId, list);
  }

  async #onAdvantageRankClick(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const rank = event.currentTarget;
    return this.#shiftAdvantageLevel(rank.dataset.list, Number(rank.dataset.index), 1);
  }

  async #onAdvantageRankContext(event) {
    event.preventDefault();
    this.#saveAdvantageScrolls();
    const rank = event.currentTarget;
    return this.#shiftAdvantageLevel(rank.dataset.list, Number(rank.dataset.index), -1);
  }

  async #shiftAdvantageLevel(listId, index, delta) {
    const list = this.#getAdvantageList(listId);
    if (!Number.isInteger(index) || !list[index]) return;

    list[index].level = clampNumber((list[index].level || 1) + delta, 1, 5);
    return this.#updateAdvantageList(listId, list);
  }

  #prepareHemomancySelection(system) {
    this._hemomancyMode = clampNumber(this._hemomancyMode ?? 1, 1, 5);
    this._hemomancyListMode = this._hemomancyListMode === "formulas" ? "formulas" : "powers";
    const listKey = this._hemomancyListMode;
    const isFormulaMode = listKey === "formulas";
    const activeLevel = isFormulaMode ? system.hemomancy.alchemyLevel : system.hemomancy.level;
    const selectedIndex = Number.isInteger(this._selectedHemomancyIndex) ? this._selectedHemomancyIndex : -1;
    const entries = Array.isArray(system.hemomancy[listKey]) ? system.hemomancy[listKey] : [];
    const visiblePowers = entries
      .map((power, index) => ({ ...power, index }))
      .filter((power) => power.level === this._hemomancyMode);
    const index = visiblePowers.some((power) => power.index === selectedIndex)
      ? selectedIndex
      : (visiblePowers[0]?.index ?? -1);

    this._selectedHemomancyIndex = index;
    system.hemomancy.listMode = listKey;
    system.hemomancy.isFormulaMode = isFormulaMode;
    system.hemomancy.activeLevel = activeLevel;
    system.hemomancy.activeLevelRoman = activeLevel ? toRomanLevel(activeLevel) : "0";
    system.hemomancy.levelLabel = isFormulaMode ? "Potencia da Alquimia" : "Potencia da Hemomancia";
    system.hemomancy.itemSingular = isFormulaMode ? "fórmula" : "magia";
    system.hemomancy.itemPluralTitle = isFormulaMode ? "Fórmulas" : "Magias";
    system.hemomancy.itemEmptyTitle = isFormulaMode ? "Nenhuma fórmula selecionada" : "Nenhuma magia selecionada";
    system.hemomancy.itemEmptyText = isFormulaMode
      ? `Crie uma fórmula no circulo ${toRomanLevel(this._hemomancyMode)} para abrir o grimorio de sangue.`
      : `Crie uma magia no circulo ${toRomanLevel(this._hemomancyMode)} para abrir o grimorio de sangue.`;
    system.hemomancy.switchMode = isFormulaMode ? "powers" : "formulas";
    system.hemomancy.switchLabel = isFormulaMode ? "Magias" : "Fórmulas";
    system.hemomancy.switchIcon = isFormulaMode
      ? `systems/${SYSTEM_ID}/assets/disciplines/bleeding-eye.svg`
      : `systems/${SYSTEM_ID}/assets/disciplines/fizzing-flask.svg`;
    system.hemomancy.mode = this._hemomancyMode;
    system.hemomancy.modeRoman = toRomanLevel(this._hemomancyMode);
    system.hemomancy.modeTabs = [1, 2, 3, 4, 5].map((level) => ({
      level,
      roman: toRomanLevel(level),
      active: level === this._hemomancyMode
    }));
    system.hemomancy.activeEntries = entries.map((power, index) => ({
      ...power,
      selected: index === this._selectedHemomancyIndex,
      hidden: power.level !== this._hemomancyMode
    }));

    const selected = index >= 0 ? entries[index] : null;
    system.hemomancy.selectedPower = selected ? {
      ...selected,
      index,
      rollFormula: isFormulaMode ? `Queima de Hemomancia (${selected.cost})` : `Inteligencia + Hemomancia (${system.attributes.intelligence.value} + ${system.hemomancy.level})`,
      dicePool: Math.max(1, Number(system.attributes.intelligence.value) + Number(system.hemomancy.level))
    } : null;
  }

  #getHemomancyListKey() {
    return this._hemomancyListMode === "formulas" ? "formulas" : "powers";
  }

  #getHemomancyLevelKey() {
    return this.#getHemomancyListKey() === "formulas" ? "alchemyLevel" : "level";
  }

  #getHemomancyPowers(listKey = this.#getHemomancyListKey()) {
    const actorData = this.actor.toObject();
    const powers = Array.isArray(actorData.system?.hemomancy?.[listKey]) ? actorData.system.hemomancy[listKey] : [];

    return powers.map((power) => {
      const normalized = normalizeHemomancyPower(power);
      return {
        name: normalized.name === "Sem nome" ? "" : normalized.name,
        description: normalized.description,
        level: normalized.level,
        cost: normalized.cost,
        editing: normalized.editing
      };
    });
  }

  #updateHemomancyPowers(powers, listKey = this.#getHemomancyListKey()) {
    return this.actor.update({ [`system.hemomancy.${listKey}`]: powers });
  }

  #getHemomancyPowersFromSheet({ closeEditing = false, listKey = this.#getHemomancyListKey() } = {}) {
    return this.#getHemomancyPowers(listKey).map((power, index) => {
      if (!power.editing) return power;

      const nameInput = this.element.querySelector(`.hemomancy-name-input[data-index='${index}']`);
      const costInput = this.element.querySelector(`.hemomancy-cost-input[data-index='${index}']`);
      const descriptionInput = this.element.querySelector(`.hemomancy-description-input[data-index='${index}']`);

      return {
        ...power,
        name: nameInput?.value?.trim() || power.name || "Sem nome",
        cost: clampNumber(costInput?.value ?? power.cost, 1, 5),
        description: descriptionInput?.value?.trim() || "",
        editing: closeEditing ? false : power.editing
      };
    });
  }

  async #saveEditingHemomancyPowers() {
    const listKey = this.#getHemomancyListKey();
    const hasEditing = this.#getHemomancyPowers(listKey).some((power) => power.editing);
    const powers = this.#getHemomancyPowersFromSheet({ closeEditing: true, listKey });
    if (hasEditing) await this.#updateHemomancyPowers(powers, listKey);
    return powers;
  }

  async #onSetHemomancyListMode(event) {
    event.preventDefault();
    await this.#saveEditingHemomancyPowers();
    this._hemomancyListMode = event.currentTarget.dataset.mode === "formulas" ? "formulas" : "powers";
    this._selectedHemomancyIndex = -1;
    return this.render({ force: true });
  }

  async #onSetHemomancyMode(event) {
    event.preventDefault();
    await this.#saveEditingHemomancyPowers();
    this._hemomancyMode = clampNumber(event.currentTarget.dataset.level, 1, 5);
    this._selectedHemomancyIndex = -1;
    return this.render({ force: true });
  }

  async #onAddHemomancyPower(event) {
    event.preventDefault();
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowersFromSheet({ closeEditing: true, listKey });
    const level = clampNumber(this._hemomancyMode ?? 1, 1, 5);
    powers.push({ name: "", description: "", level, cost: 1, editing: true });
    this._selectedHemomancyIndex = powers.length - 1;
    return this.#updateHemomancyPowers(powers, listKey);
  }

  async #onSelectHemomancyPower(event) {
    event.preventDefault();
    await this.#saveEditingHemomancyPowers();
    this._selectedHemomancyIndex = Number(event.currentTarget.dataset.index);
    return this.render({ force: true });
  }

  async #onEditHemomancyPower(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedHemomancyIndex);
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowers(listKey);
    if (!Number.isInteger(index) || !powers[index]) return;

    powers[index].editing = true;
    this._selectedHemomancyIndex = index;
    return this.#updateHemomancyPowers(powers, listKey);
  }

  async #onSaveHemomancyPower(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedHemomancyIndex);
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowers(listKey);
    if (!Number.isInteger(index) || !powers[index]) return;

    const nameInput = this.element.querySelector(`.hemomancy-name-input[data-index='${index}']`);
    const costInput = this.element.querySelector(`.hemomancy-cost-input[data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.hemomancy-description-input[data-index='${index}']`);
    const name = nameInput?.value?.trim();
    if (!name) {
      ui.notifications.warn(`Defina um nome para a ${listKey === "formulas" ? "fórmula" : "magia"} de Hemomancia.`);
      return;
    }

    powers[index] = {
      name,
      description: descriptionInput?.value?.trim() || "",
      level: powers[index].level,
      cost: clampNumber(costInput?.value, 1, 5),
      editing: false
    };
    this._selectedHemomancyIndex = index;
    return this.#updateHemomancyPowers(powers, listKey);
  }

  async #onDeleteHemomancyPower(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedHemomancyIndex);
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowers(listKey);
    if (!Number.isInteger(index) || !powers[index]) return;

    powers.splice(index, 1);
    this._selectedHemomancyIndex = -1;
    return this.#updateHemomancyPowers(powers, listKey);
  }

  async #onRollHemomancyPower(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedHemomancyIndex);
    const listKey = this.#getHemomancyListKey();
    const powers = this.#getHemomancyPowers(listKey);
    if (!Number.isInteger(index) || !powers[index]) return;
    const power = normalizeHemomancyPower(powers[index]);
    const isFormula = listKey === "formulas";

    const currentBlood = Number(this.actor.system.sangria?.value ?? 5);
    if (currentBlood <= 0) {
      const resource = this.#getResource("health");
      for (let i = 0; i < power.cost; i += 1) this.#applyAggravatedDamage(resource);
      await this.#updateResource("health", resource);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<section class="astrael-chat-card"><header class="astrael-chat-header"><span class="astrael-chat-kicker">Sangue Invocado</span><h2>${escapeHtml(power.name)}</h2><p>${escapeHtml(this.actor.name)}</p></header><div class="astrael-chat-result"><span>Sangue Esgotado</span><strong style="font-size:32px;color:#b2202b;text-shadow:0 0 14px rgba(178,32,43,0.4)">${power.cost}</strong><span style="font-size:11px;opacity:0.8">dano(s) agravado(s) na Vida</span></div></section>`
      });
      return;
    }

    const costRoll = await new Roll(`${power.cost}d10`).evaluate();
    const costValues = getRollValues(costRoll);
    const failures = costValues.filter((value) => value < 6).length;
    await createDicePoolMessage({
      actor: this.actor,
      title: `Custo de ${power.name}`,
      kicker: isFormula ? "Queima de Fórmula Hemomântica" : "Queima de Hemomancia",
      diceCount: power.cost,
      useCriticals: false,
      preRolledValues: costValues,
      preRolledRoll: costRoll,
      suppressReroll: true
    });

    if (failures > 0) {
      const currentBlood = Number(this.actor.system.sangria?.value ?? 5);
      const nextBlood = Math.max(0, currentBlood - failures);
      await this.actor.update({ "system.sangria.value": nextBlood });
    }

    if (isFormula) return;

    const intelligence = Number(this.actor.system.attributes?.intelligence?.value) || 1;
    const hemomancyLevel = clampNumber(this.actor.system.hemomancy?.level, 0, 5);
    const diceCount = Math.max(1, intelligence + hemomancyLevel);
    const rawBlood = Math.max(0, 5 - (Number(this.actor.system.sangria?.value) || 5));
    const rawVoid = Math.max(0, Number(this.actor.system.vazio?.value) || 0);
    const actualBlood = Math.min(rawBlood, diceCount);
    const actualVoid = Math.min(rawVoid, diceCount - actualBlood);
    return createDicePoolMessage({
      actor: this.actor,
      title: power.name,
      kicker: `Hemomancia Nivel ${power.levelRoman}`,
      diceCount,
      bloodCount: actualBlood,
      voidCount: actualVoid
    });
  }

  async #onHemomancyLevelClick(event) {
    event.preventDefault();
    const key = this.#getHemomancyLevelKey();
    const level = clampNumber((Number(this.actor.system.hemomancy?.[key]) || 0) + 1, 0, 5);
    return this.actor.update({ [`system.hemomancy.${key}`]: level });
  }

  async #onHemomancyLevelContext(event) {
    event.preventDefault();
    const key = this.#getHemomancyLevelKey();
    const level = clampNumber((Number(this.actor.system.hemomancy?.[key]) || 0) - 1, 0, 5);
    return this.actor.update({ [`system.hemomancy.${key}`]: level });
  }

  #prepareVirtueSelection(system) {
    const selectedIndex = Number.isInteger(this._selectedVirtueIndex) ? this._selectedVirtueIndex : -1;
    const virtues = Array.isArray(system.virtues) ? system.virtues : [];
    const visible = virtues.map((v, index) => ({
      ...v,
      index,
      displayName: v.name || "Virtude sem nome",
      selected: index === selectedIndex
    }));
    this._selectedVirtueIndex = visible.some((v) => v.selected)
      ? selectedIndex
      : (visible[0]?.index ?? -1);
    system.virtues = visible;
    system.selectedVirtue = this._selectedVirtueIndex >= 0
      ? { ...visible[this._selectedVirtueIndex], index: this._selectedVirtueIndex }
      : null;
  }

  #getVirtues() {
    const actorData = this.actor.toObject();
    const virtues = Array.isArray(actorData.system?.virtues) ? actorData.system.virtues : [];
    return virtues.map((v) => {
      const norm = normalizeVirtue(v);
      return {
        name: norm.name,
        description: norm.description,
        perks: norm.perks,
        editing: norm.editing
      };
    });
  }

  #updateVirtues(virtues) {
    return this.actor.update({ "system.virtues": virtues });
  }

  #getVirtuesFromSheet({ closeEditing = false } = {}) {
    return this.#getVirtues().map((virtue, index) => {
      if (!virtue.editing) return virtue;

      const nameInput = this.element.querySelector(`.virtue-name-input[data-index='${index}']`);
      const descriptionInput = this.element.querySelector(`.virtue-description-input[data-index='${index}']`);
      const perks = this.#getVirtuePerksFromSheet(index);

      return {
        ...virtue,
        name: nameInput?.value?.trim() || virtue.name || "",
        description: descriptionInput?.value?.trim() || "",
        perks,
        editing: closeEditing ? false : virtue.editing
      };
    });
  }

  #getVirtuePerksFromSheet(virtueIndex) {
    const virtue = this.#getVirtues()[virtueIndex];
    if (!virtue) return [];
    return virtue.perks.map((perk, pIndex) => {
      const nameInput = this.element.querySelector(`.virtue-perk-name-input[data-virtue='${virtueIndex}'][data-index='${pIndex}']`);
      const descriptionInput = this.element.querySelector(`.virtue-perk-description-input[data-virtue='${virtueIndex}'][data-index='${pIndex}']`);

      return {
        ...perk,
        name: nameInput ? nameInput.value.trim() : (perk.name || ""),
        description: descriptionInput ? descriptionInput.value.trim() : (perk.description || ""),
        editing: false
      };
    });
  }

  async #onSelectVirtue(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(index) || !virtues[index]) return;
    if (index === this._selectedVirtueIndex) return;

    const currentIndex = Number.isInteger(this._selectedVirtueIndex) ? this._selectedVirtueIndex : -1;
    if (currentIndex >= 0 && virtues[currentIndex]?.editing) {
      const updated = this.#getVirtuesFromSheet({ closeEditing: true });
      this._selectedVirtueIndex = index;
      return this.#updateVirtues(updated);
    }

    this._selectedVirtueIndex = index;
    return this.render({ force: true });
  }

  async #onAddVirtue(event) {
    event.preventDefault();
    this._selectedVirtueIndex = this.#getVirtues().length;
    const virtues = this.#getVirtues();
    virtues.push({ name: "", description: "", perks: [], editing: true });
    return this.#updateVirtues(virtues);
  }

  async #onEditVirtue(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedVirtueIndex);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(index) || !virtues[index]) return;

    virtues[index].editing = true;
    this._selectedVirtueIndex = index;
    return this.#updateVirtues(virtues);
  }

  async #onSaveVirtue(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedVirtueIndex);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(index) || !virtues[index]) return;

    const nameInput = this.element.querySelector(`.virtue-name-input[data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.virtue-description-input[data-index='${index}']`);
    const name = nameInput?.value?.trim();
    if (!name) {
      ui.notifications.warn("Defina um nome para a Virtude.");
      return;
    }

    const perks = this.#getVirtuePerksFromSheet(index);
    virtues[index] = {
      name,
      description: descriptionInput?.value?.trim() || "",
      perks,
      editing: false
    };
    this._selectedVirtueIndex = index;
    return this.#updateVirtues(virtues);
  }

  async #onDeleteVirtue(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedVirtueIndex);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(index) || !virtues[index]) return;

    virtues.splice(index, 1);
    this._selectedVirtueIndex = -1;
    return this.#updateVirtues(virtues);
  }

  async #onAddVirtuePerk(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index ?? this._selectedVirtueIndex);
    const virtues = this.#getVirtuesFromSheet();
    if (!Number.isInteger(index) || !virtues[index]) return;

    virtues[index].perks.push({ name: "", description: "", expanded: true, editing: false });
    return this.#updateVirtues(virtues);
  }

  async #onToggleVirtuePerk(event) {
    event.preventDefault();
    const virtueIndex = Number(event.currentTarget.dataset.virtue ?? this._selectedVirtueIndex);
    const perkIndex = Number(event.currentTarget.dataset.index);
    const virtues = this.#getVirtues();
    if (!Number.isInteger(virtueIndex) || !virtues[virtueIndex]) return;
    if (!Number.isInteger(perkIndex) || !virtues[virtueIndex].perks[perkIndex]) return;

    virtues[virtueIndex].perks[perkIndex].expanded = !virtues[virtueIndex].perks[perkIndex].expanded;
    return this.#updateVirtues(virtues);
  }

  async #onDeleteVirtuePerk(event) {
    event.preventDefault();
    const virtueIndex = Number(event.currentTarget.dataset.virtue ?? this._selectedVirtueIndex);
    const perkIndex = Number(event.currentTarget.dataset.index);
    const virtues = this.#getVirtuesFromSheet();
    if (!Number.isInteger(virtueIndex) || !virtues[virtueIndex]) return;
    if (!Number.isInteger(perkIndex) || !virtues[virtueIndex].perks[perkIndex]) return;

    virtues[virtueIndex].perks.splice(perkIndex, 1);
    return this.#updateVirtues(virtues);
  }

  #getStrangerMarkActorData() {
    const actorData = this.actor.toObject();
    const marks = Array.isArray(actorData.system?.strangerMark?.marks) ? actorData.system.strangerMark.marks : [];
    return { marks, selectedMarkId: actorData.system?.strangerMark?.selectedMarkId ?? "" };
  }

  #updateStrangerMark(data) {
    const actorData = this.actor.toObject();
    const current = actorData.system?.strangerMark ?? {};
    return this.actor.update({ "system.strangerMark": { ...current, ...data } });
  }

  #getStrangerMarkAbilitiesFromSheet({ closeEditing = false } = {}) {
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? sm.marks : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return marks;

    const abilities = Array.isArray(marks[markIdx].abilities) ? marks[markIdx].abilities : [];
    const updatedAbilities = abilities.map((ab, idx) => {
      if (!ab.editing) return ab;

      const nameInput = this.element.querySelector(`.stranger-mark-name-input[data-index='${idx}']`);
      const costInput = this.element.querySelector(`.stranger-mark-cost-input[data-index='${idx}']`);
      const descriptionInput = this.element.querySelector(`.stranger-mark-description-input[data-index='${idx}']`);

      return {
        ...ab,
        name: nameInput?.value?.trim() || ab.name || "Sem nome",
        cost: clampNumber(costInput?.value ?? ab.cost, 1, 5),
        description: descriptionInput?.value?.trim() || "",
        editing: closeEditing ? false : ab.editing
      };
    });
    marks[markIdx] = { ...marks[markIdx], abilities: updatedAbilities };
    return marks;
  }

  async #saveEditingStrangerMarkAbilities() {
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? sm.marks : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return marks;
    const hasEditing = (marks[markIdx].abilities ?? []).some((a) => a.editing);
    if (!hasEditing) return marks;
    return this.#getStrangerMarkAbilitiesFromSheet({ closeEditing: true });
  }

  async #onOpenStrangerMarkPicker(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? sm.marks : [];
    const owned = marks.map((m) => m.option);
    const available = STRANGER_MARK_OPTIONS.filter((opt) => !owned.includes(opt.id));
    if (available.length === 0) {
      ui.notifications.warn("Voce ja possui todas as opcoes de marca disponiveis.");
      return;
    }

    const content = `<div class="stranger-mark-picker">
      <p>Escolha uma opcao de marca:</p>
      <div class="stranger-mark-picker-options">
        ${STRANGER_MARK_OPTIONS.map((opt) => `
          <button type="button" class="stranger-mark-picker-option ${owned.includes(opt.id) ? "owned" : ""}" data-option="${opt.id}" ${owned.includes(opt.id) ? "disabled" : ""}>
            <img src="${opt.icon}" alt="">
            <span>${opt.label}</span>
          </button>
        `).join("")}
      </div>
    </div>`;

    const dialog = new Dialog({
      title: "Nova Marca",
      content,
      buttons: {},
      render: (html) => {
        html.find(".stranger-mark-picker-option").on("click", async (event) => {
            const optionId = event.currentTarget.dataset.option;
            if (owned.includes(optionId)) return;
            const marks2 = this.#getStrangerMarkActorData().marks;
            marks2.push({ option: optionId, level: 0, abilities: [] });
            await this.#updateStrangerMark({
              selectedMarkId: optionId,
              selectedAbilityLevel: 1,
              marks: marks2
            });
            this._selectedStrangerMarkAbilityIndex = -1;
            dialog.close();
            return this.render({ force: true });
        });
      }
    }, { classes: ["astrael-dialog"], jQuery: true });
    dialog.render(true);
  }

  async #onAddStrangerMark(event) {
    event.preventDefault();
    return this.#onOpenStrangerMarkPicker(event);
  }

  async #onSelectStrangerMark(event) {
    event.preventDefault();
    await this.#saveEditingStrangerMarkAbilities();
    const optionId = event.currentTarget.dataset.option;
    this._selectedStrangerMarkAbilityIndex = -1;
    return this.#updateStrangerMark({ selectedMarkId: optionId, selectedAbilityLevel: 1 });
  }

  async #onDeleteStrangerMark(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const idx = marks.findIndex((m) => m.option === event.currentTarget.dataset.option);
    if (idx < 0) return;
    marks.splice(idx, 1);
    const nextId = marks.length > 0 ? marks[0].option : "";
    await this.#updateStrangerMark({
      selectedMarkId: nextId,
      selectedAbilityLevel: 1,
      marks
    });
    this._selectedStrangerMarkAbilityIndex = -1;
    return this.render({ force: true });
  }

  async #onStrangerMarkLevelClick(event) {
    event.preventDefault();
    const optionId = event.currentTarget.dataset.option;
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const mark = marks.find((m) => m.option === optionId);
    if (!mark) return;
    mark.level = clampNumber(mark.level + 1, 0, 5);

    const sorted = marks.map(normalizeStrangerMark).sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.label.localeCompare(b.label);
    });
    const bestId = sorted[0]?.option || optionId;

    return this.#updateStrangerMark({ marks, selectedMarkId: bestId });
  }

  async #onStrangerMarkLevelContext(event) {
    event.preventDefault();
    const optionId = event.currentTarget.dataset.option;
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const mark = marks.find((m) => m.option === optionId);
    if (!mark) return;
    mark.level = clampNumber(mark.level - 1, 0, 5);

    const sorted = marks.map(normalizeStrangerMark).sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.label.localeCompare(b.label);
    });
    const bestId = sorted[0]?.option || optionId;

    return this.#updateStrangerMark({ marks, selectedMarkId: bestId });
  }

  async #onSetStrangerMarkAbilityLevel(event) {
    event.preventDefault();
    const level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    this._selectedStrangerMarkAbilityIndex = -1;
    return this.#updateStrangerMark({ selectedAbilityLevel: level });
  }

  async #onAddStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const markIdx = Array.isArray(sm.marks) ? sm.marks.findIndex((m) => m.option === sm.selectedMarkId) : -1;
    if (markIdx < 0) return;

    const level = clampNumber(event.currentTarget.dataset.level ?? sm.selectedAbilityLevel ?? 1, 1, 5);
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    if (level > Number(marks[markIdx].level || 1)) {
      ui.notifications.warn("Esta marca ainda nao possui nivel suficiente para essa habilidade.");
      return;
    }
    const abilities = Array.isArray(marks[markIdx].abilities) ? [...marks[markIdx].abilities] : [];
    abilities.push({ name: "", description: "", level, cost: 0, editing: true });
    marks[markIdx] = { ...marks[markIdx], abilities };
    this._selectedStrangerMarkAbilityIndex = abilities.length - 1;
    return this.#updateStrangerMark({ selectedAbilityLevel: level, marks });
  }

  async #onSelectStrangerMarkAbility(event) {
    event.preventDefault();
    await this.#saveEditingStrangerMarkAbilities();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const mark = Array.isArray(sm.marks) ? sm.marks.find((m) => m.option === sm.selectedMarkId) : null;
    const index = Number(event.currentTarget.dataset.index);
    this._selectedStrangerMarkAbilityIndex = index;
    const abilityLevel = mark?.abilities?.[index]?.level ?? sm.selectedAbilityLevel ?? 1;
    return this.#updateStrangerMark({ selectedAbilityLevel: abilityLevel });
  }

  async #onEditStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return;
    const abilities = Array.isArray(marks[markIdx].abilities) ? [...marks[markIdx].abilities] : [];
    const index = Number(event.currentTarget.dataset.index ?? this._selectedStrangerMarkAbilityIndex);
    if (!Number.isInteger(index) || !abilities[index]) return;
    abilities[index] = { ...abilities[index], editing: true };
    marks[markIdx] = { ...marks[markIdx], abilities };
    this._selectedStrangerMarkAbilityIndex = index;
    return this.#updateStrangerMark({ marks });
  }

  async #onSaveStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return;
    const abilities = Array.isArray(marks[markIdx].abilities) ? [...marks[markIdx].abilities] : [];
    const index = Number(event.currentTarget.dataset.index ?? this._selectedStrangerMarkAbilityIndex);
    if (!Number.isInteger(index) || !abilities[index]) return;

    const nameInput = this.element.querySelector(`.stranger-mark-name-input[data-index='${index}']`);
    const costInput = this.element.querySelector(`.stranger-mark-cost-input[data-index='${index}']`);
    const descriptionInput = this.element.querySelector(`.stranger-mark-description-input[data-index='${index}']`);
    const name = nameInput?.value?.trim();
    if (!name) {
      ui.notifications.warn("Defina um nome para a habilidade.");
      return;
    }

    abilities[index] = {
      name,
      description: descriptionInput?.value?.trim() || "",
      level: abilities[index].level,
      cost: clampNumber(costInput?.value, 0, 5),
      editing: false
    };
    marks[markIdx] = { ...marks[markIdx], abilities };
    this._selectedStrangerMarkAbilityIndex = index;
    return this.#updateStrangerMark({ marks });
  }

  async #onDeleteStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? [...sm.marks] : [];
    const markIdx = marks.findIndex((m) => m.option === sm.selectedMarkId);
    if (markIdx < 0) return;
    const abilities = Array.isArray(marks[markIdx].abilities) ? [...marks[markIdx].abilities] : [];
    const index = Number(event.currentTarget.dataset.index ?? this._selectedStrangerMarkAbilityIndex);
    if (!Number.isInteger(index) || !abilities[index]) return;
    abilities.splice(index, 1);
    marks[markIdx] = { ...marks[markIdx], abilities };
    this._selectedStrangerMarkAbilityIndex = -1;
    return this.#updateStrangerMark({ marks });
  }

  async #onRollStrangerMarkAbility(event) {
    event.preventDefault();
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    const marks = Array.isArray(sm.marks) ? sm.marks : [];
    const mark = marks.find((m) => m.option === sm.selectedMarkId);
    if (!mark) return;
    const abilities = Array.isArray(mark.abilities) ? mark.abilities : [];
    const index = Number(event.currentTarget.dataset.index ?? this._selectedStrangerMarkAbilityIndex);
    if (!Number.isInteger(index) || !abilities[index]) return;
    const ability = normalizeStrangerMarkAbility(abilities[index]);

    const vazio = Number(foundry.utils.getProperty(this.actor, "system.vazio.value")) || 0;

    if (vazio >= 5) {
      const resource = this.#getResource("willpower");
      for (let i = 0; i < ability.cost; i += 1) this.#applyAggravatedDamage(resource);
      await this.#updateResource("willpower", resource);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<section class="astrael-chat-card"><header class="astrael-chat-header"><span class="astrael-chat-kicker">Marca do Estranho</span><h2>${ability.name}</h2><p>${this.actor.name}</p></header><div class="astrael-chat-result"><span>Vazio Transborda</span><strong style="font-size:32px;color:#8aacbe;text-shadow:0 0 14px rgba(74,124,158,0.4)">${ability.cost}</strong><span style="font-size:11px;opacity:0.8">dano(s) agravado(s) na Força de Vontade</span></div></section>`
      });
      return;
    }

    const costRoll = await new Roll(`${ability.cost}d10`).evaluate();
    const costValues = getRollValues(costRoll);
    const failures = costValues.filter((value) => value < 6).length;
    await createDicePoolMessage({
      actor: this.actor,
      title: `Custo de ${ability.name}`,
      kicker: "Queima de Marcas",
      diceCount: ability.cost,
      useCriticals: false,
      preRolledValues: costValues,
      preRolledRoll: costRoll,
      suppressReroll: true
    });

    if (failures > 0) {
      const novoVazio = Math.min(5, vazio + failures);
      await this.actor.update({ "system.vazio.value": novoVazio });
    }
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

  async #onAdjustResource(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const resource = btn.dataset.resource;
    const delta = Number(btn.dataset.delta);
    const path = `system.${resource}.value`;
    const current = Number(foundry.utils.getProperty(this.actor, path)) || 0;
    let min = 0;
    if (resource === "vazio") {
      const marks = foundry.utils.getProperty(this.actor, "system.strangerMark.marks") || [];
      if (marks.some(m => Number(m.level) >= 1)) min = 1;
    }
    const next = Math.max(min, Math.min(5, current + delta));
    return this.actor.update({ [path]: next });
  }

  async #onRouseCheck(event) {
    event.preventDefault();

    const roll = await new Roll("1d10").evaluate();
    const values = getRollValues(roll);
    const isFailure = values[0] < 6;

    if (isFailure) {
      const current = Number(this.actor.system.sangria?.value ?? 5);
      const next = Math.max(0, current - 1);
      await this.actor.update({ "system.sangria.value": next });
    }

    return createDicePoolMessage({
      actor: this.actor,
      title: "Teste de Queima",
      kicker: isFailure ? "Queima — falha, -1 Sangue" : "Queima",
      diceCount: 1,
      useCriticals: false,
      preRolledValues: values,
      preRolledRoll: roll
    });
  }

  async #onOpenSpecialties(event) {
    event.preventDefault();
    if (this._specialtiesPanel) return this._specialtiesPanel.close();

    this._specialtiesPanel = new AstraelSpecialtiesPanel(this.actor, this);
    await this._specialtiesPanel.render({ force: true });
    return this._specialtiesPanel.anchorToSheet();
  }

  async #onToggleStrangerMarksPanel(event) {
    event.preventDefault();

    if (this._strangerMarksPanel) {
      await this._strangerMarksPanel.close();
      this._strangerMarksPanel = null;
      return;
    }

    this._strangerMarksPanel = new AstraelStrangerMarksPanel(this.actor, this);
    await this._strangerMarksPanel.render({ force: true });
    return this._strangerMarksPanel.anchorToSheet();
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

    const rawBlood = Math.max(0, 5 - (Number(this.actor.system.sangria?.value) || 5));
    const rawVoid = Math.max(0, Number(this.actor.system.vazio?.value) || 0);
    const actualBlood = Math.min(rawBlood, diceCount);
    const actualVoid = Math.min(rawVoid, diceCount - actualBlood);
    return createDicePoolMessage({
      actor: this.actor,
      title: `${roll.name}${titleSuffix}`,
      kicker: "Rolagem Personalizada",
      diceCount,
      bloodCount: actualBlood,
      voidCount: actualVoid
    });
  }
}

export { AstraelBaseActorSheet };
