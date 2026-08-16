import { LOCALIZE_SKILL, SKILL_KEYS, SPECIALTIES_PANEL_TEMPLATE } from "../core/constants.js";
import { clampNumber, escapeHtml } from "../core/utilities.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class AstraelSpecialtiesPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "specialties-panel"],
    position: {
      width: 380,
      height: 680
    },
    window: {
      title: "Especialidades",
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: SPECIALTIES_PANEL_TEMPLATE
    }
  };

  constructor(actor, ownerSheet, options = {}) {
    super(options);
    this.actor = actor;
    this.ownerSheet = ownerSheet;
  }

  get title() {
    return `${this.actor.name}: Especialidades`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actorData = this.actor.toObject();
    const specialties = Array.isArray(actorData.system?.specialties) ? actorData.system.specialties : [];

    context.actor = this.actor;
    context.specialties = specialties.map((spec, index) => this.#prepareSpecialty(spec, index));

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelector("[data-action='add-specialty-row']")?.addEventListener("click", this.#onAddSpecialty.bind(this));
    this.element.querySelectorAll("[data-action='edit-specialty-row']").forEach((button) => {
      button.addEventListener("click", this.#onEditSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='delete-specialty-row']").forEach((button) => {
      button.addEventListener("click", this.#onDeleteSpecialty.bind(this));
    });
    this.element.querySelectorAll("[data-action='shift-specialty-level']").forEach((button) => {
      button.addEventListener("click", this.#onSpecialtyLevelClick.bind(this));
      button.addEventListener("contextmenu", this.#onSpecialtyLevelContext.bind(this));
    });
  }

  async close(options) {
    if (this.ownerSheet?._specialtiesPanel === this) this.ownerSheet._specialtiesPanel = null;
    return super.close(options);
  }

  anchorToSheet() {
    const sheetPosition = this.ownerSheet?.position;
    if (!sheetPosition) return;
    const top = sheetPosition.top || 0;
    const width = 380;
    const rightLeft = (sheetPosition.left || 0) + (sheetPosition.width || 900) + 8;
    const left = rightLeft + width > window.innerWidth - 12
      ? Math.max(12, (sheetPosition.left || 0) - width - 8)
      : rightLeft;

    return this.setPosition({
      left,
      top,
      width,
      height: sheetPosition.height || 680
    });
  }

  #prepareSpecialty(spec = {}, index) {
    const skill = spec.skill || "";
    return {
      index,
      skill,
      description: spec.description || "",
      level: normalizeAdvantageLevel(spec),
      levelRoman: toRomanLevel(normalizeAdvantageLevel(spec)),
      skillLabel: LOCALIZE_SKILL[skill] ? game.i18n.localize(LOCALIZE_SKILL[skill]) : "Perícia"
    };
  }

  #getSkillOptions(selected = "") {
    return SKILL_KEYS
      .filter(key => (foundry.utils.getProperty(this.actor.system, `skills.${key}.value`) || 0) > 0 || key === selected)
      .map(key => ({
        key,
        label: game.i18n.localize(LOCALIZE_SKILL[key]),
        selected: key === selected
      }));
  }

  #getSpecialties() {
    const actorData = this.actor.toObject();
    return Array.isArray(actorData.system?.specialties) ? [...actorData.system.specialties] : [];
  }

  #onAddSpecialty(event) {
    event.preventDefault();
    return this.#openSpecialtyDialog();
  }

  #onEditSpecialty(event) {
    event.preventDefault();
    return this.#openSpecialtyDialog(Number(event.currentTarget.dataset.index));
  }

  async #onDeleteSpecialty(event) {
    event.preventDefault();
    const row = event.currentTarget.closest(".specialties-panel-row");
    if (!row) return;

    const index = Number(row.dataset.index);
    if (index < 0) return;

    const specialties = this.#getSpecialties();
    specialties.splice(index, 1);
    await this.actor.update({ "system.specialties": specialties });
    return this.render({ force: true });
  }

  #openSpecialtyDialog(index = -1) {
    const specialties = this.#getSpecialties();
    const current = index >= 0 && specialties[index] ? specialties[index] : { skill: "", description: "", level: 1 };
    const skillOptions = this.#getSkillOptions(current.skill).map(option => (
      `<option value="${option.key}" ${option.selected ? "selected" : ""}>${escapeHtml(option.label)}</option>`
    )).join("");
    const level = normalizeAdvantageLevel(current);
    const title = index >= 0 ? "Editar Especialidade" : "Nova Especialidade";

    return new Dialog({
      title,
      content: `
        <form class="astrael-dialog-form specialty-edit-dialog">
          <header class="specialty-edit-hero">
            <div class="specialty-edit-icon" aria-hidden="true"></div>
            <div>
              <span>Registro tatico</span>
              <h3>${title}</h3>
            </div>
          </header>
          <div class="specialty-edit-grid">
            <div class="specialty-edit-field specialty-level-field">
              <span>Nível</span>
              <button type="button" class="specialty-dialog-rank" data-level="${level}" aria-label="Nível ${level}">${toRomanLevel(level)}</button>
              <input type="hidden" name="level" value="${level}">
            </div>
            <label class="specialty-edit-field specialty-skill-field">
              <span>Perícia</span>
              <select name="skill">${skillOptions || '<option value="">Nenhuma perícia com pontos</option>'}</select>
            </label>
          </div>
          <label class="specialty-edit-field specialty-definition-field">
            <span>Definição</span>
            <input type="text" name="description" value="${escapeHtml(current.description || "")}" placeholder="Ex: Cenas de crime, Duelos...">
          </label>
        </form>
      `,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: "Salvar",
          callback: async (html) => {
            const skill = html.find("[name='skill']").val();
            if (!skill) {
              ui.notifications.warn("Selecione uma perícia.");
              return false;
            }

            const next = {
              skill,
              description: html.find("[name='description']").val()?.trim() || "",
              level: normalizeAdvantageLevel({ level: html.find("[name='level']").val() })
            };
            const list = this.#getSpecialties();
            if (index >= 0 && list[index]) list[index] = next;
            else list.push(next);
            await this.actor.update({ "system.specialties": list });
            return this.render({ force: true });
          }
        }
      },
      default: "save",
      render: (html) => {
        const updateLevel = (button, delta) => {
          const nextLevel = clampNumber((Number(button.dataset.level) || 1) + delta, 1, 5);
          button.dataset.level = String(nextLevel);
          button.textContent = toRomanLevel(nextLevel);
          button.setAttribute("aria-label", `Nível ${nextLevel}`);
          html.find("[name='level']").val(String(nextLevel));
        };

        html.find(".specialty-dialog-rank").on("click", function(event) {
          event.preventDefault();
          updateLevel(this, 1);
        });
        html.find(".specialty-dialog-rank").on("contextmenu", function(event) {
          event.preventDefault();
          updateLevel(this, -1);
        });
      }
    }, { classes: ["astrael-dialog"], jQuery: true }).render(true);
  }

  async #onSpecialtyLevelClick(event) {
    event.preventDefault();
    return this.#shiftSpecialtyLevel(event.currentTarget, 1);
  }

  async #onSpecialtyLevelContext(event) {
    event.preventDefault();
    return this.#shiftSpecialtyLevel(event.currentTarget, -1);
  }

  async #shiftSpecialtyLevel(button, delta) {
    const row = button.closest(".specialties-panel-row");
    if (!row) return;

    const level = clampNumber((Number(button.dataset.level) || 1) + delta, 1, 5);
    button.dataset.level = String(level);
    button.textContent = toRomanLevel(level);

    const index = Number(row.dataset.index);
    if (index < 0) return;

    const specialties = this.#getSpecialties();
    if (!specialties[index]) return;

    specialties[index] = { ...specialties[index], level };
    await this.actor.update({ "system.specialties": specialties });
    return this.render({ force: true });
  }
}

export { AstraelSpecialtiesPanel };
