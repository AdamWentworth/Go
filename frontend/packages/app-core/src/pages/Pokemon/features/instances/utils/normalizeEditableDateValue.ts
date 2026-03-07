export const normalizeEditableDateValue = (raw: unknown): string | null => {
  if (raw == null) return null;

  const asString = String(raw).trim();
  if (!asString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;

  const parsed = new Date(asString);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};
