import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = createMMKV({ id: 'kisti' });

export const logDev = (...args: unknown[]) => {
  if (__DEV__) {
    console.warn('[kisti]', ...args);
  }
};

/** Synchronous MMKV adapter for zustand `persist`. Reads never throw. */
export const mmkvStorage: StateStorage = {
  getItem: name => {
    try {
      return mmkv.getString(name) ?? null;
    } catch (e) {
      logDev('storage read failed', e);
      return null;
    }
  },
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: name => {
    mmkv.remove(name);
  },
};
