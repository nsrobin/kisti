import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { MonthStatus } from '@/core/months';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';

/** The five calendar marks (tokens.stitch.calendarMarks), plus the final-installment knot. */
export function StatusMark({ status, final }: { status: MonthStatus; final?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 16 }}>
      {status === 'paid' ? <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: t.c.cash }} /> : null}
      {status === 'upcoming' ? (
        <View
          style={{ width: 22, height: 6, borderRadius: 3, borderWidth: 1.5, borderColor: alpha(t.c.principal, 0.45) }}
        />
      ) : null}
      {status === 'outside' ? (
        <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: t.c.textMuted }} />
      ) : null}
      {status === 'due' ? <DueRing /> : null}
      {final ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.c.interest }} /> : null}
    </View>
  );
}

/** Teal ring with an aurora glow and a slow 2 s pulse. */
function DueRing() {
  const t = useTheme();
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = reduce
      ? 1
      : withRepeat(withSequence(withTiming(0.6, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1);
  }, [o, reduce]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 2.5,
          borderColor: t.c.emi,
          boxShadow: `0px 0px 10px 0px ${alpha(t.aurora[0], 0.6)}, 0px 0px 16px 0px ${alpha(t.aurora[1], 0.35)}`,
        },
        anim,
      ]}
    />
  );
}
