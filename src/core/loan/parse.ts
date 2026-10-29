const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Maps Bengali digits ০–৯ to 0–9. */
export const fromBengaliDigits = (s: string): string => s.replace(/[০-৯]/g, c => String(BN_DIGITS.indexOf(c)));

/** Strips everything the user may type around a number but that is not part of it. */
export const normalizeNumberText = (text: string): string =>
  fromBengaliDigits(text)
    .replace(/[,\s৳]/g, '')
    .replace(/−/g, '-');

/**
 * Accepts digits 0–9 and ০–৯ and ignores commas, spaces and "৳".
 * Returns null for empty or invalid text.
 */
export function parseNumber(text: string): number | null {
  const s = normalizeNumberText(text);
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
    return null;
  }
  const value = Number(s);
  return Number.isFinite(value) ? value : null;
}

export const isBlank = (text: string): boolean => normalizeNumberText(text) === '';
