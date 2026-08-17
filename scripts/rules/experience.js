function normalizeExperienceEntry(entry = {}) {
  return {
    amount: Math.max(0, Math.trunc(Number(entry.amount) || 0)),
    description: String(entry.description || "").trim(),
    distributionId: String(entry.distributionId || ""),
    awardedAt: Math.max(0, Math.trunc(Number(entry.awardedAt) || 0))
  };
}

function normalizeExperienceHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .map(normalizeExperienceEntry)
    .filter((entry) => entry.amount > 0 && entry.description);
}

function calculateExperience(xp = {}) {
  const history = normalizeExperienceHistory(xp.history);
  const total = history.reduce((sum, entry) => sum + entry.amount, 0);
  const spent = Math.min(total, Math.max(0, Math.trunc(Number(xp.spent) || 0)));
  return {
    history,
    total,
    spent,
    current: total - spent
  };
}

function appendExperienceEntry(history, entry) {
  const normalizedHistory = normalizeExperienceHistory(history);
  const normalizedEntry = normalizeExperienceEntry(entry);
  if (normalizedEntry.amount < 1 || !normalizedEntry.description) return normalizedHistory;
  return [...normalizedHistory, normalizedEntry];
}

function removeExperienceDistribution(history, distributionId) {
  const id = String(distributionId || "");
  return normalizeExperienceHistory(history).filter((entry) => entry.distributionId !== id);
}

function normalizeExperienceDistributionEvent(event = {}) {
  const recipients = Array.isArray(event.recipients)
    ? event.recipients.map((recipient) => ({
      actorId: String(recipient.actorId || ""),
      name: String(recipient.name || "").trim()
    })).filter((recipient) => recipient.actorId && recipient.name)
    : [];
  return {
    id: String(event.id || ""),
    amount: Math.max(0, Math.trunc(Number(event.amount) || 0)),
    description: String(event.description || "").trim(),
    recipients,
    createdAt: Math.max(0, Math.trunc(Number(event.createdAt) || 0)),
    createdBy: {
      id: String(event.createdBy?.id || ""),
      name: String(event.createdBy?.name || "").trim()
    }
  };
}

function normalizeExperienceLedger(ledger) {
  const events = Array.isArray(ledger?.events)
    ? ledger.events.map(normalizeExperienceDistributionEvent).filter((event) => (
      event.id && event.amount > 0 && event.description && event.recipients.length
    ))
    : [];
  return { version: 1, events };
}

export {
  appendExperienceEntry,
  calculateExperience,
  normalizeExperienceDistributionEvent,
  normalizeExperienceEntry,
  normalizeExperienceHistory,
  normalizeExperienceLedger,
  removeExperienceDistribution
};
