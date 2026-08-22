import type { Preview } from '@storybook/react';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

// 1. Load Helix tokens (CSS custom properties)
import '@helix-ds/tokens/helix.css';
// 2. Load Helix component CSS (globals.css with Tailwind + component styles)
import '@helix-ds/core/globals.css';

const preview: Preview = {
  parameters: {
    // Sidebar order: Foundation → Icons → Components → Patterns → Pages
    options: {
      storySort: {
        order: ['Getting Started', 'Foundation', 'Icons', 'Components', 'Patterns', 'Pages', '*'],
        method: 'alphabetical',
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
