import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFractureBoxes,
  normalizeAdvantageLevel,
  normalizeConviction,
  normalizeConvictionList
} from "../scripts/core/utilities.js";
import { classifyDie, prepareDicePoolResults, summarizeDicePool } from "../scripts/rules/dice.js";
import {
  appendExperienceEntry,
  calculateExperience,
  normalizeExperienceHistory,
  normalizeExperienceLedger,
  removeExperienceDistribution
} from "../scripts/rules/experience.js";
import { normalizeDamage, normalizeResource } from "../scripts/rules/resources.js";
import {
  MAJOR_WEAPON_TRAITS,
  MINOR_WEAPON_TRAITS,
  WEAPON_PROPERTY_KEYS,
  getWeaponCatalogEntry,
  validateWeaponData
} from "../scripts/rules/weapons.js";

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

test("legacy advantage levels remain normalized", () => {
  assert.equal(normalizeAdvantageLevel({ level: "-IV" }), 4);
});

test("experience totals are derived exclusively from valid history entries", () => {
  const experience = calculateExperience({
    total: 99,
    current: 99,
    spent: 3,
    history: [
      { amount: 4, description: "Session one" },
      { amount: "6", description: "  Milestone  " },
      { amount: -2, description: "Invalid correction" },
      { amount: 5, description: "" }
    ]
  });

  assert.deepEqual(experience, {
    history: [
      { amount: 4, description: "Session one", distributionId: "", awardedAt: 0 },
      { amount: 6, description: "Milestone", distributionId: "", awardedAt: 0 }
    ],
    total: 10,
    spent: 3,
    current: 7
  });
});

test("experience spent is clamped to the history total", () => {
  assert.deepEqual(calculateExperience({ spent: 8, history: [] }), {
    history: [],
    total: 0,
    spent: 0,
    current: 0
  });
  assert.equal(calculateExperience({ spent: 20, history: [{ amount: 5, description: "Award" }] }).spent, 5);
  assert.deepEqual(normalizeExperienceHistory(null), []);
});

test("experience awards append a normalized history entry", () => {
  assert.deepEqual(appendExperienceEntry(
    [{ amount: 2, description: "Opening" }],
    { amount: "3.9", description: "  Chapter complete  " }
  ), [
    { amount: 2, description: "Opening", distributionId: "", awardedAt: 0 },
    { amount: 3, description: "Chapter complete", distributionId: "", awardedAt: 0 }
  ]);
  assert.deepEqual(appendExperienceEntry([], { amount: 0, description: "Invalid" }), []);
});

test("experience distributions preserve shared event metadata", () => {
  const history = appendExperienceEntry([], {
    amount: 7,
    description: "  Story conclusion  ",
    distributionId: "award-1",
    awardedAt: 1720000000000
  });
  assert.deepEqual(history, [{
    amount: 7,
    description: "Story conclusion",
    distributionId: "award-1",
    awardedAt: 1720000000000
  }]);
  assert.deepEqual(removeExperienceDistribution(history, "award-1"), []);
});

test("experience ledger keeps only complete distribution events", () => {
  assert.deepEqual(normalizeExperienceLedger({ events: [{
    id: "award-1",
    amount: "5.9",
    description: "  Discovery  ",
    recipients: [{ actorId: "actor-1", name: "  Junior  " }, { actorId: "", name: "Invalid" }],
    createdAt: "1720000000000",
    createdBy: { id: "gm-1", name: "Narrator" }
  }, {
    id: "invalid",
    amount: 0,
    description: "Ignored",
    recipients: []
  }] }), {
    version: 1,
    events: [{
      id: "award-1",
      amount: 5,
      description: "Discovery",
      recipients: [{ actorId: "actor-1", name: "Junior" }],
      createdAt: 1720000000000,
      createdBy: { id: "gm-1", name: "Narrator" }
    }]
  });
});

test("weapon catalogs expose the initial official characteristics", () => {
  assert.deepEqual(WEAPON_PROPERTY_KEYS, ["minorTrait", "majorTrait"]);
  assert.equal(getWeaponCatalogEntry(MINOR_WEAPON_TRAITS, "concealed")?.id, "concealed");
  assert.equal(getWeaponCatalogEntry(MAJOR_WEAPON_TRAITS, "assassinate")?.id, "assassinate");
});

test("weapon validation requires damage and official characteristics", () => {
  assert.deepEqual(validateWeaponData({
    damage: 1,
    minorTrait: "concealed",
    majorTrait: "assassinate"
  }), {
    complete: true,
    invalidFields: []
  });

  assert.deepEqual(validateWeaponData({
    damage: 0,
    minorTrait: "unknown",
    majorTrait: ""
  }), {
    complete: false,
    invalidFields: ["damage", "minorTrait", "majorTrait"]
  });
});
