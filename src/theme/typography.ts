import type { TextStyle } from 'react-native';
import type { Lang } from '@/i18n/format';
import { fontFamily, type Weight, type Width } from './fonts';

type Spec = { size: [en: number, bn: number]; weight: Weight; width?: Width; lh: [en: number, bn: number] };

// §11.5 type scale (tokens.type). Bengali gets more line height so vowel signs don't clip.
export const TYPE = {
  hero: { size: [48, 48], weight: 800, width: 'expanded', lh: [1.1, 1.25] },
  figureXl: { size: [32, 32], weight: 700, width: 'semiExpanded', lh: [1.15, 1.3] },
  figureLg: { size: [22, 22], weight: 700, lh: [1.2, 1.35] },
  figureMd: { size: [17, 17], weight: 600, lh: [1.3, 1.45] },
  rootTitle: { size: [28, 28], weight: 700, width: 'semiExpanded', lh: [1.25, 1.4] },
  title: { size: [22, 23], weight: 600, lh: [1.3, 1.45] },
  section: { size: [17, 18], weight: 600, lh: [1.35, 1.5] },
  body: { size: [15, 16], weight: 400, lh: [1.45, 1.6] },
  caption: { size: [13, 14], weight: 500, lh: [1.4, 1.55] },
  micro: { size: [12, 12], weight: 500, lh: [1.5, 1.5] },
} satisfies Record<string, Spec>;

export type TypeVariant = keyof typeof TYPE;

export function typeStyle(
  variant: TypeVariant,
  lang: Lang,
  over?: { size?: number; weight?: Weight; width?: Width },
): TextStyle {
  const s: Spec = TYPE[variant];
  const i = lang === 'bn' ? 1 : 0;
  const size = over?.size ?? s.size[i];
  return {
    fontFamily: fontFamily(lang, over?.weight ?? s.weight, over?.width ?? s.width ?? 'normal'),
    fontSize: size,
    lineHeight: Math.round(size * s.lh[i]),
  };
}
