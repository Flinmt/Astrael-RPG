import { DEFAULT_RESOURCES, RESOURCE_MINIMUMS } from "../core/constants.js";
import { clampNumber, isNumeric } from "../core/utilities.js";

function normalizeResource(resourceId, source = {}) {
  const fallback = DEFAULT_RESOURCES[resourceId];
  const max = fallback.max;

  if (Array.isArray(source.track) && !isNumeric(source.active)) {
    const active = source.track.filter((state) => state && state !== "empty").length;
    const superficial = source.track.filter((state) => state === "superficial").length;
    const aggravated = source.track.filter((state) => state === "aggravated").length;

    return normalizeDamage({ max, active, superficial, aggravated }, resourceId);
  }

  return normalizeDamage({
    max,
    active: source.active,
    superficial: source.superficial,
    aggravated: source.aggravated
  }, resourceId);
}

function normalizeDamage(resource, resourceId) {
  const max = resource.max;
  const minActive = RESOURCE_MINIMUMS[resourceId] ?? 0;
  let active = clampNumber(resource.active, minActive, max);
  let superficial = clampNumber(resource.superficial, 0, active);
  let aggravated = clampNumber(resource.aggravated, 0, active);

  const overflow = superficial + aggravated - active;
  if (overflow > 0) {
    const superficialReduction = Math.min(superficial, overflow);
    superficial -= superficialReduction;
    aggravated -= Math.min(aggravated, overflow - superficialReduction);
  }

  return {
    max,
    active,
    superficial,
    aggravated,
    boxes: buildResourceBoxes({ max, active, superficial, aggravated })
  };
}

function buildResourceBoxes(resource) {
  const filled = resource.active - resource.superficial - resource.aggravated;
  const states = [
    ...Array(filled).fill("filled"),
    ...Array(resource.superficial).fill("superficial"),
    ...Array(resource.aggravated).fill("aggravated"),
    ...Array(resource.max - resource.active).fill("empty")
  ];

  return states.map((state, index) => ({ index, state }));
}

export { buildResourceBoxes, normalizeDamage, normalizeResource };
