import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Allows `const { passwordHash, ...rest } = user` to drop a field.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
];
