import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { Txt } from '@/components/primitives/Txt';
import { feedback } from '@/feedback';
import { MOTION } from '@/feedback/motion';
import { useT, type StringKey } from '@/i18n';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { auroraGradient } from '@/theme/tokens';

const TABS: Record<string, { icon: IconName; label: StringKey }> = {
  Calculator: { icon: 'calculator', label: 'tab.calculator' },
  Loans: { icon: 'bank', label: 'tab.loans' },
  Settings: { icon: 'gear', label: 'tab.settings' },
};

export const TAB_BAR_HEIGHT = 6 + 56 + 8;

/** Faux-glass tab bar (no live blur); hides while the keyboard is open. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  if (keyboard) {
    return null;
  }
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => (
        <TabItem
          key={route.key}
          name={route.name}
          active={state.index === i}
          onPress={() => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (state.index !== i && !e.defaultPrevented) {
              feedback.tap();
              navigation.navigate(route.name);
            }
          }}
        />
      ))}
    </View>
  );
}

function TabItem({ name, active, onPress }: { name: string; active: boolean; onPress: () => void }) {
  const s = useStyles();
  const t = useTheme();
  const i18n = useT();
  const reduce = useReducedMotion();
  const bounce = useSharedValue(1);
  useEffect(() => {
    if (active && !reduce) {
      bounce.value = withSequence(withTiming(1.12, { duration: MOTION.micro }), withSpring(1, MOTION.spring));
    }
  }, [active, reduce, bounce]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));
  const tab = TABS[name]!;
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={s.item}>
      <View style={[s.indicator, active && { backgroundImage: auroraGradient(t, 90) }]} />
      <Animated.View style={anim}>
        <Icon name={tab.icon} color={active ? t.c.emi : t.c.textSecondary} duotone={active} />
      </Animated.View>
      <Txt
        v="caption"
        size={13}
        weight={active ? 600 : 500}
        color={active ? 'textPrimary' : 'textSecondary'}
        numberOfLines={1}
      >
        {i18n.t(tab.label)}
      </Txt>
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: t.c.glass,
    borderTopWidth: 1,
    borderTopColor: t.c.line,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  item: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  indicator: { width: 36, height: 3, borderRadius: 2, marginBottom: 3 },
}));
