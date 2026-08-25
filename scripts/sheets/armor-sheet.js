import { ARMOR_SHEET_TEMPLATE } from "../core/constants.js";
import { clampNumber } from "../core/utilities.js";
import { getArmorSpecialization, validateArmorData } from "../rules/armors.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

function createArmorDraft(item) {
  const system = item.system?.toObject?.() ?? item.system ?? {};
  return {
    name: String(item.name || ""),
    img: String(item.img || ""),
    system: {
      description: String(system.description || ""),
      specialization: String(system.specialization || "").trim(),
      armor: Math.trunc(clampNumber(system.armor, 0, Number.MAX_SAFE_INTEGER))
    }
  };
}

function prepareArmorSpecialization(selectedId, invalid) {
  const value = String(selectedId || "").trim();
  const entry = getArmorSpecialization(value);
  return {
    value,
    configured: Boolean(value),
    invalid,
    label: entry
      ? game.i18n.localize(entry.label)
      : value
        ? game.i18n.format("ASTRAEL.Armor.UnknownSpecialization", { id: value })
        : game.i18n.localize("ASTRAEL.Armor.NoSpecialization"),
    description: entry
      ? game.i18n.localize(entry.description)
      : value
        ? game.i18n.localize("ASTRAEL.Armor.UnknownSpecializationHint")
        : game.i18n.localize("ASTRAEL.Armor.NoSpecialization")
  };
}

async function updateArmorSheet(event, form, formData) {
  this._armorEditMode = false;
  try {
    const result = await this.item.update(formData.object);
    this._armorDraft = null;
    return result;
  } catch (error) {
    this._armorEditMode = true;
    throw error;
  }
}

class AstraelArmorSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["astrael-rpg", "sheet", "item", "item-sheet", "armor-sheet"],
    position: {
      width: 500,
      height: 560
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: updateArmorSheet
    },
    window: {
      title: "Astrael RPG Armor",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: ARMOR_SHEET_TEMPLATE
    }
  };

  get title() {
    return `${game.i18n.localize("ASTRAEL.Armor.Title")}: ${this.item.name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const canEdit = this.item.isOwner === true;
    const editing = canEdit && this._armorEditMode === true;
    if (editing && !this._armorDraft) this._armorDraft = createArmorDraft(this.item);
    const armor = editing ? this._armorDraft : createArmorDraft(this.item);

    context.item = this.item;
    context.armor = armor;
    context.system = armor.system;
    context.canEdit = canEdit;
    context.editing = editing;
    const validation = validateArmorData(armor.system);
    context.armorValidation = { ...validation, armorInvalid: validation.invalidFields.includes("armor") };
    context.armorSpecialization = prepareArmorSpecialization(
      armor.system.specialization,
      validation.invalidFields.includes("specialization")
    );
    context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(armor.system.description, {
      relativeTo: this.item,
      rollData: this.item.getRollData?.() ?? {},
      secrets: canEdit
    });
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelector("[data-action='change-armor-image']")?.addEventListener("click", this.#onChangeImage.bind(this));
    this.element.querySelector("[data-action='save-armor']")?.addEventListener("click", this.#onSave.bind(this));
    this.element.querySelectorAll("[data-action='edit-armor']").forEach((button) => {
      button.addEventListener("click", this.#onEdit.bind(this));
    });
    this.element.querySelector("[data-action='cancel-armor-edit']")?.addEventListener("click", this.#onCancelEdit.bind(this));
    this.element.querySelectorAll("[data-armor-draft-field]").forEach((field) => {
      field.addEventListener("input", this.#onDraftInput.bind(this));
    });
    this.element.querySelector("[data-action='remove-armor-specialization']")?.addEventListener("click", this.#onRemoveSpecialization.bind(this));
    this.element.querySelector("prose-mirror[name='system.description']")?.addEventListener("input", this.#onDescriptionInput.bind(this));
  }

  async close(options) {
    this._armorDraft = null;
    return super.close(options);
  }

  #syncDraftFromForm() {
    if (!this._armorDraft) return;
    this.element.querySelectorAll("[data-armor-draft-field]").forEach((field) => {
      this.#setDraftValue(field.dataset.armorDraftField, field.value);
    });
    const descriptionEditor = this.element.querySelector("prose-mirror[name='system.description']");
    if (descriptionEditor) {
      descriptionEditor.save();
      this.#setDraftValue("description", descriptionEditor.value);
    }
    const image = this.element.querySelector("[data-armor-image-input]");
    if (image) this._armorDraft.img = image.value;
  }

  #setDraftValue(field, value) {
    if (!this._armorDraft) return;
    if (field === "name") this._armorDraft.name = value;
    else if (field === "armor") this._armorDraft.system.armor = value;
    else if (field === "description") this._armorDraft.system.description = value;
  }

  #onDraftInput(event) {
    this.#setDraftValue(event.currentTarget.dataset.armorDraftField, event.currentTarget.value);
  }

  #onDescriptionInput(event) {
    this.#setDraftValue("description", event.currentTarget.value);
  }

  #onRemoveSpecialization(event) {
    event.preventDefault();
    if (!this._armorDraft) return;
    this.#syncDraftFromForm();
    this._armorDraft.system.specialization = "";
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
    this._armorDraft = createArmorDraft(this.item);
    this._armorEditMode = true;
    return this.render({ force: true });
  }

  #onCancelEdit(event) {
    event.preventDefault();
    this._armorDraft = null;
    this._armorEditMode = false;
    return this.render({ force: true });
  }

  #onChangeImage(event) {
    event.preventDefault();
    if (this.item.isOwner !== true || this._armorEditMode !== true || !this._armorDraft) return;

    const imageInput = this.element.querySelector("[data-armor-image-input]");
    const picker = new FilePicker({
      type: "image",
      current: imageInput?.value || this._armorDraft.img,
      callback: (path) => {
        const image = this.element.querySelector("[data-action='change-armor-image'] img");
        if (image) image.src = path;
        if (imageInput) imageInput.value = path;
        this._armorDraft.img = path;
      }
    });
    return picker.browse();
  }
}

export { AstraelArmorSheet, createArmorDraft };
