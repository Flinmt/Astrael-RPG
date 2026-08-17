import { openExperienceDistributor } from "../applications/xp-distributor.js";

function addExperienceDistributorToActorDirectory(application, element) {
  const ActorDirectory = CONFIG.ui?.actors;
  if (!ActorDirectory || !(application instanceof ActorDirectory)) return;

  const root = element instanceof HTMLElement ? element : element?.[0];
  if (!root) return;

  const actorDirectory = root.matches("#actors, .actors-sidebar")
    ? root
    : root.querySelector("#actors, .actors-sidebar");
  if (!actorDirectory) return;

  const existingAction = actorDirectory.querySelector("[data-astrael-xp-directory-action]");
  if (!game.user?.isGM) {
    existingAction?.remove();
    return;
  }
  if (existingAction) return;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("astrael-actor-directory-xp-button");
  button.dataset.action = "open-xp-distributor";
  button.dataset.astraelXpDirectoryAction = "";
  button.title = game.i18n.localize("ASTRAEL.Experience.DistributeHint");

  const icon = document.createElement("i");
  icon.classList.add("fa-solid", "fa-arrow-trend-up");
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.textContent = game.i18n.localize("ASTRAEL.Experience.DistributeTitle");

  button.append(icon, label);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    return openExperienceDistributor();
  });

  const footer = actorDirectory.querySelector(".directory-footer");
  if (footer) footer.append(button);
  else {
    const fallbackFooter = document.createElement("footer");
    fallbackFooter.classList.add("directory-footer", "action-buttons", "flexrow", "astrael-actor-directory-xp-footer");
    fallbackFooter.append(button);
    actorDirectory.append(fallbackFooter);
  }
}

export { addExperienceDistributorToActorDirectory };
