import { haptics } from './haptics';
import { play } from './sound';

/** Paired sound + haptic for the §15.2 moments. */
export const feedback = {
  tap: () => {
    play('tap');
    haptics.light();
  },
  toggle: () => {
    play('toggle');
    haptics.light();
  },
  stitch: () => {
    play('stitch');
    haptics.selection();
  },
  success: () => {
    play('success');
    haptics.success();
  },
  warn: () => {
    play('warn');
    haptics.warning();
  },
  medium: () => haptics.medium(),
};
