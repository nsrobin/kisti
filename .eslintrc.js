module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['docs/', 'coverage/', 'android/', 'ios/'],
  rules: {
    // Colours and spacing come from the active theme at render time, so many styles are
    // necessarily built inline; static shared styles still live in makeStyles().
    'react-native/no-inline-styles': 'off',
  },
};
