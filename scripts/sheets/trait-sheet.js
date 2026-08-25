import { SYSTEM_ID, TRAIT_SHEET_TEMPLATE } from "../core/constants.js";
import { clampNumber } from "../core/utilities.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

function normalizeTraitCategory(value) {
  return value === "flaw" ? "flaw" : "advantage";
}

function buildLevels(value) {
  return Array.from({ length: 5 }, (_, index) => ({
    value: index + 1,
    filled: index < value,
    current: index + 1 === value
  }));
}

function createTraitDraft(item) {
  const system = item.system?.toObject?.() ?? item.system ?? {};
  const level = clampNumber(system.level ?? system.value ?? 1, 1, 5);
  const category = normalizeTraitCategory(system.category);
  const i18n = item.getFlag?.(SYSTEM_ID, "i18n") ?? null;
  return {
    name: String(item.name || ""),
    img: String(item.img || ""),
    system: {
      description: String(system.description || ""),
      category,
      level
    },
    category,
    isFlaw: category === "flaw",
    levels: buildLevels(level),
    ...(i18n ? { i18n } : {})
  };
}

function resolveLocalizedTrait(draft) {
  if (!draft.i18n) return draft;
  return {
    ...draft,
    name: draft.i18n.nameKey ? game.i18n.localize(draft.i18n.nameKey) : draft.name,
    system: {
      ...draft.system,
      description: draft.i18n.descriptionKey ? game.i18n.localize(draft.i18n.descriptionKey) : draft.system.description
    }
  };
}

async function updateTraitSheet(event, form, formData) {
  this._traitEditMode = false;
  try {
    const result = await this.item.update(formData.object);
    this._traitDraft = null;
    return result;
  } catch (error) {
    this._traitEditMode = true;
    throw error;
  }
}

class AstraelTraitSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["astrael-rpg", "sheet", "item", "item-sheet", "trait-sheet"],
    position: {
      width: 500,
      height: 560
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: updateTraitSheet
    },
    window: {
      title: "Astrael RPG Trait",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: TRAIT_SHEET_TEMPLATE
    }
  };

  get title() {
    const i18n = this.item.getFlag?.(SYSTEM_ID, "i18n");
    const name = i18n?.nameKey ? game.i18n.localize(i18n.nameKey) : this.item.name;
    return `${game.i18n.localize("ASTRAEL.Trait.Title")}: ${name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const canEdit = this.item.isOwner === true;
    const editing = canEdit && this._traitEditMode === true;
    if (editing && !this._traitDraft) this._traitDraft = createTraitDraft(this.item);
    const trait = editing ? this._traitDraft : resolveLocalizedTrait(createTraitDraft(this.item));

    context.item = this.item;
    context.trait = trait;
    context.system = trait.system;
    context.canEdit = canEdit;
    context.editing = editing;
    context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(trait.system.description, {
      relativeTo: this.item,
      rollData: this.item.getRollData?.() ?? {},
      secrets: canEdit
    });
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelector("[data-action='save-trait']")?.addEventListener("click", this.#onSave.bind(this));
    this.element.querySelectorAll("[data-action='edit-trait']").forEach((button) => {
      button.addEventListener("click", this.#onEdit.bind(this));
    });
    this.element.querySelector("[data-action='cancel-trait-edit']")?.addEventListener("click", this.#onCancelEdit.bind(this));
    this.element.querySelectorAll("[data-trait-draft-field]").forEach((field) => {
      field.addEventListener("input", this.#onDraftInput.bind(this));
    });
    this.element.querySelectorAll("[data-trait-category]").forEach((button) => {
      button.addEventListener("click", this.#onSelectCategory.bind(this));
    });
    this.element.querySelectorAll("[data-trait-level]").forEach((button) => {
      button.addEventListener("click", this.#onSelectLevel.bind(this));
    });
    this.element.querySelector("prose-mirror[name='system.description']")?.addEventListener("input", this.#onDescriptionInput.bind(this));
  }

  async close(options) {
    this._traitDraft = null;
    return super.close(options);
  }

  #syncDraftFromForm() {
    if (!this._traitDraft) return;
    this.element.querySelectorAll("[data-trait-draft-field]").forEach((field) => {
      this.#setDraftValue(field.dataset.traitDraftField, field.value);
    });
    const descriptionEditor = this.element.querySelector("prose-mirror[name='system.description']");
    if (descriptionEditor) {
      descriptionEditor.save();
      this.#setDraftValue("description", descriptionEditor.value);
    }
  }

  #setDraftValue(field, value) {
    if (!this._traitDraft) return;
    if (field === "name") this._traitDraft.name = value;
    else if (field === "description") this._traitDraft.system.description = value;
  }

  #refreshDraftPresentation() {
    if (!this._traitDraft) return;
    const category = normalizeTraitCategory(this._traitDraft.system.category);
    const level = clampNumber(this._traitDraft.system.level, 1, 5);
    this._traitDraft.system.category = category;
    this._traitDraft.system.level = level;
    this._traitDraft.category = category;
    this._traitDraft.isFlaw = category === "flaw";
    this._traitDraft.levels = buildLevels(level);
  }

  #onDraftInput(event) {
    this.#setDraftValue(event.currentTarget.dataset.traitDraftField, event.currentTarget.value);
  }

  #onDescriptionInput(event) {
    this.#setDraftValue("description", event.currentTarget.value);
  }

  #onSelectCategory(event) {
    event.preventDefault();
    if (!this._traitDraft) return;
    this.#syncDraftFromForm();
    this._traitDraft.system.category = normalizeTraitCategory(event.currentTarget.dataset.traitCategory);
    this.#refreshDraftPresentation();
    return this.render({ force: true });
  }

  #onSelectLevel(event) {
    event.preventDefault();
    if (!this._traitDraft) return;
    this.#syncDraftFromForm();
    this._traitDraft.system.level = clampNumber(event.currentTarget.dataset.traitLevel, 1, 5);
    this.#refreshDraftPresentation();
    return this.render({ force: true });
  }

  #onSave(event) {
    event.preventDefault();
    this.#syncDraftFromForm();
    return this.submit();
  }

  #onEdit(event) {
    event.preventDefault();
    if (this.item.isOwner !== true) return;
    this._traitDraft = createTraitDraft(this.item);
    this._traitEditMode = true;
    return this.render({ force: true });
  }

  #onCancelEdit(event) {
    event.preventDefault();
    this._traitDraft = null;
    this._traitEditMode = false;
    return this.render({ force: true });
  }

}

export { AstraelTraitSheet, createTraitDraft };
