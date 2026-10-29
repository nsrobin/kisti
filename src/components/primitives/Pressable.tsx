import React, { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { MOTION } from '@/feedback/motion';

const APressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  scaleTo?: number;
};

/** Press feedback: scale 0.96 over 120 ms (none with reduce motion). */
export function PressableScale({ style, scaleTo = 0.96, onPressIn, onPressOut, ...rest }: Props) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <APressable
      {...rest}
      onPressIn={e => {
        setPressed(true);
        if (!reduce) {
          scale.value = withTiming(scaleTo, { duration: MOTION.micro });
        }
        onPressIn?.(e);
      }}
      onPressOut={e => {
        setPressed(false);
        scale.value = withTiming(1, { duration: MOTION.micro });
        onPressOut?.(e);
      }}
      style={[typeof style === 'function' ? style({ pressed }) : style, anim]}
    />
  );
}
