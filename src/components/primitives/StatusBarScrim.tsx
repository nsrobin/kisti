import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

/** Faux-glass strip behind the status bar so scrolled content stays legible (edge-to-edge). */
export function StatusBarScrim() {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: t.c.glass }}
    />
  );
}
