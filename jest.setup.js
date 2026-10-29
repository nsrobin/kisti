/* eslint-env jest */
// Native modules have no implementation under Jest.
jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn() }));
jest.mock('react-native-sound', () => {
  function Sound(_name, _base, cb) {
    if (cb) {
      cb(null);
    }
  }
  Sound.prototype.play = jest.fn();
  Sound.prototype.setVolume = jest.fn(function () {
    return this;
  });
  Sound.prototype.stop = jest.fn();
  Sound.prototype.release = jest.fn();
  Sound.setCategory = jest.fn();
  Sound.MAIN_BUNDLE = '';
  return Sound;
});
jest.mock('react-native-bootsplash', () => ({ hide: jest.fn(() => Promise.resolve()) }));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
// In-memory MMKV (the real one needs the Nitro native module).
jest.mock('react-native-mmkv', () => {
  const data = new Map();
  return {
    createMMKV: () => ({
      getString: key => data.get(key),
      set: (key, value) => data.set(key, String(value)),
      remove: key => data.delete(key),
    }),
  };
});
