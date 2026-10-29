// Hand-written formatting, no Intl, so output is identical on every Hermes build (§23).
import { monthOf, yearOf, type YearMonth } from '@/core/months';
import type { Paisa } from '@/core/loan/types';

export type Lang = 'bn' | 'en';
/** Bengali digits are used only in Bengali mode, and only when the setting is on. */
export type DigitOpts = { lang: Lang; bengaliDigits: boolean };

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const MINUS = '−';
export const TAKA = '৳';

export const toBengaliDigits = (s: string): string => s.replace(/[0-9]/g, c => BN_DIGITS[Number(c)] as string);

const digits = (s: string, o: DigitOpts) => (o.lang === 'bn' && o.bengaliDigits ? toBengaliDigits(s) : s);

/** Last 3 digits, then pairs: 1960934 → 19,60,934. */
export function groupLakh(intDigits: string): string {
  if (intDigits.length <= 3) {
    return intDigits;
  }
  const head = intDigits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${intDigits.slice(-3)}`;
}

export type TakaParts = { sign: string; symbol: string; number: string };

/** Splits a paisa amount into sign, "৳" and the grouped number (for MoneyValue). */
export function takaParts(paisa: Paisa, o: DigitOpts & { decimals: 0 | 2 }): TakaParts {
  const abs = Math.abs(Math.round(paisa));
  const number =
    o.decimals === 0
      ? groupLakh(String(Math.round(abs / 100)))
      : `${groupLakh(String(Math.floor(abs / 100)))}.${String(abs % 100).padStart(2, '0')}`;
  const negative = paisa < 0 && (o.decimals === 2 ? abs > 0 : Math.round(abs / 100) > 0);
  return { sign: negative ? MINUS : '', symbol: TAKA, number: digits(number, o) };
}

/** ৳15,21,595.95 / ৳১৫,২১,৫৯৫.৯৫; negatives as −৳4,000.00 (U+2212). */
export function formatTaka(paisa: Paisa, o: DigitOpts & { decimals: 0 | 2 }): string {
  const p = takaParts(paisa, o);
  return p.sign + p.symbol + p.number;
}

const trimZeros = (s: string) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s);

/** "15.22 lakh" / "১৫.২২ লাখ", "1.5 crore" / "১.৫ কোটি"; below 1 lakh falls back to formatTaka. */
export function formatCompact(paisa: Paisa, lang: Lang, bengaliDigits = true): string {
  const o = { lang, bengaliDigits };
  const taka = paisa / 100;
  if (Math.abs(taka) >= 1e7) {
    return digits(trimZeros((taka / 1e7).toFixed(2)), o) + (lang === 'bn' ? ' কোটি' : ' crore');
  }
  if (Math.abs(taka) >= 1e5) {
    return digits(trimZeros((taka / 1e5).toFixed(2)), o) + (lang === 'bn' ? ' লাখ' : ' lakh');
  }
  return formatTaka(paisa, { ...o, decimals: 0 });
}

/** Yearly rates use 2 decimals and monthly rates 4; trailing zeros are trimmed. No "%" sign. */
export const formatPercent = (value: number, decimals: number, o: DigitOpts): string =>
  digits(trimZeros(value.toFixed(decimals)), o);

/** Plain integer with Bengali digits when they apply (counts, years, installment numbers). */
export const formatInt = (n: number, o: DigitOpts): string => digits(String(n), o);

/** A raw decimal string with lakh grouping, as shown in a blurred input. */
export function groupInputText(text: string): string {
  const m = /^(\d+)(\.\d*)?$/.exec(text);
  return m ? groupLakh(String(Number(m[1]))) + (m[2] ?? '') : text;
}

export const MONTHS = {
  en: {
    long: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  bn: {
    long: [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ],
    short: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলাই', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'],
  },
} as const;

export const monthName = (month: number, lang: Lang, form: 'long' | 'short'): string =>
  MONTHS[lang][form][month - 1] as string;

/** "March 2027" / "মার্চ ২০২৭". */
export function formatMonth(ym: YearMonth, form: 'long' | 'short', o: DigitOpts): string {
  return `${monthName(monthOf(ym), o.lang, form)} ${formatInt(yearOf(ym), o)}`;
}

/** Screen-reader label that spells out the currency: "32,683 taka" / "৩২,৬৮৩ টাকা". */
export function speakTaka(paisa: Paisa, lang: Lang, bengaliDigits = true): string {
  const decimals = Math.round(paisa) % 100 === 0 ? 0 : 2;
  const p = takaParts(paisa, { lang, bengaliDigits, decimals });
  const minus = p.sign ? (lang === 'bn' ? 'মাইনাস ' : 'minus ') : '';
  return `${minus}${p.number} ${lang === 'bn' ? 'টাকা' : 'taka'}`;
}
