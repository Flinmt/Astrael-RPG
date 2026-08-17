import { SYSTEM_ID, XP_DISTRIBUTOR_TEMPLATE } from "../core/constants.js";
import {
  appendExperienceEntry,
  calculateExperience,
  normalizeExperienceHistory,
  normalizeExperienceLedger,
  removeExperienceDistribution
} from "../rules/experience.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

let activeDistributor = null;

function getEligibleExperienceActors() {
  return (game.actors?.filter((actor) => actor.type === "character" && actor.hasPlayerOwner) || [])
    .sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang));
}

function getActorOwnerNames(actor) {
  return (game.users?.filter((user) => !user.isGM && actor.testUserPermission(user, "OWNER")) || [])
    .map((user) => user.name)
    .sort((left, right) => left.localeCompare(right, game.i18n.lang));
}

class AstraelXPDistributor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["astrael-rpg", "xp-distributor"],
    position: {
      width: 760,
      height: 700
    },
    window: {
      title: "Distribute XP",
      resizable: true
    }
  };

  static PARTS = {
    form: {
      template: XP_DISTRIBUTOR_TEMPLATE
    }
  };

  constructor(options = {}) {
    super(options);
    this.activeTab = "grant";
    this.selectedActorIds = new Set();
    this.search = "";
    this.amount = 1;
    this.description = "";
    this.confirmingDeletion = null;
    this.busy = false;
  }

  get title() {
    return game.i18n.localize("ASTRAEL.Experience.DistributeTitle");
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actors = getEligibleExperienceActors();
    const ledger = game.user?.isGM
      ? normalizeExperienceLedger(game.settings.get(SYSTEM_ID, "xpDistributionHistory"))
      : { version: 1, events: [] };
    const dateFormatter = new Intl.DateTimeFormat(game.i18n.lang, { dateStyle: "short", timeStyle: "short" });
    context.grantActive = this.activeTab === "grant";
    context.historyActive = this.activeTab === "history";
    context.search = this.search;
    context.amount = this.amount;
    context.description = this.description;
    context.selectedCount = actors.filter((actor) => this.selectedActorIds.has(actor.id)).length;
    context.totalActors = actors.length;
    context.hasActors = actors.length > 0;
    context.allSelected = actors.length > 0 && context.selectedCount === actors.length;
    context.actors = actors.map((actor) => {
      const owners = getActorOwnerNames(actor);
      return {
        id: actor.id,
        name: actor.name,
        img: actor.img,
        owners: owners.join(", "),
        selected: this.selectedActorIds.has(actor.id),
        searchText: `${actor.name} ${owners.join(" ")}`.toLocaleLowerCase(game.i18n.lang)
      };
    });
    context.events = [...ledger.events].reverse().map((event) => ({
      ...event,
      formattedDate: event.createdAt ? dateFormatter.format(event.createdAt) : "—",
      confirmingDeletion: this.confirmingDeletion === event.id
    }));
    context.hasEvents = context.events.length > 0;
    context.busy = this.busy;
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const actions = {
      "switch-xp-tab": this.#onSwitchTab,
      "toggle-xp-target": this.#onToggleTarget,
      "select-all-xp-targets": this.#onSelectAll,
      "clear-xp-targets": this.#onClearSelection,
      "distribute-xp": this.#onDistribute,
      "request-delete-xp-event": this.#onRequestDelete,
      "cancel-delete-xp-event": this.#onCancelDelete,
      "confirm-delete-xp-event": this.#onConfirmDelete
    };
    for (const [action, handler] of Object.entries(actions)) {
      this.element.querySelectorAll(`[data-action='${action}']`).forEach((element) => {
        element.addEventListener("click", handler.bind(this));
      });
    }
    this.element.querySelector("[data-action='search-xp-targets']")?.addEventListener("input", this.#onSearch.bind(this));
    this.element.querySelector("[data-action='xp-distribution-amount']")?.addEventListener("input", (event) => {
      this.amount = event.currentTarget.value;
    });
    this.element.querySelector("[data-action='xp-distribution-description']")?.addEventListener("input", (event) => {
      this.description = event.currentTarget.value;
    });
    this.#filterTargets();
  }

  async close(options) {
    if (activeDistributor === this) activeDistributor = null;
    return super.close(options);
  }

  #syncDraft() {
    const amount = this.element.querySelector("[data-action='xp-distribution-amount']");
    const description = this.element.querySelector("[data-action='xp-distribution-description']");
    if (amount) this.amount = amount.value;
    if (description) this.description = description.value;
  }

  #onSwitchTab(event) {
    event.preventDefault();
    this.#syncDraft();
    this.activeTab = event.currentTarget.dataset.tab === "history" ? "history" : "grant";
    this.confirmingDeletion = null;
    return this.render({ force: true });
  }

  #onToggleTarget(event) {
    event.preventDefault();
    this.#syncDraft();
    const actorId = event.currentTarget.dataset.actorId;
    if (this.selectedActorIds.has(actorId)) this.selectedActorIds.delete(actorId);
    else this.selectedActorIds.add(actorId);
    return this.render({ force: true });
  }

  #onSelectAll(event) {
    event.preventDefault();
    this.#syncDraft();
    this.selectedActorIds = new Set(getEligibleExperienceActors().map((actor) => actor.id));
    return this.render({ force: true });
  }

  #onClearSelection(event) {
    event.preventDefault();
    this.#syncDraft();
    this.selectedActorIds.clear();
    return this.render({ force: true });
  }

  #onSearch(event) {
    this.search = event.currentTarget.value;
    this.#filterTargets();
  }

  #filterTargets() {
    const query = this.search.trim().toLocaleLowerCase(game.i18n.lang);
    let visibleCount = 0;
    this.element.querySelectorAll("[data-xp-target-card]").forEach((card) => {
      const hidden = Boolean(query && !card.dataset.searchText.includes(query));
      card.hidden = hidden;
      if (!hidden) visibleCount += 1;
    });
    const emptyState = this.element.querySelector("[data-xp-filter-empty]");
    if (emptyState) emptyState.hidden = visibleCount > 0;
  }

  async #onDistribute(event) {
    event.preventDefault();
    if (!game.user?.isGM) return ui.notifications.warn(game.i18n.localize("ASTRAEL.Experience.GMOnly"));
    if (this.busy) return;
    this.#syncDraft();
    const amount = Math.trunc(Number(this.amount) || 0);
    const description = String(this.description || "").trim();
    const recipients = getEligibleExperienceActors().filter((actor) => this.selectedActorIds.has(actor.id));
    if (amount < 1) return ui.notifications.warn(game.i18n.localize("ASTRAEL.Experience.AmountRequired"));
    if (!description) return ui.notifications.warn(game.i18n.localize("ASTRAEL.Experience.DescriptionRequired"));
    if (!recipients.length) return ui.notifications.warn(game.i18n.localize("ASTRAEL.Experience.TargetRequired"));

    this.busy = true;
    const distributionId = foundry.utils.randomID();
    const createdAt = Date.now();
    const backups = new Map();
    const updatedActors = [];
    try {
      for (const actor of recipients) {
        const history = normalizeExperienceHistory(actor.system.xp?.history);
        backups.set(actor.id, history);
        await actor.update({
          "system.xp.history": appendExperienceEntry(history, { amount, description, distributionId, awardedAt: createdAt })
        });
        updatedActors.push(actor);
      }
      const ledger = normalizeExperienceLedger(game.settings.get(SYSTEM_ID, "xpDistributionHistory"));
      ledger.events.push({
        id: distributionId,
        amount,
        description,
        recipients: recipients.map((actor) => ({ actorId: actor.id, name: actor.name })),
        createdAt,
        createdBy: { id: game.user.id, name: game.user.name }
      });
      await game.settings.set(SYSTEM_ID, "xpDistributionHistory", ledger);
    } catch (error) {
      await Promise.allSettled(updatedActors.map((actor) => actor.update({ "system.xp.history": backups.get(actor.id) })));
      console.error("Astrael RPG | Failed to distribute XP", error);
      this.busy = false;
      ui.notifications.error(game.i18n.localize("ASTRAEL.Experience.DistributionFailed"));
      return this.render({ force: true });
    }

    this.busy = false;
    this.amount = 1;
    this.description = "";
    this.selectedActorIds.clear();
    this.activeTab = "history";
    ui.notifications.info(game.i18n.format("ASTRAEL.Experience.Distributed", { amount, count: recipients.length }));
    return this.render({ force: true });
  }

  #onRequestDelete(event) {
    event.preventDefault();
    this.confirmingDeletion = event.currentTarget.dataset.eventId;
    return this.render({ force: true });
  }

  #onCancelDelete(event) {
    event.preventDefault();
    this.confirmingDeletion = null;
    return this.render({ force: true });
  }

  async #onConfirmDelete(event) {
    event.preventDefault();
    if (!game.user?.isGM) return ui.notifications.warn(game.i18n.localize("ASTRAEL.Experience.GMOnly"));
    if (this.busy) return;
    const eventId = event.currentTarget.dataset.eventId;
    const ledger = normalizeExperienceLedger(game.settings.get(SYSTEM_ID, "xpDistributionHistory"));
    const distribution = ledger.events.find((entry) => entry.id === eventId);
    if (!distribution) return;
    this.busy = true;
    const backups = new Map();
    const updatedActors = [];
    try {
      for (const recipient of distribution.recipients) {
        const actor = game.actors?.get(recipient.actorId);
        if (!actor) continue;
        const history = normalizeExperienceHistory(actor.system.xp?.history);
        backups.set(actor.id, { history, spent: actor.system.xp?.spent ?? 0 });
        const nextHistory = removeExperienceDistribution(history, eventId);
        const experience = calculateExperience({ history: nextHistory, spent: actor.system.xp?.spent });
        await actor.update({
          "system.xp.history": nextHistory,
          "system.xp.spent": experience.spent
        });
        updatedActors.push(actor);
      }
      ledger.events = ledger.events.filter((entry) => entry.id !== eventId);
      await game.settings.set(SYSTEM_ID, "xpDistributionHistory", ledger);
    } catch (error) {
      await Promise.allSettled(updatedActors.map((actor) => {
        const backup = backups.get(actor.id);
        return actor.update({ "system.xp.history": backup.history, "system.xp.spent": backup.spent });
      }));
      console.error("Astrael RPG | Failed to delete XP distribution", error);
      this.busy = false;
      ui.notifications.error(game.i18n.localize("ASTRAEL.Experience.DeletionFailed"));
      return this.render({ force: true });
    }
    this.busy = false;
    this.confirmingDeletion = null;
    ui.notifications.info(game.i18n.localize("ASTRAEL.Experience.DistributionDeleted"));
    return this.render({ force: true });
  }
}

function openExperienceDistributor() {
  if (!game.user?.isGM) {
    ui.notifications.warn(game.i18n.localize("ASTRAEL.Experience.GMOnly"));
    return;
  }
  if (activeDistributor?.rendered) return activeDistributor.bringToFront();
  activeDistributor = new AstraelXPDistributor();
  return activeDistributor.render({ force: true });
}

export { AstraelXPDistributor, getEligibleExperienceActors, openExperienceDistributor };
