import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import type { Weight, Width } from '@/theme/fonts';
import type { ColorTokens } from '@/theme/tokens';
import { typeStyle, type TypeVariant } from '@/theme/typography';

export type TxtProps = TextProps & {
  v?: TypeVariant;
  color?: keyof ColorTokens;
  size?: number;
  weight?: Weight;
  width?: Width;
  align?: 'left' | 'center' | 'right';
};

/** Text in the current language's Anek family, sized by the §11.5 scale. */
export function Txt({ v = 'body', color = 'textPrimary', size, weight, width, align, style, ...rest }: TxtProps) {
  const lang = useStore(s => s.settings.language);
  const t = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[typeStyle(v, lang, { size, weight, width }), { color: t.c[color] }, align && { textAlign: align }, style]}
    />
  );
}
