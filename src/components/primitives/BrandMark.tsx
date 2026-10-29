import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { takaFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';

/** Stitched aurora ring around a bold ৳ (the app-icon motif). */
export function BrandMark({ size = 44 }: { size?: number }) {
  const t = useTheme();
  const r = size * 0.4;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Defs>
        <LinearGradient id="brandAurora" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={t.aurora[0]} />
          <Stop offset="0.52" stopColor={t.aurora[1]} />
          <Stop offset="1" stopColor={t.aurora[2]} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#brandAurora)"
        strokeWidth={size * 0.07}
        strokeDasharray={`${size * 0.12} ${size * 0.08}`}
        strokeLinecap="round"
        fill="none"
      />
      <SvgText
        x={size / 2}
        y={size * 0.66}
        fontSize={size * 0.46}
        fontFamily={takaFamily(800, 'expanded')}
        fill={t.c.textPrimary}
        textAnchor="middle"
      >
        ৳
      </SvgText>
    </Svg>
  );
}
