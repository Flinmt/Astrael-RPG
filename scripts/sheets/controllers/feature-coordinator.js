class CharacterSheetFeatureCoordinator {
  constructor(controllers = []) {
    this.controllers = controllers;
  }

  prepareContext(context) {
    for (const controller of this.controllers) controller.prepareContext?.(context);
  }

  activateListeners(root) {
    for (const controller of this.controllers) controller.activateListeners?.(root);
  }

  restoreFocus(root) {
    return this.controllers.some((controller) => controller.restoreFocus?.(root));
  }

  handleEscape(event) {
    return [...this.controllers].reverse().some((controller) => controller.handleEscape?.(event));
  }

  open(activeController) {
    for (const controller of this.controllers) {
      if (controller !== activeController) controller.close?.();
    }
  }

  get hasOpenDock() {
    return this.controllers.some((controller) => controller.hasOpenDock);
  }

  close() {
    for (const controller of this.controllers) controller.close?.();
  }

  async destroy() {
    await Promise.all(this.controllers.map((controller) => controller.destroy?.()));
  }
}

export { CharacterSheetFeatureCoordinator };
