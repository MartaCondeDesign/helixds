# Getting started

How to use Helix in a React app. Browse every component first in the
[Storybook](https://martacondedesign.github.io/helixds/).

## Requirements

- React 19 (`react` and `react-dom` ≥ 19)
- Tailwind CSS v4, with its build step set up in your app ([Vite](https://tailwindcss.com/docs/installation/using-vite),
  [Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), or PostCSS)
- Node ≥ 20

## 1. Install

```bash
pnpm add @helixds/react @helixds/tokens @tabler/icons-react
```

## 2. Import the styles once

In the CSS file Tailwind processes (the one that has `@import "tailwindcss";` today), replace that line with:

```css
@import "@helixds/react/globals.css";
```

`globals.css` already imports Tailwind and `@helixds/tokens/helix.css` (every `--helix-*` custom
property, light and dark), then adds the component styles. Components style themselves through
`data-helix-*` attributes, so Tailwind doesn't need to scan `node_modules`.

## 3. Use a component

```tsx
import { Button, PageHeader } from '@helixds/react';
import { IconPlus } from '@tabler/icons-react';

export function ProjectsHeader() {
  return (
    <PageHeader
      label="Projects"
      description="Everything your team is working on."
      actions={
        <>
          <Button variant="secondary">Import</Button>
          <Button variant="primary" icon={IconPlus} onClick={() => {}}>New project</Button>
        </>
      }
    />
  );
}
```

Icons are passed by reference (`icon={IconPlus}`), never as `<IconPlus />`; Helix sizes them.

Each component's real props are in its contract, `@helixds/react/contracts/<Name>` (JSON), and in the
Storybook docs tab. Guessed props (`title`, `style`, `open`…) are usually wrong in Helix.

For your own CSS, use the tokens rather than raw values: `var(--helix-color-text-neutral)`,
`var(--helix-spacing-m)`, `var(--helix-radius-m)`. They follow the theme automatically.

## 4. Dark mode

Nothing to do for the default: Helix follows the operating system (`prefers-color-scheme`). To let
people choose, set `data-theme` on `<html>`:

```ts
document.documentElement.dataset.theme = 'dark';   // force dark
document.documentElement.dataset.theme = 'light';  // force light
delete document.documentElement.dataset.theme;     // back to the system setting
```

Every color pair in Helix passes WCAG 2.2 AA in both themes; keep your own colors on `--helix-color-*`
tokens and they will too.

## 5. Get your AI agent up to speed

Helix is built to be used by agents without guessing. Copy the agent guide to your project root, where
Claude, Cursor, Copilot and Codex look for it:

```bash
cp node_modules/@helixds/react/AGENTS.md ./AGENTS.md
```

Then connect the Helix MCP server (`.mcp.json` for Claude Code, `.cursor/mcp.json` for Cursor), so the agent
reads each component's contract and validates its JSX before writing it:

```json
{ "mcpServers": { "helix": { "command": "npx", "args": ["-y", "@helixds/mcp"] } } }
```

For hooks that enforce it (contract read before writing, lint after writing), run
`pnpm setup:ai <path-to-your-app>` from a clone of the Helix repo — see [AGENTS.md](../AGENTS.md).

## Lint

```bash
pnpm add -D @helixds/eslint-plugin
```

It flags raw colors and spacing, invented props and anti-synonyms (`<Button label>` instead of
children, `loading` instead of `isLoading`…) as you type. See [`packages/eslint-plugin/README.md`](../packages/eslint-plugin/README.md).
