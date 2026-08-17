import { calculateExperience } from "../../rules/experience.js";

class AscensionController {
  constructor(host) {
    this.host = host;
  }

  prepareContext(context) {
    const experience = calculateExperience(this.host.actor.system.xp);
    context.system.xp = {
      ...context.system.xp,
      ...experience
    };
    context.characterExperience = {
      ...experience,
      canEditSpent: this.host.actor.isOwner,
      entries: [...experience.history].reverse()
    };
  }

  activateListeners(root) {
    root.querySelector("[data-action='set-xp-spent']")?.addEventListener("change", this.#onSetSpent.bind(this));
  }

  async #onSetSpent(event) {
    if (!this.host.actor.isOwner) return;
    const experience = calculateExperience({
      ...this.host.actor.system.xp,
      spent: event.currentTarget.value
    });
    event.currentTarget.value = experience.spent;
    return this.host.actor.update({ "system.xp.spent": experience.spent });
  }
}

export { AscensionController };
