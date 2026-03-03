import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const requireHere = createRequire(import.meta.url);
const requireWeb = createRequire(new URL('../../apps/web/package.json', import.meta.url));

const resolveModule = (specifier) => {
  try {
    return requireHere.resolve(specifier);
  } catch {
    return requireWeb.resolve(specifier);
  }
};

const load = async (specifier) =>
  import(pathToFileURL(resolveModule(specifier)).href);

const js = (await load('@eslint/js')).default;
const tseslint = (await load('typescript-eslint')).default;
const react = (await load('eslint-plugin-react')).default;
const reactHooks = (await load('eslint-plugin-react-hooks')).default;
const jsxA11y = (await load('eslint-plugin-jsx-a11y')).default;
const globals = (await load('globals')).default;

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
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/no-aria-hidden-on-focusable': 'error',
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
  {
    files: [
      'src/pages/Search/views/ListViewComponents/*ListView.tsx',
      'src/pages/Search/SearchParameters/VariantSearchInput.tsx',
    ],
    rules: {
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
    },
  },
];
