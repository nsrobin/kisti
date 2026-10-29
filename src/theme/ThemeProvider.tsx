import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useStore } from '@/state/store';
import { dark, light, type Theme } from './tokens';

const ThemeContext = createContext<Theme>(dark);

export function useResolvedScheme(): 'dark' | 'light' {
  const setting = useStore(s => s.settings.theme);
  const system = useColorScheme();
  return setting === 'system' ? (system === 'light' ? 'light' : 'dark') : setting;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useResolvedScheme();
  const theme = scheme === 'dark' ? dark : light;
  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      {children}
      <ThemeCrossFade theme={theme} />
    </ThemeContext.Provider>
  );
}

/** §15.2 theme switch: the old background fades out over the new theme (200 ms, 150 ms reduced). */
function ThemeCrossFade({ theme }: { theme: Theme }) {
  const prev = useRef(theme);
  const opacity = useSharedValue(0);
  const reduce = useReducedMotion();
  const color = useSharedValue(theme.c.bgBase);
  useEffect(() => {
    if (prev.current !== theme) {
      color.value = prev.current.c.bgBase;
      opacity.value = 1;
      opacity.value = withTiming(0, { duration: reduce ? 150 : 200 });
      prev.current = theme;
    }
  }, [theme, opacity, color, reduce]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, backgroundColor: color.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]} />;
}

export const useTheme = (): Theme => useContext(ThemeContext);

type Styles = Parameters<typeof StyleSheet.create>[0];

/** Memoised per theme: `const useStyles = makeStyles(t => ({ … }))`. */
export function makeStyles<S extends Styles>(fn: (t: Theme) => S & Styles): () => Readonly<S> {
  const cache = new WeakMap<Theme, Readonly<S>>();
  return () => {
    const t = useTheme();
    let s = cache.get(t);
    if (!s) {
      s = StyleSheet.create(fn(t));
      cache.set(t, s);
    }
    return s;
  };
}
