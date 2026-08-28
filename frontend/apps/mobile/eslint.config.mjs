import expoConfig from 'eslint-config-expo/flat.js';

export default [
  ...expoConfig,
  {
    ignores: ['.expo/**', 'dist/**', 'coverage/**'],
  },
  {
    files: ['src/screens/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'react-native-safe-area-context',
          importNames: ['useSafeAreaInsets'],
          message: 'The root SafeAreaView already owns top and bottom insets. Reapplying them in a screen creates duplicate spacing; use a nested SafeAreaView only inside a native Modal.',
        }],
      }],
    },
  },
];
