import { ATTRIBUTE_KEYS, CHARACTER_SHEET_TEMPLATE, LOCALIZE_SKILL, SKILL_KEYS, SYSTEM_ID } from "../core/constants.js";
import {
  clampNumber,
  getCharacterPortraitFraming,
  prepareCharacterPortraitPresentation
} from "../core/utilities.js";
import { updateActorSheet } from "../data/models.js";
import { AstraelCharacterPortraitEditor } from "../applications/portrait-editor.js";
import { AstraelBaseActorSheet } from "./base-actor-sheet.js";

class AstraelCharacterSheet extends AstraelBaseActorSheet {
  static LAYOUT_OPTIONS = {
    width: 560,
    minWidth: 560,
    minHeight: 450,
    heightSetting: null
  };

  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "sheet", "actor", "character-sheet"],
    position: {
      width: 560,
      height: 720
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: updateActorSheet
    },
    window: {
      title: "Astrael RPG Character Sheet",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: CHARACTER_SHEET_TEMPLATE
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.characterPortraitViewer = this._characterPortraitViewer === true;
    context.characterPortrait = prepareCharacterPortraitPresentation(getCharacterPortraitFraming(this.actor));
    context.characterCanEditPortrait = this.actor.isOwner;
    context.characterAttributesCollapsed = game.settings.get(SYSTEM_ID, "compactAttributesCollapsed");
    context.characterResourceTooltipsDisabled = game.settings.get(SYSTEM_ID, "compactResourceTooltipsDisabled");
    context.characterResourceTooltipsEnabled = !context.characterResourceTooltipsDisabled;
    const dexterity = Number(this.actor.system.attributes?.dexterity?.value) || 0;
    const wits = Number(this.actor.system.attributes?.wits?.value) || 0;
    context.characterStatus = {
      initiative: dexterity + wits,
      armor: 0,
      movement: 6
    };
    const specialties = Array.isArray(this.actor.system.specialties) ? this.actor.system.specialties : [];
    const buildLevels = (value) => Array.from({ length: 5 }, (_, index) => ({
      value: index + 1,
      filled: index < value,
      current: index + 1 === value
    }));
    context.characterActiveSkills = SKILL_KEYS
      .map((key) => {
        const value = clampNumber(this.actor.system.skills?.[key]?.value, 0, 5);
        const skillSpecialties = specialties
          .map((specialty, index) => ({
            index,
            name: String(specialty.description || "").trim()
          }))
          .filter((specialty, index) => specialties[index]?.skill === key)
          .sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang));
        return {
          key,
          value,
          label: game.i18n.localize(LOCALIZE_SKILL[key]),
          selected: this._characterSpecialtySkillKey === key,
          canRemove: !this._characterSkillRemoval && this.actor.isOwner,
          canAdjustLevel: this.actor.isOwner,
          canOpenSpecialties: true,
          canManageSpecialties: this.actor.isOwner,
          specialtiesOpen: this._characterSpecialtySkillKey === key,
          addingSpecialty: this._characterSpecialtySkillKey === key && this._characterSpecialtyAdding,
          specialtyCount: skillSpecialties.length,
          specialties: skillSpecialties,
          levels: buildLevels(value)
        };
      })
      .filter((skill) => skill.value > 0)
      .sort((left, right) => left.label.localeCompare(right.label, game.i18n.lang));
    const specialtySkill = context.characterActiveSkills.find((skill) => skill.key === this._characterSpecialtySkillKey);
    if (specialtySkill) {
      context.characterSpecialtiesView = {
        key: specialtySkill.key,
        label: specialtySkill.label,
        specialties: specialtySkill.specialties,
        canManage: specialtySkill.canManageSpecialties,
        adding: specialtySkill.addingSpecialty
      };
    } else {
      this._characterSpecialtySkillKey = null;
      this._characterSpecialtyAdding = false;
      context.characterSpecialtiesView = null;
    }
    context.characterSpecialtyRemoval = this._characterSpecialtyRemoval
      ? {
        name: String(this.actor.system.specialties?.[this._characterSpecialtyRemoval.index]?.description || "")
          .trim() || game.i18n.localize("ASTRAEL.CharacterSpecialties.Unnamed")
      }
      : null;
    const activeKeys = new Set(context.characterActiveSkills.map((skill) => skill.key));
    const availableSkills = SKILL_KEYS
      .filter((key) => !activeKeys.has(key))
      .map((key) => ({
        key,
        label: game.i18n.localize(LOCALIZE_SKILL[key]),
        level: this._characterSkillPicker?.levels[key] ?? 0
      }))
      .sort((left, right) => left.label.localeCompare(right.label, game.i18n.lang));
    context.characterCanAddSkill = availableSkills.length > 0 && !this._characterSkillPicker && !this._characterSkillRemoval;
    context.characterSkillPicker = this._characterSkillPicker
      ? (() => {
        const query = (this._characterSkillPicker.query || "").trim().toLocaleLowerCase(game.i18n.lang);
        const rows = availableSkills
          .filter((skill) => !query || skill.label.toLocaleLowerCase(game.i18n.lang).includes(query))
          .map((skill) => ({
            key: skill.key,
            label: skill.label,
            level: skill.level,
            selected: skill.level > 0,
            levels: buildLevels(skill.level)
          }));
        return {
          query: this._characterSkillPicker.query || "",
          total: availableSkills.length,
          selectedCount: availableSkills.filter((skill) => skill.level > 0).length,
          rows
        };
      })()
      : null;
    context.characterSkillRemoval = this._characterSkillRemoval
      ? {
        key: this._characterSkillRemoval.key,
        label: game.i18n.localize(LOCALIZE_SKILL[this._characterSkillRemoval.key])
      }
      : null;
    context.characterResourceTooltipAvailable = !context.characterPortraitViewer
      && !context.characterResourceTooltipsDisabled
      && !context.characterSkillPicker
      && !context.characterSkillRemoval
      && !context.characterSpecialtiesView
      && !context.characterSpecialtyRemoval
      && !context.characterCharacteristicEditor
      && !context.characterCharacteristicRemoval
      && !context.characterConvictionDock;
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.classList.toggle("is-portrait-viewer", context.characterPortraitViewer);
    const windowHeader = this.element.querySelector(".window-header");
    if (windowHeader) windowHeader.inert = false;
    this.element.querySelectorAll("[data-action='adjust-character-attribute']").forEach((button) => {
      button.addEventListener("click", this.#onAdjustCharacterAttribute.bind(this, 1));
      button.addEventListener("contextmenu", this.#onAdjustCharacterAttribute.bind(this, -1));
    });
    this.element.querySelector("[data-action='toggle-character-attributes']")?.addEventListener("click", this.#onToggleCharacterAttributes.bind(this));
    this.element.querySelectorAll("[data-action='set-character-resource-tooltips']").forEach((button) => {
      button.addEventListener("click", this.#onSetCharacterResourceTooltips.bind(this));
    });
    const resourceTooltip = this.element.querySelector(".astrael-character-resource-tooltip");
    if (resourceTooltip) {
      const showResourceTooltip = () => {
        clearTimeout(this._characterResourceTooltipTimer);
        resourceTooltip.classList.add("is-visible");
      };
      const hideResourceTooltip = () => {
        clearTimeout(this._characterResourceTooltipTimer);
        this._characterResourceTooltipTimer = setTimeout(() => {
          resourceTooltip.classList.remove("is-visible");
        }, 650);
      };
      this.element.querySelectorAll(".astrael-character-resource").forEach((resource) => {
        resource.addEventListener("pointerenter", showResourceTooltip);
        resource.addEventListener("pointerleave", hideResourceTooltip);
        resource.addEventListener("focusin", showResourceTooltip);
        resource.addEventListener("focusout", hideResourceTooltip);
      });
      resourceTooltip.addEventListener("pointerenter", showResourceTooltip);
      resourceTooltip.addEventListener("pointerleave", hideResourceTooltip);
      resourceTooltip.addEventListener("focusin", showResourceTooltip);
      resourceTooltip.addEventListener("focusout", hideResourceTooltip);
    }
    this.element.querySelector("[data-action='edit-character-portrait']")?.addEventListener("click", this.#onEditCharacterPortrait.bind(this));
    this.element.querySelector("[data-action='view-character-portrait']")?.addEventListener("click", this.#onViewCharacterPortrait.bind(this));
    this.element.querySelector("[data-action='close-character-portrait-viewer']")?.addEventListener("click", this.#onCloseCharacterPortraitViewer.bind(this));
    this.element.querySelector("[data-action='add-character-skill']")?.addEventListener("click", this.#onAddCharacterSkill.bind(this));
    this.element.querySelectorAll("[data-action='delete-character-skill']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteCharacterSkill.bind(this));
    });
    this.element.querySelectorAll("[data-action='toggle-character-specialties']").forEach((button) => {
      button.addEventListener("click", this.#onToggleCharacterSpecialties.bind(this));
    });
    this.element.querySelector("[data-action='close-character-specialties']")?.addEventListener("click", this.#onCloseCharacterSpecialties.bind(this));
    this.element.querySelectorAll("[data-action='begin-character-specialty']").forEach((button) => {
      button.addEventListener("click", this.#onBeginCharacterSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='save-character-specialty']").forEach((button) => {
      button.addEventListener("click", this.#onSaveCharacterSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='cancel-character-specialty']").forEach((button) => {
      button.addEventListener("click", this.#onCancelCharacterSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='remove-character-specialty']").forEach((button) => {
      button.addEventListener("click", this.#onRemoveCharacterSpecialty.bind(this));
    });
    this.element.querySelector("[data-action='character-specialty-name']")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") return this.#onSaveCharacterSpecialty(event);
    });
    this.element.querySelector("[data-action='search-character-skill-picker']")?.addEventListener("input", this.#onCharacterSkillPickerSearch.bind(this));
    this.element.querySelectorAll("[data-action='set-character-skill-level']").forEach((button) => {
      button.addEventListener("click", this.#onSetCharacterSkillLevel.bind(this));
    });
    this.element.querySelectorAll("[data-action='set-character-skill-picker-level']").forEach((button) => {
      button.addEventListener("click", this.#onSetCharacterSkillPickerLevel.bind(this));
    });
    this.element.querySelector("[data-action='save-character-skill-picker']")?.addEventListener("click", this.#onSaveCharacterSkillPicker.bind(this));
    this.element.querySelector("[data-action='cancel-character-skill-picker']")?.addEventListener("click", this.#onCancelCharacterSkillPicker.bind(this));
    this.element.querySelector("[data-action='close-character-skill-picker']")?.addEventListener("click", this.#onCancelCharacterSkillPicker.bind(this));
    this.element.querySelector("[data-action='cancel-skill-removal']")?.addEventListener("click", this.#onCancelCharacterSkillRemoval.bind(this));
    this.element.querySelector("[data-action='confirm-skill-removal']")?.addEventListener("click", this.#onConfirmCharacterSkillRemoval.bind(this));
    this.element.querySelector("[data-action='cancel-specialty-removal']")?.addEventListener("click", this.#onCancelCharacterSpecialtyRemoval.bind(this));
    this.element.querySelector("[data-action='confirm-specialty-removal']")?.addEventListener("click", this.#onConfirmCharacterSpecialtyRemoval.bind(this));
    this.element.addEventListener("keydown", this.#onCharacterSkillEditorKeydown.bind(this));

    if (context.characterPortraitViewer) {
      this.element.querySelector("[data-action='close-character-portrait-viewer']")?.focus();
    } else if (this._characterPortraitViewerReturnFocus) {
      this._characterPortraitViewerReturnFocus = false;
      this.element.querySelector("[data-action='view-character-portrait']")?.focus();
    } else if (this._characterSkillRemoval) {
      if (this._characterSkillRemovalNeedsInitialFocus) {
        this._characterSkillRemovalNeedsInitialFocus = false;
        this.element.querySelector("[data-action='cancel-skill-removal']")?.focus();
      }
    } else if (this._characterSpecialtyRemoval) {
      if (this._characterSpecialtyRemovalNeedsInitialFocus) {
        this._characterSpecialtyRemovalNeedsInitialFocus = false;
        this.element.querySelector("[data-action='cancel-specialty-removal']")?.focus();
      }
    } else if (this._characterSkillPicker) {
      if (this._characterSkillPickerNeedsInitialFocus) {
        this._characterSkillPickerNeedsInitialFocus = false;
        this.element.querySelector("[data-action='search-character-skill-picker']")?.focus();
      }
    } else if (this._characterSkillReturnFocus) {
      const selector = this._characterSkillReturnFocus === "add"
        ? "[data-action='add-character-skill']"
        : `[data-action='delete-character-skill'][data-key='${this._characterSkillReturnFocus}']`;
      this._characterSkillReturnFocus = null;
      this.element.querySelector(selector)?.focus();
    } else if (this._characterSpecialtyReturnFocus) {
      const key = this._characterSpecialtyReturnFocus;
      this._characterSpecialtyReturnFocus = null;
      this.element.querySelector(`[data-action='toggle-character-specialties'][data-key='${key}']`)?.focus();
    } else if (this._characterSpecialtyFocus) {
      const selector = this._characterSpecialtyFocus === "input"
        ? "[data-action='character-specialty-name']"
        : this._characterSpecialtyFocus === "add"
          ? `[data-action='begin-character-specialty'][data-key='${this._characterSpecialtySkillKey}']`
          : this._characterSpecialtyFocus === "close"
            ? "[data-action='close-character-specialties']"
            : `[data-action='toggle-character-specialties'][data-key='${this._characterSpecialtySkillKey}']`;
      this._characterSpecialtyFocus = null;
      this.element.querySelector(selector)?.focus();
    } else if (this._characterSkillMarkerReturnFocus) {
      const { key, level } = this._characterSkillMarkerReturnFocus;
      this._characterSkillMarkerReturnFocus = null;
      this.element.querySelector(`[data-action='set-character-skill-level'][data-key='${key}'][data-level='${level}']`)?.focus();
    } else {
      this.featureCoordinator.restoreFocus(this.element);
    }
  }

  async #onAdjustCharacterAttribute(delta, event) {
    event.preventDefault();
    const attributeKey = event.currentTarget.dataset.key;
    if (!ATTRIBUTE_KEYS.includes(attributeKey)) return;

    const currentValue = Number(this.actor.system.attributes?.[attributeKey]?.value) || 1;
    const nextValue = clampNumber(currentValue + delta, 1, 5);
    if (nextValue === currentValue) return;

    return this.actor.update({ [`system.attributes.${attributeKey}.value`]: nextValue });
  }

  async #onToggleCharacterAttributes(event) {
    event.preventDefault();
    const collapsed = game.settings.get(SYSTEM_ID, "compactAttributesCollapsed");
    await game.settings.set(SYSTEM_ID, "compactAttributesCollapsed", !collapsed);
    return this.render({ force: true });
  }

  async #onSetCharacterResourceTooltips(event) {
    event.preventDefault();
    event.stopPropagation();
    const disabled = event.currentTarget.dataset.disabled === "true";
    await game.settings.set(SYSTEM_ID, "compactResourceTooltipsDisabled", disabled);
    return this.render({ force: true });
  }

  async #onEditCharacterPortrait(event) {
    event.preventDefault();
    if (!this.actor.isOwner) return;
    if (this._characterPortraitEditor) return this._characterPortraitEditor.bringToFront();
    this._characterPortraitEditor = new AstraelCharacterPortraitEditor(this.actor, this);
    return this._characterPortraitEditor.render({ force: true });
  }

  #onViewCharacterPortrait(event) {
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(this._characterResourceTooltipTimer);
    this._characterPortraitViewer = true;
    return this.render({ force: true });
  }

  #onCloseCharacterPortraitViewer(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this._characterPortraitViewer) return;
    this._characterPortraitViewer = false;
    this._characterPortraitViewerReturnFocus = true;
    return this.render({ force: true });
  }

  #onAddCharacterSkill(event) {
    event.preventDefault();
    if (this._characterSkillPicker || this._characterSkillRemoval) return;
    this._characterSpecialtySkillKey = null;
    this._characterSpecialtyAdding = false;
    this._characterSpecialtyRemoval = null;
    this._characterSpecialtyRemovalNeedsInitialFocus = false;
    this.characteristicsController.close();
    this._characterSkillReturnFocus = "add";
    this._characterSkillPickerNeedsInitialFocus = true;
    this._characterSkillPicker = { query: "", levels: {} };
    return this.render({ force: true });
  }

  #onCharacterSkillPickerSearch(event) {
    event.preventDefault();
    if (!this._characterSkillPicker) return;
    this._characterSkillPicker.query = event.currentTarget.value;
    this.#applyCharacterSkillPickerFilter();
  }

  #onSetCharacterSkillPickerLevel(event) {
    event.preventDefault();
    if (!this._characterSkillPicker) return;
    const key = event.currentTarget.dataset.key;
    const level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    if (!SKILL_KEYS.includes(key)) return;
    this._characterSkillPicker.levels[key] = this._characterSkillPicker.levels[key] === level ? 0 : level;
    this.#updateCharacterSkillPickerRow(key);
    this.#updateCharacterSkillPickerSummary();
  }

  #applyCharacterSkillPickerFilter() {
    const query = (this._characterSkillPicker.query || "").trim().toLocaleLowerCase(game.i18n.lang);
    let visible = 0;
    this.element.querySelectorAll(".astrael-character-skill-picker-row").forEach((row) => {
      const label = row.querySelector(".astrael-character-skill-name")?.textContent || "";
      const match = !query || label.toLocaleLowerCase(game.i18n.lang).includes(query);
      row.hidden = !match;
      if (match) visible += 1;
    });
    const empty = this.element.querySelector(".astrael-character-skill-picker-empty");
    if (empty) empty.hidden = visible > 0;
  }

  #updateCharacterSkillPickerRow(key) {
    const row = this.element.querySelector(`.astrael-character-skill-picker-row[data-key='${key}']`);
    if (!row) return;
    const level = this._characterSkillPicker.levels[key] ?? 0;
    row.classList.toggle("is-selected", level > 0);
    row.querySelectorAll("[data-action='set-character-skill-picker-level']").forEach((dot) => {
      const dotLevel = clampNumber(dot.dataset.level, 1, 5);
      dot.classList.toggle("is-filled", dotLevel <= level);
      dot.classList.toggle("is-current", dotLevel === level);
    });
    const levelBox = row.querySelector(".astrael-character-skill-level");
    if (levelBox) {
      const label = row.querySelector(".astrael-character-skill-name")?.textContent || "";
      levelBox.setAttribute(
        "aria-label",
        `${label}, ${game.i18n.localize("ASTRAEL.CharacterAttributes.Level")} ${level}`
      );
    }
  }

  #updateCharacterSkillPickerSummary() {
    const count = Object.values(this._characterSkillPicker.levels).filter((level) => level >= 1).length;
    const countEl = this.element.querySelector(".astrael-character-skill-picker-tools .astrael-character-specialty-count");
    if (countEl) {
      countEl.textContent = String(count);
      countEl.setAttribute(
        "aria-label",
        `${game.i18n.localize("ASTRAEL.CharacterSkills.Count")}: ${count}`
      );
    }
    const saveButton = this.element.querySelector("[data-action='save-character-skill-picker']");
    if (saveButton) saveButton.disabled = count === 0;
  }

  #onCancelCharacterSkillPicker(event) {
    event?.preventDefault();
    if (!this._characterSkillPicker) return;
    this._characterSkillPicker = null;
    return this.render({ force: true });
  }

  async #onSaveCharacterSkillPicker(event) {
    event.preventDefault();
    const picker = this._characterSkillPicker;
    if (!picker) return;
    const updates = Object.entries(picker.levels)
      .filter(([key, level]) => SKILL_KEYS.includes(key) && level >= 1)
      .reduce((acc, [key, level]) => {
        acc[`system.skills.${key}.value`] = clampNumber(level, 1, 5);
        return acc;
      }, {});
    if (Object.keys(updates).length === 0) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.CharacterSkills.SelectRequired"));
      return;
    }
    this._characterSkillPicker = null;
    return this.actor.update(updates);
  }

  async #onSetCharacterSkillLevel(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    const level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    if (!this.actor.isOwner || !SKILL_KEYS.includes(key)) return;
    if (this._characterSkillPicker || this._characterSkillRemoval || this._characterSpecialtySkillKey) return;
    const currentValue = clampNumber(this.actor.system.skills?.[key]?.value, 0, 5);
    if (currentValue === level) return;
    this._characterSkillMarkerReturnFocus = { key, level };
    return this.actor.update({ [`system.skills.${key}.value`]: level });
  }

  #onDeleteCharacterSkill(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (this._characterSkillPicker || this._characterSkillRemoval || !SKILL_KEYS.includes(key)) return;
    this._characterSpecialtySkillKey = null;
    this._characterSpecialtyAdding = false;
    this.characteristicsController.close();
    this._characterSkillRemoval = { key };
    this._characterSkillRemovalNeedsInitialFocus = true;
    return this.render({ force: true });
  }

  #onCancelCharacterSkillRemoval(event) {
    event?.preventDefault();
    if (!this._characterSkillRemoval) return;
    const key = this._characterSkillRemoval.key;
    this._characterSkillRemoval = null;
    this._characterSkillReturnFocus = key;
    return this.render({ force: true });
  }

  async #onConfirmCharacterSkillRemoval(event) {
    event.preventDefault();
    const key = this._characterSkillRemoval?.key;
    if (!SKILL_KEYS.includes(key)) return;
    if (this._characterSpecialtySkillKey === key) this._characterSpecialtySkillKey = null;
    this._characterSkillRemoval = null;
    this._characterSkillReturnFocus = "add";
    return this.actor.update({ [`system.skills.${key}.value`]: 0 });
  }

  #onCharacterSkillEditorKeydown(event) {
    if (event.key !== "Escape") return;
    if (this._characterPortraitViewer) {
      event.preventDefault();
      event.stopPropagation();
      return this.#onCloseCharacterPortraitViewer();
    }
    if (this._characterSkillRemoval) {
      event.preventDefault();
      event.stopPropagation();
      return this.#onCancelCharacterSkillRemoval();
    }
    if (this._characterSpecialtyRemoval) {
      event.preventDefault();
      event.stopPropagation();
      return this.#onCancelCharacterSpecialtyRemoval();
    }
    if (this._characterSpecialtyAdding) {
      event.preventDefault();
      event.stopPropagation();
      return this.#onCancelCharacterSpecialty();
    }
    if (this._characterSpecialtySkillKey) {
      event.preventDefault();
      event.stopPropagation();
      return this.#onCloseCharacterSpecialties();
    }
    if (this._characterSkillPicker) {
      event.preventDefault();
      event.stopPropagation();
      return this.#onCancelCharacterSkillPicker();
    }
    if (this.featureCoordinator.handleEscape(event)) return;
  }

  #onToggleCharacterSpecialties(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (this._characterSkillPicker || this._characterSkillRemoval || !SKILL_KEYS.includes(key)) return;
    const closing = this._characterSpecialtySkillKey === key;
    this._characterSpecialtySkillKey = closing ? null : key;
    this._characterSpecialtyAdding = false;
    this._characterSpecialtyRemoval = null;
    this._characterSpecialtyRemovalNeedsInitialFocus = false;
    this._characterSpecialtyFocus = closing ? null : "close";
    if (!closing) {
      this.characteristicsController.close();
    }
    return this.render({ force: true });
  }

  #onCloseCharacterSpecialties(event) {
    event?.preventDefault();
    if (!this._characterSpecialtySkillKey) return;
    const key = this._characterSpecialtySkillKey;
    this._characterSpecialtySkillKey = null;
    this._characterSpecialtyAdding = false;
    this._characterSpecialtyRemoval = null;
    this._characterSpecialtyRemovalNeedsInitialFocus = false;
    this._characterSpecialtyFocus = null;
    this._characterSpecialtyReturnFocus = key;
    return this.render({ force: true });
  }

  #onBeginCharacterSpecialty(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (!this.actor.isOwner || this._characterSpecialtySkillKey !== key) return;
    this._characterSpecialtyAdding = true;
    this._characterSpecialtyFocus = "input";
    return this.render({ force: true });
  }

  #onCancelCharacterSpecialty(event) {
    event?.preventDefault();
    if (!this._characterSpecialtySkillKey) return;
    this._characterSpecialtyAdding = false;
    this._characterSpecialtyFocus = "add";
    return this.render({ force: true });
  }

  async #onSaveCharacterSpecialty(event) {
    event.preventDefault();
    if (!this.actor.isOwner || !this._characterSpecialtySkillKey || !this._characterSpecialtyAdding) return;
    const input = this.element.querySelector("[data-action='character-specialty-name']");
    const name = input?.value.trim() || "";
    if (!name) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.CharacterSpecialties.NameRequired"));
      input?.focus();
      return;
    }

    const specialties = Array.isArray(this.actor.system.specialties)
      ? this.actor.system.specialties.map((specialty) => ({ ...specialty }))
      : [];
    specialties.push({ skill: this._characterSpecialtySkillKey, description: name });
    this._characterSpecialtyAdding = false;
    this._characterSpecialtyFocus = "add";
    return this.actor.update({ "system.specialties": specialties });
  }

  async #onRemoveCharacterSpecialty(event) {
    event.preventDefault();
    if (!this.actor.isOwner || !this._characterSpecialtySkillKey) return;
    const index = Number(event.currentTarget.dataset.index);
    const specialties = Array.isArray(this.actor.system.specialties) ? this.actor.system.specialties : [];
    if (!Number.isInteger(index) || specialties[index]?.skill !== this._characterSpecialtySkillKey) return;
    this._characterSpecialtyRemoval = { skillKey: this._characterSpecialtySkillKey, index };
    this._characterSpecialtyRemovalNeedsInitialFocus = true;
    return this.render({ force: true });
  }

  #onCancelCharacterSpecialtyRemoval(event) {
    event?.preventDefault();
    if (!this._characterSpecialtyRemoval) return;
    this._characterSpecialtyRemoval = null;
    this._characterSpecialtyFocus = "close";
    return this.render({ force: true });
  }

  async #onConfirmCharacterSpecialtyRemoval(event) {
    event.preventDefault();
    const removal = this._characterSpecialtyRemoval;
    if (!removal || !this.actor.isOwner) return;
    const specialties = Array.isArray(this.actor.system.specialties)
      ? this.actor.system.specialties.map((specialty) => ({ ...specialty }))
      : [];
    if (!Number.isInteger(removal.index) || specialties[removal.index]?.skill !== removal.skillKey) return;
    specialties.splice(removal.index, 1);
    this._characterSpecialtyRemoval = null;
    this._characterSpecialtyFocus = "close";
    return this.actor.update({ "system.specialties": specialties });
  }

  async close(options) {
    clearTimeout(this._characterResourceTooltipTimer);
    await this._characterPortraitEditor?.close();
    this._characterPortraitEditor = null;
    this.featureCoordinator.close();
    await this.featureCoordinator.destroy();
    return super.close(options);
  }
}

export { AstraelCharacterSheet };
