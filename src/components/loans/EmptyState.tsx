import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Button } from '@/components/primitives/Button';
import { Txt } from '@/components/primitives/Txt';
import { useT } from '@/i18n';
import { takaFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';

/** Stitch ring with an aurora arc, needle and dashed thread around a muted ৳ (assets/empty-state.svg). */
export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useTheme();
  const i18n = useT();
  return (
    <View style={{ alignItems: 'center', gap: 16, paddingVertical: 32 }}>
      <Svg width={180} height={180} viewBox="0 0 180 180" accessibilityElementsHidden importantForAccessibility="no">
        <Defs>
          <LinearGradient id="emptyAurora" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={t.aurora[0]} />
            <Stop offset="0.52" stopColor={t.aurora[1]} />
            <Stop offset="1" stopColor={t.aurora[2]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={90}
          cy={90}
          r={62}
          stroke={alpha(t.c.principal, 0.45)}
          strokeWidth={4}
          strokeDasharray="8 6"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M90 28 A62 62 0 0 1 149 71"
          stroke="url(#emptyAurora)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="8 6"
          fill="none"
        />
        <Path d="M146 40 L160 26" stroke={t.c.textSecondary} strokeWidth={3} strokeLinecap="round" />
        <Circle cx={162} cy={24} r={3} stroke={t.c.textSecondary} strokeWidth={1.5} fill="none" />
        <Path
          d="M146 40 C 130 60, 170 90, 150 120 S 120 160, 90 166"
          stroke={t.c.textMuted}
          strokeWidth={1.5}
          strokeDasharray="4 5"
          fill="none"
        />
        <SvgText
          x={90}
          y={112}
          fontSize={64}
          fontFamily={takaFamily(800, 'expanded')}
          fill={t.c.textMuted}
          textAnchor="middle"
        >
          ৳
        </SvgText>
      </Svg>
      <Txt v="title" align="center" accessibilityRole="header">
        {i18n.t('loans.emptyTitle')}
      </Txt>
      <Txt v="body" color="textSecondary" align="center" style={{ maxWidth: 300 }}>
        {i18n.t('loans.emptyBody')}
      </Txt>
      <Button label={i18n.t('loans.add')} icon="plus" onPress={onAdd} />
    </View>
  );
}
