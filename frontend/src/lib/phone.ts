const PREFIX = '+237';

/**
 * Accepts 698546321, 237698546321, or +237698546321 and always returns +237698546321.
 */
export function normalizeCameroonPhone(raw: string): string {
  const clean = raw.trim().replace(/[\s\-\.]/g, '');
  if (clean.startsWith(PREFIX)) return clean;
  if (clean.startsWith('237')) return '+' + clean;
  return PREFIX + clean;
}

/** Removes the +237 prefix for display inside a PhoneInput (which already shows it). */
export function stripCountryCode(phone: string): string {
  if (phone.startsWith(PREFIX)) return phone.slice(4);
  if (phone.startsWith('237')) return phone.slice(3);
  return phone;
}
