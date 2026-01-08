import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unicornPlugin from 'eslint-plugin-unicorn';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

const nextRules = nextPlugin.configs?.['core-web-vitals']?.rules ?? {};
const tsFiles = ['**/*.{ts,tsx}'];
const jsRecommended = { ...js.configs.recommended, files: tsFiles };
const tsRecommended = tseslint.configs.recommended.map((config) => ({ ...config, files: tsFiles }));
const unicornRecommended = { ...unicornPlugin.configs.recommended, files: tsFiles };

export default tseslint.config(
  { ignores: ['node_modules', '.next', 'dist', 'out', 'coverage'] },
  {
    files: ['eslint.config.mjs'],
    plugins: {
      '@next/next': nextPlugin,
    },
  },
  jsRecommended,
  ...tsRecommended,
  unicornRecommended,
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@next/next': nextPlugin,
      prettier: eslintPluginPrettier,
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextRules,
      'react-refresh/only-export-components': 'off',
      'no-alert': 'error',
      'no-console': 'warn',
      'no-duplicate-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'off' } },
      ],
      '@typescript-eslint/member-ordering': 'error',
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      'class-methods-use-this': 'error',
      'unicorn/filename-case': 'off',
      'unicorn/explicit-length-check': 'off',
      'unicorn/no-negated-condition': 'off',
      'unicorn/better-regex': 'warn',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/no-lonely-if': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/switch-case-braces': 'off',
      'unicorn/number-literal-case': 'off',
      'unicorn/numeric-separators-style': 'off',
      'unicorn/prefer-array-some': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/prefer-dom-node-append': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/prefer-single-call': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/prefer-string-starts-ends-with': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/no-zero-fractions': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettierConfig,
);
