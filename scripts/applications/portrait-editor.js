import { CHARACTER_PORTRAIT_EDITOR_TEMPLATE, SYSTEM_ID } from "../core/constants.js";
import { clampNumber, getCharacterPortraitFraming, prepareCharacterPortraitPresentation } from "../core/utilities.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class AstraelCharacterPortraitEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "character-portrait-editor"],
    position: {
      width: 400,
      height: 520
    },
    window: {
      title: "Portrait Framing",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: CHARACTER_PORTRAIT_EDITOR_TEMPLATE
    }
  };

  constructor(actor, ownerSheet, options = {}) {
    super(options);
    this.actor = actor;
    this.ownerSheet = ownerSheet;
    this.framing = getCharacterPortraitFraming(actor);
    this.dragState = null;
  }

  get title() {
    return `${this.actor.name}: ${game.i18n.localize("ASTRAEL.CharacterPortrait.Title")}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.framing = {
      ...prepareCharacterPortraitPresentation(this.framing),
      zoomLabel: this.framing.zoom.toFixed(2)
    };
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const preview = this.element.querySelector("[data-portrait-preview]");
    preview?.addEventListener("pointerdown", this.#onPointerDown.bind(this));
    preview?.addEventListener("pointermove", this.#onPointerMove.bind(this));
    preview?.addEventListener("pointerup", this.#onPointerEnd.bind(this));
    preview?.addEventListener("pointercancel", this.#onPointerEnd.bind(this));
    this.element.querySelector("[data-action='change-character-portrait-image']")?.addEventListener("click", this.#onChangeImage.bind(this));
    this.element.querySelector("[data-action='reset-character-portrait']")?.addEventListener("click", this.#onReset.bind(this));
    this.element.querySelector("[data-action='cancel-character-portrait']")?.addEventListener("click", () => this.close());
    this.element.querySelector("[data-action='save-character-portrait']")?.addEventListener("click", this.#onSave.bind(this));
    this.element.querySelector("[data-action='set-character-portrait-zoom']")?.addEventListener("input", this.#onZoomInput.bind(this));
  }

  async close(options) {
    if (this.ownerSheet?._characterPortraitEditor === this) this.ownerSheet._characterPortraitEditor = null;
    const result = await super.close(options);
    this.ownerSheet?.element?.querySelector("[data-action='edit-character-portrait']")?.focus();
    return result;
  }

  #refreshPreview() {
    const image = this.element.querySelector("[data-portrait-preview] img");
    if (image) {
      const presentation = prepareCharacterPortraitPresentation(this.framing);
      image.style.objectPosition = `${this.framing.x}% ${this.framing.y}%`;
      image.style.transform = `scale(${presentation.zoom}) translate(${presentation.panX}%, ${presentation.panY}%)`;
    }
    const zoomLabel = this.element.querySelector("[data-portrait-zoom-label]");
    if (zoomLabel) zoomLabel.textContent = `${this.framing.zoom.toFixed(2)}×`;
  }

  #onPointerDown(event) {
    if (event.button !== 0) return;
    const preview = event.currentTarget;
    preview.setPointerCapture(event.pointerId);
    preview.classList.add("is-dragging");
    this.dragState = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: this.framing.x,
      y: this.framing.y
    };
  }

  #onPointerMove(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    this.framing.x = clampNumber(this.dragState.x - ((event.clientX - this.dragState.clientX) / rect.width) * 100, 0, 100);
    this.framing.y = clampNumber(this.dragState.y - ((event.clientY - this.dragState.clientY) / rect.height) * 100, 0, 100);
    this.#refreshPreview();
  }

  #onPointerEnd(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    event.currentTarget.classList.remove("is-dragging");
    this.dragState = null;
  }

  #onZoomInput(event) {
    this.framing.zoom = clampNumber(event.currentTarget.value, 1, 3);
    this.#refreshPreview();
  }

  #onChangeImage(event) {
    event.preventDefault();
    const picker = new FilePicker({
      type: "image",
      current: this.framing.src,
      callback: (path) => {
        this.framing = { src: path, x: 50, y: 50, zoom: 1 };
        return this.render({ force: true });
      }
    });
    return picker.browse();
  }

  #onReset(event) {
    event.preventDefault();
    this.framing = { ...this.framing, x: 50, y: 50, zoom: 1 };
    return this.render({ force: true });
  }

  async #onSave(event) {
    event.preventDefault();
    const framing = {
      src: this.framing.src,
      x: this.framing.x,
      y: this.framing.y,
      zoom: this.framing.zoom
    };
    await this.actor.update({
      img: framing.src,
      [`flags.${SYSTEM_ID}.compactPortrait`]: framing
    });
    return this.close();
  }
}

export { AstraelCharacterPortraitEditor };
