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
  if (String(source.minorTrait || "").trim() && !getWeaponCatalogEntry(MINOR_WEAPON_TRAITS, source.minorTrait)) invalidFields.push("minorTrait");
  if (String(source.majorTrait || "").trim() && !getWeaponCatalogEntry(MAJOR_WEAPON_TRAITS, source.majorTrait)) invalidFields.push("majorTrait");

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
