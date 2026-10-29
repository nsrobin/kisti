import { trigger } from 'react-native-haptic-feedback';
import { useStore } from '@/state/store';

const fire = (type: Parameters<typeof trigger>[0]) => () => {
  if (useStore.getState().settings.haptics) {
    trigger(type, { enableVibrateFallback: false, ignoreAndroidSystemSettings: false });
  }
};

/** Each one does nothing when Vibration is off (§25). */
export const haptics = {
  light: fire('impactLight'),
  medium: fire('impactMedium'),
  selection: fire('selection'),
  success: fire('notificationSuccess'),
  warning: fire('notificationWarning'),
};
