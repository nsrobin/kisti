import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { feedback } from '@/feedback';
import { MOTION } from '@/feedback/motion';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import { Icon } from './Icon';
import { Txt } from './Txt';

/** Warning icon + caption in status.error; fades in. */
export function InlineError({ message }: { message: string }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={FadeIn.duration(reduce ? MOTION.reduced : MOTION.standard)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}
    >
      <View style={{ paddingTop: 2 }}>
        <Icon name="warning" color={t.c.error} size={16} />
      </View>
      <Txt v="caption" color="error" style={{ flex: 1 }}>
        {message}
      </Txt>
    </Animated.View>
  );
}

/** Marigold banner; slides/fades in and plays the warn moment when it appears. */
export function WarningBanner({ message }: { message: string }) {
  const s = useStyles();
  const t = useTheme();
  const reduce = useReducedMotion();
  useEffect(() => {
    feedback.warn();
  }, []);
  return (
    <Animated.View
      entering={FadeIn.duration(reduce ? MOTION.reduced : MOTION.standard)}
      exiting={FadeOut.duration(MOTION.micro)}
      accessibilityRole="alert"
      style={s.banner}
    >
      <Icon name="warning" color={t.c.interest} size={22} />
      <Txt v="body" style={{ flex: 1 }}>
        {message}
      </Txt>
    </Animated.View>
  );
}

const useStyles = makeStyles(t => ({
  banner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: t.radius.input,
    backgroundColor: alpha(t.c.interest, 0.1),
    borderWidth: 1,
    borderColor: alpha(t.c.interest, 0.45),
  },
}));

/** Info icon + note in a quiet box (estimate note, assumption note). */
export function NoteBox({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: t.radius.input, backgroundColor: t.c.bgBase }}
    >
      <Icon name="info" color={t.c.textMuted} size={18} />
      <Txt v="caption" color="textMuted" style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}
