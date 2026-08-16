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
          selected: (this._characterSkillEditor?.mode !== "add" && this._characterSkillEditor?.key === key)
            || this._characterSpecialtySkillKey === key,
          canRemove: !this._characterSkillEditor && !this._characterSkillRemoval && this.actor.isOwner,
          canOpenSpecialties: !this._characterSkillEditor,
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
      context.characterSpecialtyDock = {
        key: specialtySkill.key,
        label: specialtySkill.label,
        specialties: specialtySkill.specialties,
        canManage: specialtySkill.canManageSpecialties,
        adding: specialtySkill.addingSpecialty
      };
    } else {
      this._characterSpecialtySkillKey = null;
      this._characterSpecialtyAdding = false;
      context.characterSpecialtyDock = null;
    }
    const activeKeys = new Set(context.characterActiveSkills.map((skill) => skill.key));
    const availableSkills = SKILL_KEYS
      .filter((key) => !activeKeys.has(key))
      .map((key) => ({
        key,
        label: game.i18n.localize(LOCALIZE_SKILL[key]),
        selected: this._characterSkillEditor?.key === key
      }))
      .sort((left, right) => left.label.localeCompare(right.label, game.i18n.lang));
    context.characterCanAddSkill = availableSkills.length > 0 && !this._characterSkillEditor && !this._characterSkillRemoval;
    context.characterSkillEditor = this._characterSkillEditor
      ? {
        ...this._characterSkillEditor,
        adding: this._characterSkillEditor.mode === "add",
        label: this._characterSkillEditor.mode === "edit" || this._characterSkillEditor.mode === "remove"
          ? game.i18n.localize(LOCALIZE_SKILL[this._characterSkillEditor.key])
          : "",
        levels: buildLevels(this._characterSkillEditor.level),
        options: availableSkills
      }
      : null;
    context.characterSkillRemoval = this._characterSkillRemoval
      ? {
        key: this._characterSkillRemoval.key,
        label: game.i18n.localize(LOCALIZE_SKILL[this._characterSkillRemoval.key])
      }
      : null;
    context.characterResourceTooltipAvailable = !context.characterPortraitViewer
      && !context.characterResourceTooltipsDisabled
      && !context.characterSkillEditor
      && !context.characterSkillRemoval
      && !context.characterSpecialtyDock
      && !context.characterCharacteristicDock
      && !context.characterConvictionDock;
    context.characterDockFocused = Boolean(
      context.characterSkillEditor
      || context.characterSpecialtyDock
      || context.characterCharacteristicDock
      || context.characterConvictionDock
    );
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
    this.element.querySelectorAll("[data-action='set-character-editor-level']").forEach((button) => {
      button.addEventListener("click", this.#onSetCharacterEditorLevel.bind(this));
    });
    this.element.querySelector("[data-action='select-character-editor-skill']")?.addEventListener("change", (event) => {
      if (this._characterSkillEditor?.mode === "add") this._characterSkillEditor.key = event.currentTarget.value;
    });
    this.element.querySelector("[data-action='save-character-skill-editor']")?.addEventListener("click", this.#onSaveCharacterSkillEditor.bind(this));
    this.element.querySelector("[data-action='cancel-character-skill-editor']")?.addEventListener("click", this.#onCancelCharacterSkillEditor.bind(this));
    this.element.querySelector("[data-action='cancel-skill-removal']")?.addEventListener("click", this.#onCancelCharacterSkillRemoval.bind(this));
    this.element.querySelector("[data-action='confirm-skill-removal']")?.addEventListener("click", this.#onConfirmCharacterSkillRemoval.bind(this));
    this.element.addEventListener("keydown", this.#onCharacterSkillEditorKeydown.bind(this));

    const activeDock = this.element.querySelector(
      ".astrael-character-skill-dock, .astrael-character-specialty-dock, .astrael-characteristic-dock, .astrael-conviction-dock"
    );
    const characterFrame = this.element.querySelector(".astrael-character-frame");
    if (activeDock && characterFrame) {
      let branch = activeDock;
      while (branch.parentElement && branch !== characterFrame) {
        const parent = branch.parentElement;
        for (const sibling of parent.children) {
          const keepConvictionTitle = activeDock.classList.contains("astrael-conviction-dock")
            && sibling.classList.contains("astrael-convictions-header");
          if (sibling !== branch && !keepConvictionTitle) sibling.inert = true;
        }
        branch = parent;
      }
    }

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
    } else if (this._characterSkillNeedsInitialFocus && this._characterSkillEditor) {
      this._characterSkillNeedsInitialFocus = false;
      const focusTarget = this._characterSkillEditor.mode === "add"
        ? this.element.querySelector("[data-action='select-character-editor-skill']")
        : this.element.querySelector("[data-action='set-character-editor-level'].is-current");
      focusTarget?.focus();
    } else if (!this._characterSkillEditor && this._characterSkillReturnFocus) {
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
    if (this._characterSkillEditor || this._characterSkillRemoval) return;
    this._characterSpecialtySkillKey = null;
    this._characterSpecialtyAdding = false;
    this.characteristicsController.close();
    this._characterSkillReturnFocus = "add";
    this._characterSkillNeedsInitialFocus = true;
    this._characterSkillEditor = { mode: "add", key: "", level: 1 };
    return this.render({ force: true });
  }

  #onSetCharacterEditorLevel(event) {
    event.preventDefault();
    if (!this._characterSkillEditor) return;
    this._characterSkillEditor.level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    return this.render({ force: true });
  }

  #onCancelCharacterSkillEditor(event) {
    event?.preventDefault();
    if (!this._characterSkillEditor) return;
    this._characterSkillEditor = null;
    return this.render({ force: true });
  }

  async #onSaveCharacterSkillEditor(event) {
    event.preventDefault();
    const editor = this._characterSkillEditor;
    if (!editor) return;
    if (!SKILL_KEYS.includes(editor.key)) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.CharacterSkills.SelectRequired"));
      return;
    }
    this._characterSkillEditor = null;
    return this.actor.update({ [`system.skills.${editor.key}.value`]: clampNumber(editor.level, 1, 5) });
  }

  #onDeleteCharacterSkill(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (this._characterSkillEditor || this._characterSkillRemoval || !SKILL_KEYS.includes(key)) return;
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
    if (this.featureCoordinator.handleEscape(event)) return;
    if (!this._characterSkillEditor) return;
    event.preventDefault();
    event.stopPropagation();
    return this.#onCancelCharacterSkillEditor();
  }

  #onToggleCharacterSpecialties(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    if (this._characterSkillEditor || this._characterSkillRemoval || !SKILL_KEYS.includes(key)) return;
    const closing = this._characterSpecialtySkillKey === key;
    this._characterSpecialtySkillKey = closing ? null : key;
    this._characterSpecialtyAdding = false;
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
    const specialties = Array.isArray(this.actor.system.specialties)
      ? this.actor.system.specialties.map((specialty) => ({ ...specialty }))
      : [];
    if (!Number.isInteger(index) || specialties[index]?.skill !== this._characterSpecialtySkillKey) return;
    specialties.splice(index, 1);
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
