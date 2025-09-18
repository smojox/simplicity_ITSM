module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    '@next/eslint-config-next'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off'
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      settings: {
        react: { version: 'detect' }
      },
      env: {
        browser: true,
        node: true,
        es6: true
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'dist/'
  ]
}