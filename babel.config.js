module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module-resolver', { root: ['./'], alias: { '@': './src' } }],
    // Must stay last (Reanimated 4).
    'react-native-worklets/plugin',
  ],
  env: {
    production: { plugins: ['transform-remove-console'] },
  },
};
