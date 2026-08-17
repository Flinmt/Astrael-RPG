import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFractureBoxes,
  normalizeAdvantageLevel,
  normalizeConviction,
  normalizeConvictionList,
  normalizeVisibleTabs
} from "../scripts/core/utilities.js";
import { classifyDie, prepareDicePoolResults, summarizeDicePool } from "../scripts/rules/dice.js";
import { normalizeDamage, normalizeResource } from "../scripts/rules/resources.js";

test("dice pools preserve success and critical-pair behavior", () => {
  assert.deepEqual(summarizeDicePool([10, 10, 6, 5]), { successes: 5 });
  assert.deepEqual(summarizeDicePool([10, 10, 6, 5], { useCriticals: false }), { successes: 3 });
  assert.equal(classifyDie(10).type, "critical");
  assert.equal(classifyDie(10, { useCriticals: false }).type, "success");
  assert.equal(prepareDicePoolResults([10, 10, 4])[0].type, "critical paired-critical");
});

test("resource normalization clamps damage to active boxes", () => {
  assert.deepEqual(normalizeDamage({ max: 8, active: 5, superficial: 4, aggravated: 3 }, "health"), {
    max: 8,
    active: 5,
    superficial: 2,
    aggravated: 3,
    boxes: [
      { index: 0, state: "superficial" },
      { index: 1, state: "superficial" },
      { index: 2, state: "aggravated" },
      { index: 3, state: "aggravated" },
      { index: 4, state: "aggravated" },
      { index: 5, state: "empty" },
      { index: 6, state: "empty" },
      { index: 7, state: "empty" }
    ]
  });
  assert.equal(normalizeResource("willpower", { active: 0 }).active, 2);
});

test("convictions keep the fixed persisted contract", () => {
  const normalized = normalizeConviction({ fracture: 7, pillar: { name: "Anchor" } });
  assert.deepEqual(normalized, {
    name: "",
    description: "",
    fractures: 2,
    pillar: { name: "Anchor", description: "" }
  });
  assert.equal(normalizeConvictionList([normalized]).length, 3);
  assert.deepEqual(buildFractureBoxes(1), [
    { value: 1, filled: true },
    { value: 2, filled: false }
  ]);
});

test("legacy presentation values remain normalized", () => {
  assert.equal(normalizeAdvantageLevel({ level: "-IV" }), 4);
  assert.deepEqual(normalizeVisibleTabs({ virtues: true, hemomancy: false }), {
    virtues: true,
    hemomancy: false,
    strangerMark: true
  });
  assert.deepEqual(normalizeVisibleTabs({}), {
    virtues: true,
    hemomancy: true,
    strangerMark: true
  });
});
