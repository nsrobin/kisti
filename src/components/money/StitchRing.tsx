import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Mask, Path, Stop } from 'react-native-svg';
import { Txt } from '@/components/primitives/Txt';
import { ringGeometry, stitchUnits, type StitchStatus } from '@/core/stitch';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';

const ACircle = Animated.createAnimatedComponent(Circle);
const AG = Animated.createAnimatedComponent(G);

type Props = {
  size: 200 | 120;
  count: number; // actualInstallmentCount
  paid: number;
  dueK: number | null;
  center: string;
  caption: string;
  accessibilityLabel: string;
};

/**
 * One stitch per installment up to 120, one per year above (§12). At most three SVG paths
 * (paid, due, upcoming) drawn with arcs; the draw is one shared value driving a mask (§25).
 */
export function StitchRing({ size, count, paid, dueK, center, caption, accessibilityLabel }: Props) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const geo = useMemo(() => ringGeometry(size, stitchUnits(count, paid, dueK, 120)), [size, count, paid, dueK]);
  const paths = useMemo(() => {
    const by: Record<StitchStatus, string> = { paid: '', due: '', upcoming: '' };
    for (const s of geo.segments) {
      by[s.status] += s.d;
    }
    return by;
  }, [geo]);

  const C = 2 * Math.PI * geo.radius;
  const doneFraction = count > 0 ? Math.min(1, (paid + (dueK ? 1 : 0)) / count) : 0;
  const draw = useSharedValue(reduce ? 1 : 0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    draw.value = reduce ? 1 : withTiming(1, { duration: 600, easing: Easing.bezier(0.2, 0, 0, 1) });
    pulse.value = reduce
      ? 1
      : withRepeat(withSequence(withTiming(0.6, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1);
  }, [draw, pulse, reduce, paid, dueK]);

  const maskProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - doneFraction * draw.value) }));
  const pulseProps = useAnimatedProps(() => ({ opacity: pulse.value }));
  const cx = size / 2;
  const centerSize = size === 200 ? (center.length > 5 ? 30 : 40) : center.length > 5 ? 20 : 26;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size, alignSelf: 'center' }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="aurora" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={t.aurora[0]} />
            <Stop offset="0.52" stopColor={t.aurora[1]} />
            <Stop offset="1" stopColor={t.aurora[2]} />
          </LinearGradient>
          <Mask id="drawMask" maskUnits="userSpaceOnUse" x="0" y="0" width={size} height={size}>
            <ACircle
              cx={cx}
              cy={cx}
              r={geo.radius}
              stroke="#fff"
              strokeWidth={geo.glowStroke * 1.5}
              fill="none"
              strokeDasharray={`${C} ${C}`}
              rotation={-90}
              origin={`${cx}, ${cx}`}
              animatedProps={maskProps}
            />
          </Mask>
        </Defs>
        <Circle cx={cx} cy={cx} r={geo.radius} stroke={t.c.line} strokeWidth={1} fill="none" />
        <Path
          d={paths.upcoming}
          stroke={alpha(t.c.principal, 0.45)}
          strokeWidth={geo.stroke}
          strokeLinecap="round"
          fill="none"
        />
        <G mask="url(#drawMask)">
          <Path d={paths.paid} stroke={t.c.cash} strokeWidth={geo.stroke} strokeLinecap="round" fill="none" />
          {paths.due ? (
            <AG animatedProps={pulseProps}>
              <Path
                d={paths.due}
                stroke="url(#aurora)"
                strokeOpacity={0.4}
                strokeWidth={geo.glowStroke}
                strokeLinecap="round"
                fill="none"
              />
              <Path d={paths.due} stroke={t.c.emi} strokeWidth={geo.stroke} strokeLinecap="round" fill="none" />
            </AG>
          ) : null}
        </G>
      </Svg>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <Txt
          v="hero"
          size={centerSize}
          align="center"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ maxWidth: size * 0.7 }}
        >
          {center}
        </Txt>
        <Txt v="caption" color="textSecondary" align="center">
          {caption}
        </Txt>
      </View>
    </View>
  );
}

/** Linear version for loan cards: one stitch per installment up to 60, then per year. */
export function StitchProgress({
  count,
  paid,
  dueK,
  label,
}: {
  count: number;
  paid: number;
  dueK: number | null;
  label: string;
}) {
  const t = useTheme();
  const units = useMemo(() => stitchUnits(count, paid, dueK, 60), [count, paid, dueK]);
  const [w, setW] = React.useState(0);
  const per = units.length > 0 ? w / units.length : 0;
  const stroke = Math.min(6, Math.max(2.6, per * 0.5));
  const arc = Math.max(per * 0.62 - stroke, 0.3);
  const y = 5;
  const by: Record<StitchStatus, string> = { paid: '', due: '', upcoming: '' };
  units.forEach((u, i) => {
    const mid = (i + 0.5) * per;
    const len = arc * u.length;
    by[u.status] += `M${(mid - len / 2).toFixed(2)} ${y}H${(mid + len / 2).toFixed(2)}`;
  });
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      onLayout={e => setW(e.nativeEvent.layout.width)}
      style={{ height: 10 }}
    >
      {w > 0 ? (
        <Svg width={w} height={10}>
          <Path d={by.upcoming} stroke={alpha(t.c.principal, 0.45)} strokeWidth={stroke} strokeLinecap="round" />
          <Path d={by.paid} stroke={t.c.cash} strokeWidth={stroke} strokeLinecap="round" />
          <Path d={by.due} stroke={t.c.emi} strokeWidth={stroke} strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  );
}
