import eslintRecommended from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    files: ['**/*.ts', '**/*.js'], // Match files to lint
    ignores: ['dist/**', 'node_modules/**'], // Ignore specific folders
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
    rules: {
      ...eslintRecommended.rules,
      ...prettierRecommended.rules,
    },
  },
];
