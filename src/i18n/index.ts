import { useMemo } from 'react';
import type { Paisa } from '@/core/loan/types';
import type { YearMonth } from '@/core/months';
import { useStore } from '@/state/store';
import { bn } from './bn';
import { en, type StringKey } from './en';
import {
  formatCompact,
  formatInt,
  formatMonth,
  formatPercent,
  formatTaka,
  speakTaka,
  takaParts,
  type Lang,
} from './format';

export type { StringKey } from './en';
export type { Lang } from './format';

const DICTS: Record<Lang, Record<StringKey, string>> = { en, bn };
type Params = Record<string, string | number>;

/** Looks up a string and fills `{name}` placeholders. */
export function t(lang: Lang, key: StringKey, params?: Params): string {
  const s = DICTS[lang][key];
  return params ? s.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : s;
}

type PluralBase<K = StringKey> = K extends `${infer B}.one` ? B : never;

/** Picks the `.one` or `.other` form. */
export function tp(lang: Lang, base: PluralBase, count: number, params?: Params): string {
  return t(lang, `${base}.${count === 1 ? 'one' : 'other'}` as StringKey, params);
}

export function makeI18n(lang: Lang, bengaliDigits: boolean) {
  const o = { lang, bengaliDigits };
  return {
    lang,
    bengaliDigits,
    t: (key: StringKey, params?: Params) => t(lang, key, params),
    tp: (base: PluralBase, count: number, params?: Params) => tp(lang, base, count, params),
    taka: (paisa: Paisa, decimals: 0 | 2 = 2) => formatTaka(paisa, { ...o, decimals }),
    takaParts: (paisa: Paisa, decimals: 0 | 2 = 2) => takaParts(paisa, { ...o, decimals }),
    compact: (paisa: Paisa) => formatCompact(paisa, lang, bengaliDigits),
    percent: (value: number, decimals: number) => formatPercent(value, decimals, o),
    int: (n: number) => formatInt(n, o),
    month: (ym: YearMonth, form: 'long' | 'short' = 'long') => formatMonth(ym, form, o),
    speak: (paisa: Paisa) => speakTaka(paisa, lang, bengaliDigits),
  };
}

export type I18n = ReturnType<typeof makeI18n>;

/** Current-language strings and formatters; re-renders instantly on language change. */
export function useT(): I18n {
  const lang = useStore(s => s.settings.language);
  const bengaliDigits = useStore(s => s.settings.bengaliDigits);
  return useMemo(() => makeI18n(lang, bengaliDigits), [lang, bengaliDigits]);
}
