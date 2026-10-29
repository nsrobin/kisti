import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MOTION } from '@/feedback/motion';
import { useT } from '@/i18n';
import { fontFamily, takaFamily, type Weight, type Width } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens, MoneyColor } from '@/theme/tokens';

export type MoneySize = 'hero' | 'xl' | 'lg' | 'md';

const SIZES: Record<MoneySize, { size: number; weight: Weight; width: Width; lh: [number, number] }> = {
  hero: { size: 48, weight: 800, width: 'expanded', lh: [1.1, 1.25] },
  xl: { size: 32, weight: 700, width: 'semiExpanded', lh: [1.15, 1.3] },
  lg: { size: 22, weight: 700, width: 'normal', lh: [1.2, 1.35] },
  md: { size: 17, weight: 600, width: 'normal', lh: [1.3, 1.45] },
};

type Props = {
  /** null shows the "—" placeholder (invalid input). */
  paisa: number | null;
  size?: MoneySize;
  /** Overrides the size's font size (e.g. 26 on the S7 tiles). */
  fontSize?: number;
  weight?: Weight;
  width?: Width;
  color?: MoneyColor | keyof ColorTokens;
  decimals?: 0 | 2;
  /** Digits roll when the value changes (hero only, §15.2). */
  roll?: boolean;
  align?: 'left' | 'center' | 'right';
};

const BN = '০১২৩৪৫৬৭৮৯';
const EN = '0123456789';

/**
 * A money figure in its money colour. "৳" is 70% of the figure size, same colour,
 * baseline-aligned, and set in Anek Bangla (Anek Latin has no ৳). Negative values use U+2212.
 */
export function MoneyValue({
  paisa,
  size = 'md',
  fontSize,
  weight,
  width,
  color = 'emi',
  decimals = 2,
  roll,
  align,
}: Props) {
  const i18n = useT();
  const t = useTheme();
  const spec = SIZES[size];
  const lang = i18n.lang;
  const colorValue = t.c[color as keyof ColorTokens] ?? t.c.emi;
  const w = weight ?? spec.weight;
  const wd = width ?? spec.width;

  if (paisa === null) {
    const fs = fontSize ?? spec.size;
    return (
      <Text
        accessibilityLabel="—"
        style={{
          fontFamily: fontFamily(lang, w, wd),
          fontSize: fs,
          lineHeight: Math.round(fs * spec.lh[1]),
          color: t.c.textMuted,
          textAlign: align,
        }}
      >
        —
      </Text>
    );
  }

  const parts = i18n.takaParts(paisa, decimals);
  const label = i18n.speak(paisa);
  if (roll) {
    return (
      <RollingFigure parts={parts} spec={spec} weight={w} width={wd} color={colorValue} label={label} align={align} />
    );
  }

  // Hero shrink rule: 48 → 40 when the figure has more than 8 glyphs (handoff deviation 7).
  const glyphs = parts.sign.length + 1 + parts.number.length;
  const base = fontSize ?? (size === 'hero' && glyphs > 8 ? 40 : spec.size);
  const lh = Math.round(base * spec.lh[lang === 'bn' ? 1 : 0]);
  return (
    <Text
      accessible
      accessibilityLabel={label}
      numberOfLines={1}
      adjustsFontSizeToFit={size === 'hero' || size === 'xl'}
      maxFontSizeMultiplier={size === 'hero' ? 1.3 : 1.5}
      style={[
        styles.figure,
        { fontFamily: fontFamily(lang, w, wd), fontSize: base, lineHeight: lh, color: colorValue, textAlign: align },
      ]}
    >
      {parts.sign}
      <Text style={{ fontFamily: takaFamily(w, wd), fontSize: base * 0.7 }}>{parts.symbol}</Text>
      {parts.number}
    </Text>
  );
}

// Vertical metrics (em) read from the Anek fonts: [ascent, descent].
const METRICS = { bn: [1.25, 0.616], en: [0.9, 0.2] } as const;
const baseline = (lineHeight: number, size: number, [a, d]: readonly [number, number]) =>
  (lineHeight - (a + d) * size) / 2 + a * size;
