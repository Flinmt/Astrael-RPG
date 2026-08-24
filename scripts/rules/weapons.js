import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../core/constants.js";

const MINOR_WEAPON_TRAITS = Object.freeze([
  Object.freeze({
    id: "concealed",
    label: "ASTRAEL.Weapon.Traits.Minor.Concealed.Name",
    description: "ASTRAEL.Weapon.Traits.Minor.Concealed.Description"
  })
]);

const MAJOR_WEAPON_TRAITS = Object.freeze([
  Object.freeze({
    id: "assassinate",
    label: "ASTRAEL.Weapon.Traits.Major.Assassinate.Name",
    description: "ASTRAEL.Weapon.Traits.Major.Assassinate.Description"
  })
]);

const WEAPON_PROPERTY_KEYS = Object.freeze(["minorTrait", "majorTrait"]);

function getWeaponCatalogEntry(catalog, id) {
  const normalizedId = String(id || "").trim();
  return catalog.find((entry) => entry.id === normalizedId) ?? null;
}

function validateWeaponData(source = {}) {
  const invalidFields = [];
  const damage = Number(source.damage);

  if (!Number.isInteger(damage) || damage < 1) invalidFields.push("damage");
  if (!getWeaponCatalogEntry(MINOR_WEAPON_TRAITS, source.minorTrait)) invalidFields.push("minorTrait");
  if (!getWeaponCatalogEntry(MAJOR_WEAPON_TRAITS, source.majorTrait)) invalidFields.push("majorTrait");
  if (!ATTRIBUTE_KEYS.includes(String(source.rollAttribute || "").trim())) invalidFields.push("rollAttribute");
  if (!SKILL_KEYS.includes(String(source.rollSkill || "").trim())) invalidFields.push("rollSkill");

  return {
    complete: invalidFields.length === 0,
    invalidFields
  };
}

export {
  MAJOR_WEAPON_TRAITS,
  MINOR_WEAPON_TRAITS,
  WEAPON_PROPERTY_KEYS,
  getWeaponCatalogEntry,
  validateWeaponData
};
