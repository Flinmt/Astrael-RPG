import assert from "node:assert/strict";
import test from "node:test";

import { CharacterSheetFeatureCoordinator } from "../scripts/sheets/controllers/feature-coordinator.js";

test("opening a feature closes every other controller", () => {
  const active = { closeCalls: 0, close() { this.closeCalls += 1; } };
  const inactive = { closeCalls: 0, close() { this.closeCalls += 1; } };
  const coordinator = new CharacterSheetFeatureCoordinator([active, inactive]);

  coordinator.open(active);

  assert.equal(active.closeCalls, 0);
  assert.equal(inactive.closeCalls, 1);
});

test("Escape is offered to the most recently registered controller first", () => {
  const calls = [];
  const coordinator = new CharacterSheetFeatureCoordinator([
    { handleEscape() { calls.push("first"); return true; } },
    { handleEscape() { calls.push("second"); return true; } }
  ]);

  assert.equal(coordinator.handleEscape({}), true);
  assert.deepEqual(calls, ["second"]);
});
