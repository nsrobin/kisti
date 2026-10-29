import type { Lang } from '@/i18n/format';

export type Weight = 400 | 500 | 600 | 700 | 800;
export type Width = 'normal' | 'semiExpanded' | 'expanded';

const NAMES: Record<Weight, string> = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' };

/**
 * File name (Android) = PostScript name (iOS), set by scripts/make-fonts.py.
 * Only the static instances §11.5 uses ship. Weight 800 at normal width maps to
 * SemiExpanded ExtraBold (that instance was dropped to stay inside the 2 MB budget).
 */
export function fontFamily(lang: Lang, weight: Weight, width: Width = 'normal'): string {
  const family = lang === 'bn' ? 'AnekBangla' : 'AnekLatin';
  if (width === 'expanded') {
    return `${family}-ExpandedExtraBold`;
  }
  if (weight === 800) {
    return `${family}-SemiExpandedExtraBold`;
  }
  if (width === 'semiExpanded' && weight === 700) {
    return `${family}-SemiExpandedBold`;
  }
  return `${family}-${NAMES[weight]}`;
}

/** The ৳ glyph only exists in Anek Bangla. */
export const takaFamily = (weight: Weight, width: Width = 'normal') => fontFamily('bn', weight, width);
