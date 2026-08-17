import { clampNumber, normalizeAdvantageLevel, prepareAdvantageEntry } from "../../core/utilities.js";

const buildLevels = (value) => Array.from({ length: 5 }, (_, index) => ({
  value: index + 1,
  filled: index < value,
  current: index + 1 === value
}));

class CharacteristicsController {
  constructor(host) {
    this.host = host;
    this.mode = "advantages";
    this.editor = null;
    this.removal = null;
    this.focusTarget = null;
    this.markerReturnFocus = null;
  }

  get hasOpenDock() {
    return Boolean(this.editor || this.removal);
  }

  prepareContext(context) {
    const lists = {
      advantages: this.#getList("advantages"),
      flaws: this.#getList("flaws")
    };
    const activeList = lists[this.mode]
      .map((entry, index) => ({
        ...prepareAdvantageEntry(entry),
        index,
        listId: this.mode,
        level: normalizeAdvantageLevel(entry),
        levels: buildLevels(normalizeAdvantageLevel(entry)),
        canManage: this.host.actor.isOwner,
        canAdjustLevel: this.host.actor.isOwner,
        canRoll: this.mode === "advantages"
      }))
      .sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang));
    context.characterCharacteristics = {
      activeList,
      advantagesActive: this.mode === "advantages",
      flawsActive: this.mode === "flaws",
      advantagesCount: lists.advantages.length,
      flawsCount: lists.flaws.length,
      isFlaw: this.mode === "flaws",
      canAdd: this.host.actor.isOwner,
      empty: activeList.length === 0
    };

    context.characterCharacteristicEditor = null;
    context.characterCharacteristicRemoval = null;

    if (this.editor) {
      context.characterCharacteristicEditor = {
        adding: this.editor.adding,
        listId: this.editor.listId,
        index: this.editor.index,
        name: this.editor.name,
        description: this.editor.description,
        level: normalizeAdvantageLevel(this.editor),
        levels: buildLevels(normalizeAdvantageLevel(this.editor)),
        isFlaw: this.editor.listId === "flaws",
        typeLabel: this.#typeLabel(this.editor.listId)
      };
    }

    if (this.removal) {
      const source = lists[this.removal.listId]?.[this.removal.index];
      if (!source) this.removal = null;
      else {
        context.characterCharacteristicRemoval = {
          listId: this.removal.listId,
          index: this.removal.index,
          name: String(source.name || ""),
          typeLabel: this.#typeLabel(this.removal.listId)
        };
      }
    }
  }

  activateListeners(root) {
    const actions = {
      "set-characteristic-mode": this.#onSetMode,
      "add-characteristic": this.#onAdd,
      "edit-characteristic": this.#onEdit,
      "set-characteristic-level": this.#onSetLevel,
      "set-characteristic-editor-level": this.#onSetEditorLevel,
      "save-characteristic": this.#onSave,
      "close-characteristic-editor": this.#onCloseEditor,
      "request-remove-characteristic": this.#onRequestRemove,
      "cancel-characteristic-removal": this.#onBackRemove,
      "back-remove-characteristic": this.#onBackRemove,
      "confirm-remove-characteristic": this.#onConfirmRemove
    };
    for (const [action, handler] of Object.entries(actions)) {
      root.querySelectorAll(`[data-action='${action}']`).forEach((element) => {
        element.addEventListener("click", handler.bind(this));
      });
    }
  }

  restoreFocus(root) {
    if (!this.focusTarget && !this.markerReturnFocus) return false;
    let selector = null;
    if (this.markerReturnFocus) {
      const { listId, index, level } = this.markerReturnFocus;
      this.markerReturnFocus = null;
      selector = `[data-action='set-characteristic-level'][data-list='${listId}'][data-index='${index}'][data-level='${level}']`;
    } else if (typeof this.focusTarget === "object") {
      const { listId, index } = this.focusTarget;
      selector = `[data-action='edit-characteristic'][data-list='${listId}'][data-index='${index}']`;
    } else if (this.focusTarget === "name") {
      selector = "[data-action='characteristic-name']";
    } else if (this.focusTarget === "add") {
      selector = "[data-action='add-characteristic']";
    } else if (this.focusTarget === "cancel") {
      selector = "[data-action='cancel-characteristic-removal']";
    }
    this.focusTarget = null;
    root.querySelector(selector)?.focus();
    return true;
  }

  handleEscape(event) {
    if (this.removal) {
      event?.preventDefault();
      event?.stopPropagation();
      this.#onBackRemove();
      return true;
    }
    if (this.editor) {
      event?.preventDefault();
      event?.stopPropagation();
      this.#onCloseEditor();
      return true;
    }
    return false;
  }

  close() {
    this.editor = null;
    this.removal = null;
    this.focusTarget = null;
    this.markerReturnFocus = null;
  }

  #typeLabel(listId) {
    return game.i18n.localize(listId === "flaws"
      ? "ASTRAEL.CharacterCharacteristics.Flaw"
      : "ASTRAEL.CharacterCharacteristics.Advantage");
  }

  #getList(listId) {
    const actorData = this.host.actor.toObject();
    return foundry.utils.deepClone(Array.isArray(actorData.system?.[listId]) ? actorData.system[listId] : []);
  }

  #clearSkillEditors() {
    this.host._characterSkillPicker = null;
    this.host._characterSkillPickerNeedsInitialFocus = false;
    this.host._characterSkillRemoval = null;
    this.host._characterSkillRemovalNeedsInitialFocus = false;
    this.host._characterSpecialtySkillKey = null;
    this.host._characterSpecialtyAdding = false;
    this.host._characterSpecialtyRemoval = null;
    this.host._characterSpecialtyRemovalNeedsInitialFocus = false;
    this.host._characterSpecialtyFocus = null;
    this.host._characterSpecialtyReturnFocus = null;
    this.host._characterSkillReturnFocus = null;
    this.host._characterSkillMarkerReturnFocus = null;
  }

  #openFeature() {
    this.host.featureCoordinator.open(this);
    this.#clearSkillEditors();
    this.markerReturnFocus = null;
  }

  #onSetMode(event) {
    event.preventDefault();
    if (this.hasOpenDock) return;
    this.mode = event.currentTarget.dataset.list === "flaws" ? "flaws" : "advantages";
    return this.host.render({ force: true });
  }

  #onAdd(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || this.hasOpenDock) return;
    this.#openFeature();
    this.editor = { adding: true, listId: this.mode, index: -1, name: "", description: "", level: 1 };
    this.focusTarget = "name";
    return this.host.render({ force: true });
  }

  #onEdit(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || this.hasOpenDock) return;
    const listId = event.currentTarget.dataset.list === "flaws" ? "flaws" : "advantages";
    const index = Number(event.currentTarget.dataset.index);
    const entry = this.#getList(listId)[index];
    if (!entry) return;
    this.#openFeature();
    this.editor = {
      adding: false,
      listId,
      index,
      name: String(entry.name || ""),
      description: String(entry.description || entry.details || ""),
      level: normalizeAdvantageLevel(entry)
    };
    this.focusTarget = "name";
    return this.host.render({ force: true });
  }

  #syncDraft() {
    if (!this.editor) return;
    const name = this.host.element.querySelector("[data-action='characteristic-name']");
    const description = this.host.element.querySelector("[data-action='characteristic-description']");
    if (name) this.editor.name = name.value;
    if (description) this.editor.description = description.value;
  }

  #onSetEditorLevel(event) {
    event.preventDefault();
    if (!this.editor) return;
    this.#syncDraft();
    this.editor.level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    const levelEditor = event.currentTarget.closest(".astrael-character-characteristic-level-editor");
    if (!levelEditor) return;
    const level = this.editor.level;
    levelEditor.querySelectorAll("[data-action='set-characteristic-editor-level']").forEach((dot) => {
      const dotLevel = clampNumber(dot.dataset.level, 1, 5);
      dot.classList.toggle("is-filled", dotLevel <= level);
      dot.classList.toggle("is-current", dotLevel === level);
    });
    const value = levelEditor.querySelector(".astrael-character-characteristic-level-editor-value");
    if (value) value.textContent = `${game.i18n.localize("ASTRAEL.CharacterAttributes.Level")} ${level}`;
  }

  #onSetLevel(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || this.hasOpenDock) return;
    const listId = event.currentTarget.dataset.list === "flaws" ? "flaws" : "advantages";
    const index = Number(event.currentTarget.dataset.index);
    const level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    if (!Number.isInteger(index)) return;
    const list = this.#getList(listId);
    const entry = list[index];
    if (!entry || normalizeAdvantageLevel(entry) === level) return;
    list[index] = { ...entry, level };
    this.markerReturnFocus = { listId, index, level };
    return this.host.actor.update({ [`system.${listId}`]: list });
  }

  async #onSave(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || !this.editor) return;
    this.#syncDraft();
    const editor = this.editor;
    const name = editor.name.trim();
    if (!name) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.CharacterCharacteristics.NameRequired"));
      this.host.element.querySelector("[data-action='characteristic-name']")?.focus();
      return;
    }
    const list = this.#getList(editor.listId);
    const entry = {
      ...(editor.adding ? {} : list[editor.index]),
      name,
      description: editor.description.trim(),
      level: clampNumber(editor.level, 1, 5),
      editing: false
    };
    let index = editor.index;
    if (editor.adding) {
      list.push(entry);
      index = list.length - 1;
    } else if (list[index]) list[index] = entry;
    else return;
    this.editor = null;
    this.focusTarget = { listId: editor.listId, index };
    return this.host.actor.update({ [`system.${editor.listId}`]: list });
  }

  #onCloseEditor(event) {
    event?.preventDefault();
    if (!this.editor) return;
    if (this.editor.adding) {
      this.editor = null;
      this.focusTarget = "add";
    } else {
      const target = this.editor;
      this.editor = null;
      this.focusTarget = { listId: target.listId, index: target.index };
    }
    return this.host.render({ force: true });
  }

  #onRequestRemove(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner) return;
    const listId = event.currentTarget.dataset.list === "flaws" ? "flaws" : "advantages";
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || !this.#getList(listId)[index]) return;
    this.#openFeature();
    this.removal = { listId, index };
    this.focusTarget = "cancel";
    return this.host.render({ force: true });
  }

  #onBackRemove(event) {
    event?.preventDefault();
    if (!this.removal) return;
    const target = this.removal;
    this.removal = null;
    this.focusTarget = { listId: target.listId, index: target.index };
    return this.host.render({ force: true });
  }

  async #onConfirmRemove(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || !this.removal) return;
    const { listId, index } = this.removal;
    const list = this.#getList(listId);
    if (!list[index]) return;
    list.splice(index, 1);
    this.removal = null;
    this.focusTarget = "add";
    return this.host.actor.update({ [`system.${listId}`]: list });
  }
}

export { CharacteristicsController };