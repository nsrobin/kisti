module.exports = {
  preset: '@react-native/jest-preset',
  watchman: false,
  setupFiles: ['<rootDir>/jest.setup.js'],
  resolver: 'react-native-reanimated/jest/resolver',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*|phosphor-react-native)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/docs/'],
  collectCoverageFrom: ['src/core/**/*.ts', 'src/i18n/**/*.ts', 'src/state/**/*.ts'],
};
