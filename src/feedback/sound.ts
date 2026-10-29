import Sound from 'react-native-sound';
import { useStore } from '@/state/store';

export type SoundName = 'tap' | 'toggle' | 'stitch' | 'success' | 'warn';
const NAMES: SoundName[] = ['tap', 'toggle', 'stitch', 'success', 'warn'];
const VOLUME = 0.35; // §15.3: never above 35%

const loaded = new Map<SoundName, Sound>();

/** Preload after the first render. Ambient on iOS: mixes with music, respects the silent switch. */
export function preloadSounds() {
  if (loaded.size > 0) {
    return;
  }
  Sound.setCategory('Ambient', true);
  for (const name of NAMES) {
    // Android: res/raw/<name>.wav; iOS: <name>.wav in the main bundle.
    const s: Sound = new Sound(`${name}.wav`, Sound.MAIN_BUNDLE, error => {
      if (!error) {
        s.setVolume(VOLUME);
        loaded.set(name, s);
      }
    });
  }
}

/** Fire-and-forget. Completely silent when Sound is off. Never call this on keystrokes. */
export function play(name: SoundName) {
  if (!useStore.getState().settings.sound) {
    return;
  }
  const s = loaded.get(name);
  if (s) {
    s.stop(() => s.play());
  }
}
