// Helix's own usage rules (@helixds/eslint-plugin), applied to code that CONSUMES Helix — the apps.
// packages/core is the design system itself: it builds components out of native <button>/<input>, so the
// rules don't apply there.
import tseslint from 'typescript-eslint';
import helix from '@helixds/eslint-plugin';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/storybook-static/**', 'apps/storybook/.proof/**'] },
  {
    ...helix.configs.recommended,
    files: ['apps/**/*.{js,jsx,ts,tsx}'],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  // Helix's own component stories: every one has working Controls (helix/story-has-controls). Claude Code's
  // lint hook hands a violation back to the agent, which fixes it in the same turn; `pnpm lint:stories` in
  // pre-commit stops anyone else's.
  {
    files: ['apps/storybook/stories/{Components,Layout}/**/*.stories.tsx'],
    rules: { 'helix/story-has-controls': 'error' },
  },
];
