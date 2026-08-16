import { STRANGER_MARK_OPTIONS, STRANGER_MARKS_PANEL_TEMPLATE } from "../core/constants.js";
import { normalizeStrangerMark } from "../core/utilities.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class AstraelStrangerMarksPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "stranger-marks-panel"],
    position: {
      width: 330,
      height: 680
    },
    window: {
      title: "Marcas",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: STRANGER_MARKS_PANEL_TEMPLATE
    }
  };

  constructor(actor, ownerSheet, options = {}) {
    super(options);
    this.actor = actor;
    this.ownerSheet = ownerSheet;
  }

  get title() {
    return `${this.actor.name}: Marcas`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sm = this.#getStrangerMarkData();
    const sortedMarks = [...sm.marks].sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.label.localeCompare(b.label);
    });
    const selectedMarkId = sm.selectedMarkId && sm.marks.some(m => m.option === sm.selectedMarkId)
      ? sm.selectedMarkId
      : (sortedMarks[0]?.option || "");

    context.actor = this.actor;
    context.marks = STRANGER_MARK_OPTIONS.map((opt) => {
      const owned = sm.marks.find((m) => m.option === opt.id);
      return {
        ...opt,
        option: opt.id,
        level: owned ? owned.level : 0,
        owned: !!owned,
        selected: opt.id === selectedMarkId
      };
    });

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelectorAll("[data-action='select-stranger-mark']").forEach((button) => {
      button.addEventListener("click", this.#onSelectStrangerMark.bind(this));
    });
  }

  async close(options) {
    if (this.ownerSheet?._strangerMarksPanel === this) this.ownerSheet._strangerMarksPanel = null;
    return super.close(options);
  }

  anchorToSheet() {
    const sheetPosition = this.ownerSheet?.position;
    if (!sheetPosition) return;
    const width = 330;
    const left = Math.max(12, (sheetPosition.left || 0) - width - 8);
    const top = sheetPosition.top || 0;

    return this.setPosition({
      left,
      top,
      width,
      height: sheetPosition.height || 680
    });
  }

  #getStrangerMarkData() {
    const actorData = this.actor.toObject();
    const sm = actorData.system?.strangerMark ?? {};
    return {
      selectedMarkId: sm.selectedMarkId || "",
      selectedAbilityLevel: clampNumber(sm.selectedAbilityLevel ?? 1, 1, 5),
      marks: Array.isArray(sm.marks) ? sm.marks.map(normalizeStrangerMark) : []
    };
  }

  async #updateStrangerMark(data) {
    const current = this.#getStrangerMarkData();
    await this.actor.update({ "system.strangerMark": { ...current, ...data } });
    await this.ownerSheet?.render({ force: true });
    return this.render({ force: true });
  }

  async #onSelectStrangerMark(event) {
    event.preventDefault();
    const optionId = event.currentTarget.dataset.option;
    const sm = this.#getStrangerMarkData();
    const owned = sm.marks.some((m) => m.option === optionId);
    if (!owned) {
      sm.marks.push({ option: optionId, level: 0, abilities: [] });
    }
    return this.#updateStrangerMark({
      selectedMarkId: optionId,
      selectedAbilityLevel: 1,
      marks: sm.marks
    });
  }
}

export { AstraelStrangerMarksPanel };
