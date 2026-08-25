import { WEAPON_SHEET_TEMPLATE } from "../core/constants.js";
import {
  MAJOR_WEAPON_TRAITS,
  MINOR_WEAPON_TRAITS,
  WEAPON_PROPERTY_KEYS,
  getWeaponCatalogEntry,
  validateWeaponData
} from "../rules/weapons.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const PROPERTY_CATALOGS = Object.freeze({
  minorTrait: MINOR_WEAPON_TRAITS,
  majorTrait: MAJOR_WEAPON_TRAITS
});

const PROPERTY_PRESENTATION = Object.freeze({
  minorTrait: Object.freeze({
    category: "ASTRAEL.Weapon.PropertyMinor",
    title: "ASTRAEL.Weapon.MinorTrait",
    modifier: "is-minor"
  }),
  majorTrait: Object.freeze({
    category: "ASTRAEL.Weapon.PropertyMajor",
    title: "ASTRAEL.Weapon.MajorTrait",
    modifier: "is-major"
  })
});

function createWeaponDraft(item) {
  const system = item.system?.toObject?.() ?? item.system ?? {};
  return {
    name: String(item.name || ""),
    img: String(item.img || ""),
    system: {
      description: String(system.description || ""),
      damage: system.damage ?? 1,
      minorTrait: String(system.minorTrait || "").trim(),
      majorTrait: String(system.majorTrait || "").trim()
    }
  };
}

async function updateWeaponSheet(event, form, formData) {
  this._weaponEditMode = false;
  try {
    const result = await this.item.update(formData.object);
    this._weaponDraft = null;
    return result;
  } catch (error) {
    this._weaponEditMode = true;
    throw error;
  }
}

function prepareWeaponProperty(key, selectedId, invalid) {
  const presentation = PROPERTY_PRESENTATION[key];
  const catalog = PROPERTY_CATALOGS[key];
  const normalizedId = String(selectedId || "").trim();
  const entry = getWeaponCatalogEntry(catalog, normalizedId);
  const valueLabel = entry
    ? game.i18n.localize(entry.label)
    : normalizedId
      ? game.i18n.format("ASTRAEL.Weapon.UnknownOption", { id: normalizedId })
      : game.i18n.localize("ASTRAEL.Weapon.NotConfigured");
  const description = entry
    ? game.i18n.localize(entry.description)
    : game.i18n.localize("ASTRAEL.Weapon.RequiredField");

  return {
    key,
    inputName: `system.${key}`,
    category: game.i18n.localize(presentation.category),
    title: game.i18n.localize(presentation.title),
    value: normalizedId,
    valueLabel,
    description,
    modifier: presentation.modifier,
    invalid,
    configured: Boolean(normalizedId),
    options: catalog.map((option) => {
      const label = game.i18n.localize(option.label);
      const optionDescription = game.i18n.localize(option.description);
      return {
        id: option.id,
        label,
        description: optionDescription,
        searchText: `${label} ${optionDescription}`.toLocaleLowerCase(game.i18n.lang)
      };
    })
  };
}

class AstraelWeaponSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["astrael-rpg", "sheet", "item", "weapon-sheet"],
    position: {
      width: 500,
      height: 560
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: updateWeaponSheet
    },
    window: {
      title: "Astrael RPG Weapon",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: WEAPON_SHEET_TEMPLATE
    }
  };

  get title() {
    return `${game.i18n.localize("ASTRAEL.Weapon.Title")}: ${this.item.name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const canEdit = this.item.isOwner === true;
    const editing = canEdit && this._weaponEditMode === true;
    if (editing && !this._weaponDraft) this._weaponDraft = createWeaponDraft(this.item);
    const weapon = editing ? this._weaponDraft : createWeaponDraft(this.item);
    const validation = validateWeaponData(weapon.system);
    const invalidFields = new Set(validation.invalidFields);

    context.item = this.item;
    context.weapon = weapon;
    context.system = weapon.system;
    context.canEdit = canEdit;
    context.editing = editing;
    context.weaponValidation = {
      ...validation,
      damageInvalid: invalidFields.has("damage")
    };
    context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(weapon.system.description, {
      relativeTo: this.item,
      rollData: this.item.getRollData?.() ?? {},
      secrets: canEdit
    });
    context.weaponProperties = WEAPON_PROPERTY_KEYS.map((key) => prepareWeaponProperty(
      key,
      weapon.system[key],
      invalidFields.has(key)
    ));
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelector("[data-action='save-weapon']")?.addEventListener("click", this.#onSave.bind(this));
    this.element.querySelectorAll("[data-action='edit-weapon']").forEach((button) => {
      button.addEventListener("click", this.#onEdit.bind(this));
    });
    this.element.querySelector("[data-action='cancel-weapon-edit']")?.addEventListener("click", this.#onCancelEdit.bind(this));
    this.element.querySelectorAll("[data-action='remove-weapon-property']").forEach((button) => {
      button.addEventListener("click", this.#onRemoveProperty.bind(this));
    });
    this.element.querySelectorAll("[data-action='select-weapon-property']").forEach((button) => {
      button.addEventListener("click", this.#onSelectProperty.bind(this));
    });
    this.element.querySelectorAll("[data-action='search-weapon-property']").forEach((input) => {
      input.addEventListener("input", this.#onSearchProperty.bind(this));
      input.addEventListener("keydown", this.#onSearchPropertyKeydown.bind(this));
    });
    this.element.querySelectorAll("[data-weapon-draft-field]").forEach((field) => {
      field.addEventListener("input", this.#onDraftInput.bind(this));
    });
    this.element.querySelector("prose-mirror[name='system.description']")?.addEventListener("input", this.#onDescriptionInput.bind(this));

    if (this._weaponPropertyInputFocus) {
      const propertyKey = this._weaponPropertyInputFocus;
      this._weaponPropertyInputFocus = null;
      this.element.querySelector(`[data-action='search-weapon-property'][data-property='${propertyKey}']`)?.focus();
    } else if (this._weaponPropertyTagFocus) {
      const propertyKey = this._weaponPropertyTagFocus;
      this._weaponPropertyTagFocus = null;
      this.element.querySelector(`[data-weapon-property-tag='${propertyKey}']`)?.focus();
    }
  }

  async close(options) {
    this._weaponDraft = null;
    return super.close(options);
  }

  #syncDraftFromForm() {
    if (!this._weaponDraft) return;
    this.element.querySelectorAll("[data-weapon-draft-field]").forEach((field) => {
      this.#setDraftValue(field.dataset.weaponDraftField, field.value);
    });
    const descriptionEditor = this.element.querySelector("prose-mirror[name='system.description']");
    if (descriptionEditor) {
      descriptionEditor.save();
      this.#setDraftValue("description", descriptionEditor.value);
    }
  }

  #setDraftValue(field, value) {
    if (!this._weaponDraft) return;
    if (field === "name") this._weaponDraft.name = value;
    else if (field === "damage") this._weaponDraft.system.damage = value;
    else if (field === "description") this._weaponDraft.system.description = value;
  }

  #onDraftInput(event) {
    this.#setDraftValue(event.currentTarget.dataset.weaponDraftField, event.currentTarget.value);
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
    this._weaponDraft = createWeaponDraft(this.item);
    this._weaponEditMode = true;
    return this.render({ force: true });
  }

  #onCancelEdit(event) {
    event.preventDefault();
    this._weaponDraft = null;
    this._weaponEditMode = false;
    return this.render({ force: true });
  }

  #onRemoveProperty(event) {
    event.preventDefault();
    if (this.item.isOwner !== true || this._weaponEditMode !== true || !this._weaponDraft) return;
    this.#syncDraftFromForm();
    const propertyKey = event.currentTarget.dataset.property;
    if (!WEAPON_PROPERTY_KEYS.includes(propertyKey)) return;
    this._weaponDraft.system[propertyKey] = "";
    this._weaponPropertyInputFocus = propertyKey;
    return this.render({ force: true });
  }

  #onSelectProperty(event) {
    event.preventDefault();
    if (this.item.isOwner !== true || this._weaponEditMode !== true || !this._weaponDraft) return;
    this.#syncDraftFromForm();
    const propertyKey = event.currentTarget.dataset.property;
    const optionId = event.currentTarget.dataset.option;
    if (!WEAPON_PROPERTY_KEYS.includes(propertyKey)) return;
    if (!getWeaponCatalogEntry(PROPERTY_CATALOGS[propertyKey], optionId)) return;
    this._weaponDraft.system[propertyKey] = optionId;
    this._weaponPropertyTagFocus = propertyKey;
    return this.render({ force: true });
  }

  #onSearchProperty(event) {
    const selector = event.currentTarget.closest("[data-weapon-property-selector]");
    if (!selector) return;
    const query = event.currentTarget.value.trim().toLocaleLowerCase(game.i18n.lang);
    let visibleOptions = 0;
    selector.querySelectorAll("[data-weapon-property-option]").forEach((option) => {
      const hidden = Boolean(query && !option.dataset.searchText.includes(query));
      option.hidden = hidden;
      if (!hidden) visibleOptions += 1;
    });
    const empty = selector.querySelector("[data-weapon-property-filter-empty]");
    if (empty) empty.hidden = visibleOptions > 0;
  }

  #onSearchPropertyKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      return event.currentTarget.blur();
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    const selector = event.currentTarget.closest("[data-weapon-property-selector]");
    const firstOption = selector?.querySelector("[data-weapon-property-option]:not([hidden])");
    if (!firstOption) return;
    firstOption.click();
  }

}

export { AstraelWeaponSheet, createWeaponDraft };
