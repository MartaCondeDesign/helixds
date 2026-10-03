// Helix's own usage rules (@helix-ds/eslint-plugin), applied to code that CONSUMES Helix — the apps.
// packages/core is the design system itself: it builds components out of native <button>/<input>, so the
// rules don't apply there.
import tseslint from 'typescript-eslint';
import helix from '@helix-ds/eslint-plugin';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/storybook-static/**'] },
  {
    ...helix.configs.recommended,
    files: ['apps/**/*.{js,jsx,ts,tsx}'],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
];
