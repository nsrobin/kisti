import React, { useState, type ReactNode } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { feedback } from '@/feedback';
import { MOTION } from '@/feedback/motion';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import type { MoneyColor } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type Props = {
  title: string;
  icon: IconName;
  iconColor: MoneyColor;
  children: ReactNode;
  open?: boolean;
  onToggle?: (open: boolean) => void;
};

/** Measures its content once and animates height + chevron over 220 ms (fade when reduced). */
export function Accordion({ title, icon, iconColor, children, open: openProp, onToggle }: Props) {
  const t = useTheme();
  const s = useStyles();
  const reduce = useReducedMotion();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const height = useSharedValue(0);
  const progress = useDerivedValue(() =>
    withTiming(open ? 1 : 0, { duration: reduce ? MOTION.reduced : MOTION.standard, easing: MOTION.easing }),
  );

  const onLayout = (e: LayoutChangeEvent) => {
    height.value = e.nativeEvent.layout.height;
  };
  const bodyStyle = useAnimatedStyle(() => ({ height: height.value * progress.value, opacity: progress.value }));
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 180}deg` }] }));

  const toggle = () => {
    feedback.toggle();
    setOpenState(!open);
    onToggle?.(!open);
  };

  return (
    <View style={s.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={toggle} style={s.header}>
        <Icon name={icon} color={t.c[iconColor]} duotone />
        <Txt v="section" style={{ flex: 1 }}>
          {title}
        </Txt>
        <Animated.View style={chevron}>
          <Icon name="caretDown" color={t.c.textSecondary} size={20} />
        </Animated.View>
      </Pressable>
      {reduce ? (
        open ? (
          <Animated.View entering={FadeIn.duration(MOTION.reduced)} style={s.body}>
            {children}
          </Animated.View>
        ) : null
      ) : (
        <Animated.View style={[{ overflow: 'hidden' }, bodyStyle]}>
          {/* Absolute so it can be measured at full height while the wrapper animates. */}
          <View
            onLayout={onLayout}
            style={s.measure}
            pointerEvents={open ? 'auto' : 'none'}
            accessibilityElementsHidden={!open}
            importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
          >
            <View style={s.body}>{children}</View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  card: {
    backgroundColor: t.c.bgRaised,
    borderRadius: t.radius.section,
    borderWidth: 1,
    borderColor: t.c.line,
    boxShadow: t.shadow.card,
  },
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  measure: { position: 'absolute', left: 0, right: 0, top: 0 },
  body: { paddingHorizontal: 16, paddingBottom: 18, gap: 12 },
}));
