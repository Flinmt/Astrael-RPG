import { CONVICTION_CARD_COUNT } from "../../core/constants.js";
import { buildFractureBoxes, clampNumber, normalizeConviction, normalizeConvictionList } from "../../core/utilities.js";

class ConvictionsController {
  constructor(host) {
    this.host = host;
    this.dock = null;
    this.focusTarget = null;
  }

  get hasOpenDock() {
    return Boolean(this.dock);
  }

  prepareContext(context) {
    context.system.convictions = normalizeConvictionList(
      Array.isArray(context.system.convictions) ? context.system.convictions : []
    );
    const selectedIndex = Number.isInteger(this.dock?.index)
      && this.dock.index >= 0
      && this.dock.index < CONVICTION_CARD_COUNT
      ? this.dock.index
      : null;
    const prepareEntry = (conviction, index) => ({
      ...conviction,
      index,
      number: index + 1,
      nameLabel: conviction.name || game.i18n.localize("ASTRAEL.Convictions.EmptyName"),
      descriptionLabel: conviction.description || game.i18n.localize("ASTRAEL.Convictions.EmptyDescription"),
      pillarNameLabel: conviction.pillar.name || game.i18n.localize("ASTRAEL.Convictions.EmptyPillarName"),
      filled: Boolean(conviction.name || conviction.description || conviction.pillar.name || conviction.pillar.description),
      fractureBoxes: buildFractureBoxes(conviction.fractures),
      fractureClass: `is-fractured-${conviction.fractures}`,
      selected: index === selectedIndex
    });

    context.characterConvictions = context.system.convictions.map(prepareEntry);
    context.characterConvictionView = {
      canEdit: this.host.actor.isOwner,
      completed: context.characterConvictions.filter((conviction) => conviction.filled).length,
      selectedIndex
    };
    if (selectedIndex === null) {
      this.dock = null;
      context.characterConvictionDock = null;
      return;
    }

    const source = context.system.convictions[selectedIndex];
    const displaySource = this.dock.mode === "edit" ? normalizeConviction(this.dock) : source;
    context.characterConvictionDock = {
      ...prepareEntry(displaySource, selectedIndex),
      mode: this.dock.mode,
      isView: this.dock.mode === "view",
      isEdit: this.dock.mode === "edit",
      dirty: this.dock.mode === "edit"
        && JSON.stringify(displaySource) !== JSON.stringify(normalizeConviction(this.dock.original)),
      canManage: this.host.actor.isOwner
    };
  }

  activateListeners(root) {
    root.querySelectorAll(".astrael-conviction-fracture").forEach((button) => {
      button.addEventListener("click", this.#onOverviewFracture.bind(this));
    });
    root.querySelectorAll("[data-action='inspect-conviction']").forEach((button) => {
      button.addEventListener("click", this.#onInspect.bind(this));
    });
    root.querySelectorAll("[data-action='save-conviction']").forEach((button) => {
      button.addEventListener("click", this.#onSave.bind(this));
    });
    root.querySelectorAll("[data-action='cancel-conviction']").forEach((button) => {
      button.addEventListener("click", this.#onCancel.bind(this));
    });
    root.querySelectorAll("[data-conviction-field]").forEach((field) => {
      field.addEventListener("input", this.#onDraftInput.bind(this));
    });
    root.querySelectorAll("[data-action='set-conviction-draft-fractures']").forEach((button) => {
      button.addEventListener("click", this.#onDraftFracture.bind(this));
    });
  }

  restoreFocus(root) {
    if (!this.focusTarget) return false;
    const selector = this.focusTarget === "name"
      ? "[data-conviction-field='name']"
      : this.focusTarget === "close"
        ? "[data-action='cancel-conviction']"
        : `[data-action='inspect-conviction'][data-index='${this.focusTarget}']`;
    this.focusTarget = null;
    root.querySelector(selector)?.focus();
    return true;
  }

  handleEscape(event) {
    if (!this.dock) return false;
    event?.preventDefault();
    event?.stopPropagation();
    const index = this.dock.index;
    this.dock = null;
    this.focusTarget = String(index);
    this.host.render({ force: true });
    return true;
  }

  close() {
    this.dock = null;
    this.focusTarget = null;
  }

  #getEntries() {
    const actorData = this.host.actor.toObject();
    return normalizeConvictionList(Array.isArray(actorData.system?.convictions) ? actorData.system.convictions : []);
  }

  #captureDraft() {
    const index = this.dock?.index;
    if (this.dock?.mode !== "edit" || !Number.isInteger(index)) return null;
    const stored = this.#getEntries()[index];
    if (!stored) return null;
    const readField = (field, fallback) => this.host.element
      ?.querySelector(`[data-conviction-field='${field}']`)
      ?.value ?? fallback;
    return normalizeConviction({
      name: readField("name", this.dock.name ?? stored.name).trim(),
      description: readField("description", this.dock.description ?? stored.description).trim(),
      fractures: this.dock.fractures ?? stored.fractures,
      pillar: {
        name: readField("pillar-name", this.dock.pillar?.name ?? stored.pillar.name).trim(),
        description: readField("pillar-description", this.dock.pillar?.description ?? stored.pillar.description).trim()
      }
    });
  }

  #isDirty() {
    return this.dock?.mode === "edit"
      && JSON.stringify(normalizeConviction(this.dock)) !== JSON.stringify(normalizeConviction(this.dock.original));
  }

  #refreshDirtyState() {
    const element = this.host.element?.querySelector(".astrael-conviction-dock");
    if (!element) return;
    const dirty = this.#isDirty();
    element.classList.toggle("is-dirty", dirty);
    element.querySelector("[data-conviction-dirty]")?.toggleAttribute("hidden", !dirty);
    const save = element.querySelector("[data-action='save-conviction']");
    if (save) save.disabled = !dirty;
  }

  #update(entries) {
    return this.host.actor.update({ "system.convictions": normalizeConvictionList(entries) });
  }

  #onOverviewFracture(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.host.actor.isOwner) return;
    const entries = this.#getEntries();
    const index = Number(event.currentTarget.dataset.convictionIndex);
    const value = clampNumber(Number(event.currentTarget.dataset.value), 0, 2);
    if (!Number.isInteger(index) || !entries[index]) return;
    entries[index].fractures = entries[index].fractures === value ? 0 : value;
    return this.#update(entries);
  }

