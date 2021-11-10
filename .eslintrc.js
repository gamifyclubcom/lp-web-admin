/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: 'react-app',
  plugins: ['deprecation'],
  rules: {
    'deprecation/deprecation': process.env.CI ? 'off' : 'warn',
    'import/no-default-export': 'warn',
    'import/no-extraneous-dependencies': 'warn',
  },
  overrides: [
    {
      files: 'src/*.tsx',
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
};
