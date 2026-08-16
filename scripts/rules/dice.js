function classifyDie(value, { useCriticals = true } = {}) {
  if (useCriticals && value === 10) {
    return {
      type: "critical",
      label: "Sucesso critico"
    };
  }

  if (value >= 6) {
    return {
      type: "success",
      label: "Sucesso"
    };
  }

  return {
    type: "failure",
    label: "Falha"
  };
}

function summarizeDicePool(values, { useCriticals = true } = {}) {
  const totalBase = values.reduce((total, value) => {
    if (value >= 6) return total + 1;
    return total;
  }, 0);
  const numTens = values.filter((v) => v === 10).length;
  const pairBonus = useCriticals ? Math.floor(numTens / 2) * 2 : 0;

  return { successes: totalBase + pairBonus };
}

function prepareDicePoolResults(values, { useCriticals = true, bloodCount = 0, voidCount = 0 } = {}) {
  let pairedCriticals = useCriticals ? Math.floor(values.filter((value) => value === 10).length / 2) * 2 : 0;

  return values.map((value, index) => {
    const classification = classifyDie(value, { useCriticals });
    const isPairedCritical = value === 10 && pairedCriticals > 0;

    if (isPairedCritical) pairedCriticals -= 1;

    return {
      value,
      ...classification,
      type: isPairedCritical ? `${classification.type} paired-critical` : classification.type,
      label: isPairedCritical ? "Par critico" : classification.label,
      isBlood: index < bloodCount,
      isVoid: index >= bloodCount && index < bloodCount + voidCount
    };
  });
}

function getRollValues(roll) {
  return roll.dice.flatMap((die) => die.results.map((result) => result.result));
}

export { classifyDie, getRollValues, prepareDicePoolResults, summarizeDicePool };
