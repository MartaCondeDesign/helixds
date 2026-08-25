import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.stories.@(ts|tsx)',
    // ADR docs pages — MDX (not *.stories.tsx), so they need their own glob entry.
    // "ADR-*" excludes _template.mdx on purpose — it's a copy-paste starting point, not a
    // real decision record, and shouldn't show up as its own page in the sidebar.
    '../stories/Decisions/ADR-*.mdx',
  ],

  addons: [
    '@storybook/addon-essentials',   // Docs, Controls, Actions, Backgrounds, Viewport
    '@storybook/addon-a11y',         // Accessibility checks on every story
    '@storybook/addon-themes',       // Light / Dark theme switcher
    // Bare package name — NOT '/manager', NOT '/preview'. Storybook's addon resolver
    // special-cases any entry ending in "/manager" as manager-only (short-circuits before
    // ever checking for a "/preview" sibling); an entry ending in "/preview" that doesn't
    // itself match that short-circuit falls through to being probed as a preset instead
    // and silently contributes nothing. The bare name is the only form that makes the
    // resolver auto-discover BOTH the "./manager" and "./preview" exports below.
    '@helix-ds/storybook-addon-tokens',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  viteFinal: async (config) => {
    config.plugins ??= [];
    config.plugins.push(tailwindcss());

    // Allow Vite to serve files from the monorepo root.
    // The project path contains non-ASCII chars (Documentación) which causes
    // NFD/NFC mismatch between Vite's fs.allow check and the browser URL.
    // strict:false bypasses the check so @fs URLs resolve correctly.
    config.server ??= {};
    config.server.fs = { strict: false };

    // Resolve the bare "@helix-ds/core" import to TypeScript source so dist/
    // build is not required. Regex ensures subpaths like @helix-ds/core/globals.css
    // still resolve through the package's own exports map (which points to src/).
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const srcIndex  = path.resolve(__dirname, '../../../packages/core/src/index.ts');
    config.resolve ??= {};
    const existingAlias = config.resolve.alias;
    const aliasArray = Array.isArray(existingAlias) ? existingAlias : [];
    config.resolve.alias = [
      ...aliasArray,
      { find: /^@helix-ds\/core$/, replacement: srcIndex },
    ];

    // Force automatic JSX transform for all files including @fs-served packages/core files.
    // Without this, esbuild compiles JSX to React.createElement() (classic) instead of
    // _jsx() (automatic), which crashes components that don't explicitly import React.
    config.esbuild = {
      ...(config.esbuild ?? {}),
      jsx: 'automatic',
      jsxImportSource: 'react',
    };

    return config;
  },

  docs: {
    autodocs: 'tag',
  },
};

export default config;
