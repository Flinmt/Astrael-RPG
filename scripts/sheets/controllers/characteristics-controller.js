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
    this.dock = null;
    this.focusTarget = null;
  }

  get hasOpenDock() {
    return Boolean(this.dock);
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
        levels: buildLevels(normalizeAdvantageLevel(entry)),
        selected: this.dock?.listId === this.mode && this.dock.index === index
      }))
      .sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang));
    const locked = Boolean(this.dock && this.dock.mode !== "view");
    context.characterCharacteristics = {
      activeList,
      advantagesActive: this.mode === "advantages",
      flawsActive: this.mode === "flaws",
      advantagesCount: lists.advantages.length,
      flawsCount: lists.flaws.length,
      isFlaw: this.mode === "flaws",
      locked,
      canManage: this.host.actor.isOwner,
      canAdd: this.host.actor.isOwner && !locked,
      empty: activeList.length === 0
    };

    if (!this.dock) {
      context.characterCharacteristicDock = null;
      return;
    }
    const source = this.dock.adding ? this.dock : lists[this.dock.listId]?.[this.dock.index];
    if (!source) {
      this.dock = null;
      context.characterCharacteristicDock = null;
      return;
    }
    const level = normalizeAdvantageLevel(this.dock.mode === "edit" ? this.dock : source);
    context.characterCharacteristicDock = {
      ...this.dock,
      name: this.dock.mode === "edit" ? this.dock.name : String(source.name || ""),
      description: this.dock.mode === "edit" ? this.dock.description : String(source.description || source.details || ""),
      level,
      levels: buildLevels(level),
      isView: this.dock.mode === "view",
      isEdit: this.dock.mode === "edit",
      isRemove: this.dock.mode === "remove",
      isFlaw: this.dock.listId === "flaws",
      canManage: this.host.actor.isOwner,
      canRoll: this.dock.listId === "advantages" && this.dock.mode === "view",
      typeLabel: game.i18n.localize(this.dock.listId === "flaws"
        ? "ASTRAEL.CharacterCharacteristics.Flaw"
        : "ASTRAEL.CharacterCharacteristics.Advantage")
    };
  }

  activateListeners(root) {
    const actions = {
      "set-characteristic-mode": this.#onSetMode,
      "add-characteristic": this.#onAdd,
      "select-characteristic": this.#onSelect,
      "edit-characteristic": this.#onEdit,
      "set-characteristic-level": this.#onSetLevel,
      "save-characteristic": this.#onSave,
      "close-characteristic": this.#onClose,
      "request-remove-characteristic": this.#onRequestRemove,
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
    if (!this.focusTarget) return false;
    const selector = this.focusTarget === "name"
      ? "[data-action='characteristic-name']"
      : this.focusTarget === "add"
        ? "[data-action='add-characteristic']"
        : `[data-action='select-characteristic'][data-list='${this.mode}'][data-index='${this.focusTarget}']`;
    this.focusTarget = null;
    root.querySelector(selector)?.focus();
    return true;
  }

  handleEscape(event) {
    if (!this.dock) return false;
    event?.preventDefault();
    event?.stopPropagation();
    if (this.dock.mode === "remove") this.dock.mode = "view";
    else {
      const dock = this.dock;
      this.dock = null;
      this.focusTarget = dock.adding ? "add" : String(dock.index);
    }
    this.host.render({ force: true });
    return true;
  }

  close() {
    this.dock = null;
    this.focusTarget = null;
  }

  #getList(listId) {
    const actorData = this.host.actor.toObject();
    return foundry.utils.deepClone(Array.isArray(actorData.system?.[listId]) ? actorData.system[listId] : []);
  }

  #clearSkillEditors() {
    this.host._characterSkillEditor = null;
    this.host._characterSpecialtySkillKey = null;
    this.host._characterSpecialtyAdding = false;
    this.host._characterSkillReturnFocus = null;
    this.host._characterSkillNeedsInitialFocus = false;
  }

  #onSetMode(event) {
    event.preventDefault();
    if (this.dock && this.dock.mode !== "view") return;
    this.mode = event.currentTarget.dataset.list === "flaws" ? "flaws" : "advantages";
    this.dock = null;
    return this.host.render({ force: true });
  }

  #onAdd(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || (this.dock && this.dock.mode !== "view")) return;
    this.host.featureCoordinator.open(this);
    this.#clearSkillEditors();
    this.dock = { mode: "edit", adding: true, listId: this.mode, index: -1, name: "", description: "", level: 1 };
    this.focusTarget = "name";
    return this.host.render({ force: true });
  }

  #onSelect(event) {
    event.preventDefault();
    if (this.dock && this.dock.mode !== "view") return;
    this.host.featureCoordinator.open(this);
    this.#clearSkillEditors();
    const listId = event.currentTarget.dataset.list === "flaws" ? "flaws" : "advantages";
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || !this.#getList(listId)[index]) return;
    const closing = this.dock?.mode === "view" && this.dock.listId === listId && this.dock.index === index;
    this.dock = closing ? null : { mode: "view", adding: false, listId, index };
    this.focusTarget = closing ? null : String(index);
    return this.host.render({ force: true });
  }

  #onEdit(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || this.dock?.mode !== "view") return;
    const entry = this.#getList(this.dock.listId)[this.dock.index];
    if (!entry) return;
    this.dock = {
      mode: "edit",
      adding: false,
      listId: this.dock.listId,
      index: this.dock.index,
      name: String(entry.name || ""),
      description: String(entry.description || entry.details || ""),
      level: normalizeAdvantageLevel(entry)
    };
    this.focusTarget = "name";
    return this.host.render({ force: true });
  }

  #syncDraft() {
    if (this.dock?.mode !== "edit") return;
    const name = this.host.element.querySelector("[data-action='characteristic-name']");
    const description = this.host.element.querySelector("[data-action='characteristic-description']");
    if (name) this.dock.name = name.value;
    if (description) this.dock.description = description.value;
  }

  #onSetLevel(event) {
    event.preventDefault();
    if (this.dock?.mode !== "edit") return;
    this.#syncDraft();
    this.dock.level = clampNumber(event.currentTarget.dataset.level, 1, 5);
    return this.host.render({ force: true });
  }

  async #onSave(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || this.dock?.mode !== "edit") return;
    this.#syncDraft();
    const dock = this.dock;
    const name = dock.name.trim();
    if (!name) {
      ui.notifications.warn(game.i18n.localize("ASTRAEL.CharacterCharacteristics.NameRequired"));
      this.host.element.querySelector("[data-action='characteristic-name']")?.focus();
      return;
    }
    const list = this.#getList(dock.listId);
    const entry = {
      ...(dock.adding ? {} : list[dock.index]),
      name,
      description: dock.description.trim(),
      level: clampNumber(dock.level, 1, 5),
      editing: false
    };
    let index = dock.index;
    if (dock.adding) {
      list.push(entry);
      index = list.length - 1;
    } else if (list[index]) list[index] = entry;
    else return;
    this.dock = { mode: "view", adding: false, listId: dock.listId, index };
    this.focusTarget = String(index);
    return this.host.actor.update({ [`system.${dock.listId}`]: list });
  }

  #onClose(event) {
    event?.preventDefault();
    if (!this.dock) return;
    const dock = this.dock;
    this.dock = null;
    this.focusTarget = dock.adding ? "add" : String(dock.index);
    return this.host.render({ force: true });
  }

  #onRequestRemove(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || this.dock?.mode !== "view") return;
    this.dock.mode = "remove";
    return this.host.render({ force: true });
  }

  #onBackRemove(event) {
    event?.preventDefault();
    if (this.dock?.mode !== "remove") return;
    this.dock.mode = "view";
    return this.host.render({ force: true });
  }

  async #onConfirmRemove(event) {
    event.preventDefault();
    if (!this.host.actor.isOwner || this.dock?.mode !== "remove") return;
    const { listId, index } = this.dock;
    const list = this.#getList(listId);
    if (!list[index]) return;
    list.splice(index, 1);
    this.dock = null;
    this.focusTarget = "add";
    return this.host.actor.update({ [`system.${listId}`]: list });
  }
}

export { CharacteristicsController };
