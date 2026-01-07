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
  jsRecommended,
  ...tsRecommended,
  unicornRecommended,
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@next/next': nextPlugin,
      prettier: eslintPluginPrettier
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error'
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextRules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-alert': 'error',
      'no-console': 'warn',
      'no-duplicate-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'off' } }
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
      'unicorn/number-literal-case': 'off',
      'unicorn/numeric-separators-style': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'prettier/prettier': 'error'
    }
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  prettierConfig
);
