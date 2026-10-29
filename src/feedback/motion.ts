import { Easing } from 'react-native-reanimated';

// §15.1 motion tokens (tokens/motion.json).
export const MOTION = {
  micro: 120,
  standard: 220,
  emphasis: 420,
  reduced: 150,
  easing: Easing.bezier(0.2, 0, 0, 1),
  spring: { damping: 18, stiffness: 180, mass: 1 },
} as const;
