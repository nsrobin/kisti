import React from 'react';
import { View } from 'react-native';
import { Txt } from '@/components/primitives/Txt';
import type { Accent } from '@/state/types';
import { fontFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';

/** Initials of the first two words: "Kantha Bank" → "KB", "কাঁথা ব্যাংক" → "কব". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = (w: string) => [...w][0] ?? '';
  return words.slice(0, 2).map(first).join('').toUpperCase();
}

export function LoanAvatar({ name, accent, size = 44 }: { name: string; accent: Accent; size?: number }) {
  const t = useTheme();
  const color = t.accent[accent];
  const text = initials(name);
  const bn = /[ঀ-৿]/.test(text);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: alpha(color, 0.16),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt v="body" size={15} style={{ color, fontFamily: fontFamily(bn ? 'bn' : 'en', 700) }}>
        {text}
      </Txt>
    </View>
  );
}
