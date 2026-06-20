const CAMEROON_PREFIX = '+237';

/**
 * Accepts 698546321, 237698546321, or +237698546321 and always returns +237698546321.
 * Strips spaces, dashes, and dots before processing.
 */
export function normalizeCameroonPhone(raw: string): string {
  const clean = raw.trim().replace(/[\s\-\.]/g, '');
  if (clean.startsWith(CAMEROON_PREFIX)) return clean;
  if (clean.startsWith('237')) return '+' + clean;
  return CAMEROON_PREFIX + clean;
}
