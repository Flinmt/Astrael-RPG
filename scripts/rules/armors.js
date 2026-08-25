const ARMOR_SPECIALIZATIONS = Object.freeze([]);

function getArmorSpecialization(id) {
  const normalizedId = String(id || "").trim();
  return ARMOR_SPECIALIZATIONS.find((entry) => entry.id === normalizedId) ?? null;
}

function validateArmorData(source = {}) {
  const invalidFields = [];
  const armor = Number(source.armor);
  const specialization = String(source.specialization || "").trim();

  if (!Number.isInteger(armor) || armor < 0) invalidFields.push("armor");
  if (specialization && !getArmorSpecialization(specialization)) invalidFields.push("specialization");

  return {
    complete: invalidFields.length === 0,
    invalidFields
  };
}

export { ARMOR_SPECIALIZATIONS, getArmorSpecialization, validateArmorData };
