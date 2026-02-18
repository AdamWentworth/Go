// eslint.config.mjs

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/**/*.js', '@/types/**/*.js', '**/changeInstanceTag/**/*.js'],
              message: 'Use extensionless imports for local TypeScript modules.',
            },
          ],
        },
      ],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'alert',
          message: 'Use ModalContext.alert or toast, not browser alert().',
        },
        {
          name: 'confirm',
          message: 'Use ModalContext.confirm, not browser confirm().',
        },
        {
          name: 'prompt',
          message: 'Use app UI controls, not browser prompt().',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Use import.meta.env in browser source files.',
        },
        {
          object: 'window',
          property: 'alert',
          message: 'Use ModalContext.alert or toast, not window.alert().',
        },
        {
          object: 'window',
          property: 'confirm',
          message: 'Use ModalContext.confirm, not window.confirm().',
        },
        {
          object: 'window',
          property: 'prompt',
          message: 'Use app UI controls, not window.prompt().',
        },
        {
          object: 'globalThis',
          property: 'alert',
          message: 'Use ModalContext.alert or toast, not globalThis.alert().',
        },
        {
          object: 'globalThis',
          property: 'confirm',
          message: 'Use ModalContext.confirm, not globalThis.confirm().',
        },
        {
          object: 'globalThis',
          property: 'prompt',
          message: 'Use app UI controls, not globalThis.prompt().',
        },
      ],
    },
  },
];
