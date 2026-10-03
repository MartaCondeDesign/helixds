import * as React from 'react';
import type { Preview, Decorator } from '@storybook/react';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

// 1. Load Helix tokens (CSS custom properties)
import '@helix-ds/tokens/helix.css';
// 2. Load Helix component CSS (globals.css with Tailwind + component styles)
import '@helix-ds/core/globals.css';
// 3. Storybook-only "Reduced motion" toolbar control — see withReducedMotion below.
import './reduced-motion.css';

// Toggles a class mirroring `@media (prefers-reduced-motion: reduce)` on <html> — a real OS setting
// can't be flipped from the browser, so this simulates it the same way the theme switcher below
// simulates dark mode via `data-theme` instead of `prefers-color-scheme`.
const withReducedMotion: Decorator = (Story, context) => {
  const reduced = context.globals.motion === 'reduce';
  React.useEffect(() => {
    document.documentElement.classList.toggle('sb-reduced-motion', reduced);
  }, [reduced]);
  return Story();
};

const preview: Preview = {
  // className is for developers (extra CSS classes on a component's root) — stories use it only to give a
  // field a fixed width. Kept out of the Controls panel so it isn't mistaken for a design property; the
  // value set in a story's args still applies.
  argTypes: {
    className: { table: { disable: true } },
  },

  globalTypes: {
    motion: {
      name: 'Motion',
      description: 'Simulate prefers-reduced-motion',
      defaultValue: 'no-preference',
      toolbar: {
        icon: 'lightning',
        items: [
          { value: 'no-preference', title: 'Motion: on' },
          { value: 'reduce', title: 'Motion: reduced' },
        ],
      },
    },
  },

  parameters: {
    options: {
      // Top-level sections in this fixed order; inside Components and Layout, components are ALPHABETICAL —
      // the same order as their Figma pages (rule: CLAUDE.md → "Alphabetical component order"). Stories
      // inside one component keep their file order (Default first). Storybook serializes this function,
      // so it must stay self-contained plain JavaScript (no outside references, no TS annotations).
      // @ts-expect-error -- untyped on purpose: Storybook evaluates this source as plain JS when indexing
      storySort: (a, b) => {
        const sections = ['Getting Started', 'Data', 'Changelog', 'Foundation', 'Icons', 'Components', 'Patterns', 'Pages', 'Layout'];
        const section = a.title.split('/')[0];
        const ia = sections.indexOf(section);
        const ib = sections.indexOf(b.title.split('/')[0]);
        const ra = ia === -1 ? sections.length : ia;
        const rb = ib === -1 ? sections.length : ib;
        if (ra !== rb) return ra - rb;
        if (a.title === b.title || (section !== 'Components' && section !== 'Layout')) return 0;
        return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
      },
    },
    // Background is driven by the theme switcher via CSS vars (--helix-color-fill-page).
    // Disabling the fixed backgrounds panel so it doesn't override the token-based body bg.
    backgrounds: { disable: true },
    // Docs page settings
    docs: {
      toc: true, // Table of contents in Docs
    },
    // a11y addon: WCAG 2.2 AA baseline
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },

  // Light / Dark theme switcher using data-theme attribute
  // Helix tokens read `[data-theme="dark"]` + `prefers-color-scheme: dark`
  decorators: [
    withReducedMotion,
    withThemeByDataAttribute({
      themes: {
        Light: 'light',
        Dark:  'dark',
      },
      defaultTheme: 'Light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