const GLYPH_EM = { digitEn: 0.8, digitBn: 0.98, sep: 0.3 };
// Bengali digits have no tabular forms: advance widths (em) of ০–৯ in Anek Bangla Expanded ExtraBold.
const BN_ADVANCE = [0.815, 0.769, 0.745, 0.983, 0.798, 0.825, 0.967, 0.8, 0.926, 0.877];

type RollProps = {
  parts: { sign: string; symbol: string; number: string };
  spec: (typeof SIZES)[MoneySize];
  weight: Weight;
  width: Width;
  color: string;
  label: string;
  align?: 'left' | 'center' | 'right';
};

/** Each digit is a column 0–9 moved with translateY; no text re-renders per frame (§25). */
function RollingFigure({ parts, spec, weight, width, color, label, align }: RollProps) {
  const lang = useT().lang;
  const { fontScale } = useWindowDimensions();
  const [avail, setAvail] = useState(0);
  const bn = /[০-৯]/.test(parts.number);
  const chars = [...parts.number];

  const em =
    chars.reduce((s, c) => s + (/[0-9০-৯]/.test(c) ? (bn ? GLYPH_EM.digitBn : GLYPH_EM.digitEn) : GLYPH_EM.sep), 0) +
    0.5;
  const glyphs = parts.sign.length + 1 + chars.length;
  let size = (glyphs > 8 ? 40 : spec.size) * Math.min(fontScale, 1.3);
  if (avail > 0) {
    size = Math.min(size, avail / em);
  }
  const lh = Math.round(size * spec.lh[lang === 'bn' ? 1 : 0]);
  const digitStyle = { fontFamily: fontFamily(lang, weight, width), fontSize: size, lineHeight: lh, color };
  const metrics = lang === 'bn' ? METRICS.bn : METRICS.en;
  const takaShift = baseline(lh, size, metrics) - baseline(lh, size * 0.7, METRICS.bn);

  const onLayout = (e: LayoutChangeEvent) => setAvail(e.nativeEvent.layout.width);
  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityLabel={label}
      style={[styles.rollWrap, { justifyContent: justify }]}
    >
      {parts.sign ? (
        <Text allowFontScaling={false} style={digitStyle}>
          {parts.sign}
        </Text>
      ) : null}
      <Text
        allowFontScaling={false}
        style={[
          digitStyle,
          { fontFamily: takaFamily(weight, width), fontSize: size * 0.7, transform: [{ translateY: takaShift }] },
        ]}
      >
        {parts.symbol}
      </Text>
      {chars.map((c, i) => {
        const fromRight = chars.length - i;
        const idx = (bn ? BN : EN).indexOf(c);
        return idx >= 0 ? (
          <DigitColumn
            key={`d${fromRight}`}
            digit={idx}
            digits={bn ? BN : EN}
            style={digitStyle}
            lh={lh}
            width={bn ? (BN_ADVANCE[idx] as number) * size : undefined}
            delay={(fromRight - 1) * 30}
          />
        ) : (
          <Text key={`s${fromRight}`} allowFontScaling={false} style={digitStyle}>
            {c}
          </Text>
        );
      })}
    </View>
  );
}

function DigitColumn({
  digit,
  digits,
  style,
  lh,
  width,
  delay,
}: {
  digit: number;
  digits: string;
  style: object;
  lh: number;
  width?: number;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const y = useSharedValue(-digit * lh);
  useEffect(() => {
    const target = -digit * lh;
    y.value = reduce
      ? target
      : withDelay(delay, withTiming(target, { duration: MOTION.emphasis, easing: MOTION.easing }));
  }, [digit, lh, delay, reduce, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const column = useMemo(() => [...digits], [digits]);
  return (
    <View style={{ height: lh, width, overflow: 'hidden', alignItems: 'center' }}>
      <Animated.View style={anim}>
        {column.map(d => (
          <Text key={d} allowFontScaling={false} style={[style, styles.digit]}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  figure: { fontVariant: ['tabular-nums'] },
  rollWrap: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch' },
  digit: { textAlign: 'center', fontVariant: ['tabular-nums'] },
});