  #onInspect(event) {
    event.preventDefault();
    this.host.featureCoordinator.open(this);
    const index = Number(event.currentTarget.dataset.index);
    const entries = this.#getEntries();
    if (!Number.isInteger(index) || !entries[index] || this.dock?.mode === "edit") return;
    if (this.dock?.mode === "view" && this.dock.index === index) {
      this.dock = null;
      this.focusTarget = String(index);
    } else if (this.host.actor.isOwner) {
      const original = foundry.utils.deepClone(entries[index]);
      this.dock = { mode: "edit", index, ...foundry.utils.deepClone(original), original };
      this.focusTarget = "name";
    } else {
      this.dock = { mode: "view", index };
      this.focusTarget = "close";
    }
    return this.host.render({ force: true });
  }

  #onDraftInput(event) {
    if (this.dock?.mode !== "edit") return;
    const field = event.currentTarget.dataset.convictionField;
    const value = event.currentTarget.value;
    if (field === "name") this.dock.name = value;
    else if (field === "description") this.dock.description = value;
    else if (field === "pillar-name") this.dock.pillar.name = value;
    else if (field === "pillar-description") this.dock.pillar.description = value;
    else return;
    if (field === "name") {
      const heading = this.host.element.querySelector(".astrael-conviction-editor-head strong");
      if (heading) heading.textContent = value.trim() || game.i18n.localize("ASTRAEL.Convictions.EmptyName");
    }
    this.#refreshDirtyState();
  }

  #onDraftFracture(event) {
    event.preventDefault();
    if (this.dock?.mode !== "edit" || !this.host.actor.isOwner) return;
    const value = clampNumber(Number(event.currentTarget.dataset.value), 0, 2);
    this.dock.fractures = this.dock.fractures === value ? 0 : value;
    const controls = event.currentTarget.closest(".astrael-conviction-editor-fractures");
    controls?.querySelectorAll("[data-action='set-conviction-draft-fractures']").forEach((button) => {
      const filled = Number(button.dataset.value) <= this.dock.fractures;
      button.classList.toggle("is-filled", filled);
      button.setAttribute("aria-pressed", filled ? "true" : "false");
    });
    const count = controls?.querySelector("[data-conviction-fracture-count]");
    if (count) count.textContent = `${this.dock.fractures}/2`;
    this.#refreshDirtyState();
  }

  async #onSave(event) {
    event.preventDefault();
    const index = this.dock?.index;
    const entries = this.#getEntries();
    if (!this.host.actor.isOwner || this.dock?.mode !== "edit" || !entries[index]) return;
    entries[index] = this.#captureDraft() ?? entries[index];
    this.dock = null;
    this.focusTarget = String(index);
    return this.#update(entries);
  }

  #onCancel(event) {
    event?.preventDefault();
    if (!this.dock) return;
    const index = this.dock.index;
    this.dock = null;
    this.focusTarget = String(index);
    return this.host.render({ force: true });
  }
}

export { ConvictionsController };
