import { ITEM_SHEET_TEMPLATE } from "../core/constants.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

function createItemDraft(item) {
  const system = item.system?.toObject?.() ?? item.system ?? {};
  return {
    name: String(item.name || ""),
    img: String(item.img || ""),
    system: {
      description: String(system.description || "")
    }
  };
}

async function updateItemSheet(event, form, formData) {
  this._itemEditMode = false;
  try {
    const result = await this.item.update(formData.object);
    this._itemDraft = null;
    return result;
  } catch (error) {
    this._itemEditMode = true;
    throw error;
  }
}

class AstraelItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["astrael-rpg", "sheet", "item", "item-sheet"],
    position: {
      width: 500,
      height: 520
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: updateItemSheet
    },
    window: {
      title: "Astrael RPG Item",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: ITEM_SHEET_TEMPLATE
    }
  };

  get title() {
    return `${game.i18n.localize("ASTRAEL.Item.Title")}: ${this.item.name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const canEdit = this.item.isOwner === true;
    const editing = canEdit && this._itemEditMode === true;
    if (editing && !this._itemDraft) this._itemDraft = createItemDraft(this.item);
    const item = editing ? this._itemDraft : createItemDraft(this.item);

    context.item = this.item;
    context.sheetItem = item;
    context.system = item.system;
    context.canEdit = canEdit;
    context.editing = editing;
    context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(item.system.description, {
      relativeTo: this.item,
      rollData: this.item.getRollData?.() ?? {},
      secrets: canEdit
    });
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelector("[data-action='change-item-image']")?.addEventListener("click", this.#onChangeImage.bind(this));
    this.element.querySelector("[data-action='save-item']")?.addEventListener("click", this.#onSave.bind(this));
    this.element.querySelectorAll("[data-action='edit-item']").forEach((button) => {
      button.addEventListener("click", this.#onEdit.bind(this));
    });
    this.element.querySelector("[data-action='cancel-item-edit']")?.addEventListener("click", this.#onCancelEdit.bind(this));
    this.element.querySelectorAll("[data-item-draft-field]").forEach((field) => {
      field.addEventListener("input", this.#onDraftInput.bind(this));
    });
    this.element.querySelector("prose-mirror[name='system.description']")?.addEventListener("input", this.#onDescriptionInput.bind(this));
  }

  async close(options) {
    this._itemDraft = null;
    return super.close(options);
  }

  #syncDraftFromForm() {
    if (!this._itemDraft) return;
    this.element.querySelectorAll("[data-item-draft-field]").forEach((field) => {
      this.#setDraftValue(field.dataset.itemDraftField, field.value);
    });
    const descriptionEditor = this.element.querySelector("prose-mirror[name='system.description']");
    if (descriptionEditor) {
      descriptionEditor.save();
      this.#setDraftValue("description", descriptionEditor.value);
    }
    const image = this.element.querySelector("[data-item-image-input]");
    if (image) this._itemDraft.img = image.value;
  }

  #setDraftValue(field, value) {
    if (!this._itemDraft) return;
    if (field === "name") this._itemDraft.name = value;
    else if (field === "description") this._itemDraft.system.description = value;
  }

  #onDraftInput(event) {
    this.#setDraftValue(event.currentTarget.dataset.itemDraftField, event.currentTarget.value);
  }

  #onDescriptionInput(event) {
    this.#setDraftValue("description", event.currentTarget.value);
  }

  #onSave(event) {
    event.preventDefault();
    this.#syncDraftFromForm();
    return this.submit();
  }

  #onEdit(event) {
    event.preventDefault();
    if (this.item.isOwner !== true) return;
    this._itemDraft = createItemDraft(this.item);
    this._itemEditMode = true;
    return this.render({ force: true });
  }

  #onCancelEdit(event) {
    event.preventDefault();
    this._itemDraft = null;
    this._itemEditMode = false;
    return this.render({ force: true });
  }

  #onChangeImage(event) {
    event.preventDefault();
    if (this.item.isOwner !== true || this._itemEditMode !== true || !this._itemDraft) return;

    const imageInput = this.element.querySelector("[data-item-image-input]");
    const picker = new FilePicker({
      type: "image",
      current: imageInput?.value || this._itemDraft.img,
      callback: (path) => {
        const image = this.element.querySelector("[data-action='change-item-image'] img");
        if (image) image.src = path;
        if (imageInput) imageInput.value = path;
        this._itemDraft.img = path;
      }
    });
    return picker.browse();
  }
}

export { AstraelItemSheet, createItemDraft };
